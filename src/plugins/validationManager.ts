import { PluginManager } from "../interfaces/pluginManager";


export class DefaultValidationManager {
  private pluginManager: PluginManager;

  constructor(pluginManager: PluginManager) {
    this.pluginManager = pluginManager;
  }

  isMessageFormat(obj: any): boolean {
    if (obj instanceof Object) {
      if (obj.requestType && obj.identity) {
        return true;
      }
    }
    return false;
  }

  validate(obj: any): boolean {
    if (this.isMessageFormat(obj)) {
      let messageTemplate = this.pluginManager.getMessageTemplate(obj.requestType);
      if (messageTemplate) {
        return messageTemplate.validate(obj);
      }
    }

    return false;
  }
}
