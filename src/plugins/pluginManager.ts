import { PluginManager } from "../interfaces/pluginManager";
import { MessageTemplate } from "../models/messageTemplate";
import { PeBLPlugin } from "../models/peblPlugin";
import { auditLogger } from "../main";
import { LogCategory, Severity } from "../utils/constants";


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
        auditLogger.report(LogCategory.SYSTEM, Severity.INFO, "AddPluginVerb", messageTemplate.verb)
        this.registeredTemplates[messageTemplate.verb] = messageTemplate;
      } else {
        auditLogger.report(LogCategory.SYSTEM, Severity.CRITICAL, "OverwrotePluginMsgTemplate", messageTemplate.verb);
      }
    }
  }
}
