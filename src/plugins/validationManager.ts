import { MessageTemplate } from "../models/messageTemplate";
import { PeBLPlugin } from "../models/peblPlugin";


export class DefaultValidationManager {
  private registeredTemplates: { [key: string]: MessageTemplate } = {};

  constructor() {

  }


  isValid(fieldValue: any, fieldType: string): boolean {
    if (fieldValue instanceof Array) {
      if ((fieldType != "array") && (fieldType != "?array")) {
        return false
      }
    } else if (fieldValue instanceof Boolean) {
      if ((fieldType != "boolean") && (fieldType != "?boolean")) {
        return false
      }
    } else if (fieldValue instanceof String) {
      if ((fieldType != "string") && (fieldType != "?string")) {
        return false
      }
    } else if (fieldValue instanceof Number) {
      if ((fieldType != "number") && (fieldType != "?number")) {
        return false
      }
    } else if (fieldValue instanceof Object) {
      if ((fieldType != "object") && (fieldType != "?object")) {
        return false
      }
    } else {
      return false;
    }

    return true;
  }

  validate(obj: { [key: string]: any }): boolean {
    if (obj.verb) {
      let messageTemplate = this.registeredTemplates[obj.verb];
      if (messageTemplate) {
        for (let field in obj) {
          let fieldType = messageTemplate[field];
          let fieldValue = obj[field];

          if (!this.isValid(fieldValue, fieldType)) {
            return false
          }
        }

        for (let field in messageTemplate) {
          let fieldType = messageTemplate[field];
          let fieldValue = obj[field];

          if (!this.isValid(fieldValue, fieldType)) {
            return false
          }
        }
      }
    }

    return false;
  }

  register(plugin: PeBLPlugin): void {
    let messageTemplates = plugin.getMessageTemplates();
    for (let messageTemplate of messageTemplates) {
      if (!this.registeredTemplates[messageTemplate.verb]) {
        this.registeredTemplates[messageTemplate.verb] = messageTemplate;
      } else {
        console.log("Overwriting " + messageTemplate.verb);
      }
    }
  }
}
