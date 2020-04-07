import { PluginManager } from "../interfaces/pluginManager";


export class DefaultValidationManager {
  private pluginManager: PluginManager;

  constructor(pluginManager: PluginManager) {
    this.pluginManager = pluginManager;
  }

  validate(obj: { [key: string]: any }): boolean {
    if (obj.verb) {
      let messageTemplate = this.pluginManager.getMessageTemplate(obj.verb);
      if (messageTemplate) {
        return messageTemplate.validate(obj);
      }
    }

    return false;
  }
}
