import { MessageTemplate } from "../models/messageTemplate";
import { PeBLPlugin } from "../models/peblPlugin";


export class DefaultValidationManager {
  private registeredTemplates: { [key: string]: MessageTemplate } = {};

  constructor() {

  }

  validate(obj: { [key: string]: any }): boolean {
    if (obj.verb) {
      let messageTemplate = this.registeredTemplates[obj.verb];
      if (messageTemplate) {
        return messageTemplate.validate(obj);
      }
    }

    return false;
  }

  register<T extends PeBLPlugin>(plugin: T): void {
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
