import { PluginManager } from "../interfaces/pluginManager";


export class DefaultValidationManager {
  private pluginManager: PluginManager;

  constructor(pluginManager: PluginManager) {
    this.pluginManager = pluginManager;
  }

  validate(obj: { [key: string]: any }): boolean {
    if (obj.requestType) {
      let messageTemplate = this.pluginManager.getMessageTemplate(obj.requestType);
      if (messageTemplate) {
        return messageTemplate.validate(obj);
      }
    }

    return false;
  }
}
