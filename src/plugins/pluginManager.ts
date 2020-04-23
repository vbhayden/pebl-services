import { PluginManager } from "../interfaces/pluginManager";
import { MessageTemplate } from "../models/messageTemplate";
import { PeBLPlugin } from "../models/peblPlugin";
import { auditLogger } from "../main";


export class DefaultPluginManager implements PluginManager {
  private registeredTemplates: { [key: string]: MessageTemplate } = {};

  constructor() {

  }

  getMessageTemplates(): { [key: string]: MessageTemplate } {
    return this.registeredTemplates;
  }

  getMessageTemplate(verb: string): MessageTemplate | null {
    return this.registeredTemplates[verb];
  }

  register<T extends PeBLPlugin>(plugin: T): void {
    let messageTemplates = plugin.getMessageTemplates();
    for (let messageTemplate of messageTemplates) {
      if (!this.registeredTemplates[messageTemplate.verb]) {
        this.registeredTemplates[messageTemplate.verb] = messageTemplate;
      } else {
        auditLogger.error("Overwriting Plugin Message Template", messageTemplate.verb);
      }
    }
  }
}
