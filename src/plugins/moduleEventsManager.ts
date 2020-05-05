import { PeBLPlugin } from "../models/peblPlugin";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { ModuleEventsManager } from "../interfaces/moduleEventsManager";
import { ModuleEvent } from "../models/moduleEvent";
import { generateUserModuleEventsKey, generateModuleEventsKey, LogCategory, Severity } from "../utils/constants";
import { MessageTemplate } from "../models/messageTemplate";
import { PermissionSet } from "../models/permission";
import { auditLogger } from "../main";

export class DefaultModuleEventsManager extends PeBLPlugin implements ModuleEventsManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;

    this.addMessageTemplate(new MessageTemplate("getModuleEvents",
      this.validateGetModuleEvents.bind(this),
      this.authorizeGetModuleEvents.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getModuleEvents(payload.identity, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveModuleEvents",
      this.validateSaveModuleEvents.bind(this),
      this.authorizeSaveModuleEvents.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.saveModuleEvents(payload.identity, payload.events, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteModuleEvent",
      this.validateDeleteModuleEvent.bind(this),
      this.authorizeDeleteModuleEvent.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.deleteModuleEvent(payload.identity, payload.xId, dispatchCallback);
      }));
  }

  validateGetModuleEvents(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeGetModuleEvents(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveModuleEvents(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeSaveModuleEvents(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteModuleEvent(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeDeleteModuleEvent(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  getModuleEvents(identity: string, callback: ((events: ModuleEvent[]) => void)): void {
    this.sessionData.getHashValues(generateUserModuleEventsKey(identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new ModuleEvent(JSON.parse(x));
        }));
      });
  }

  saveModuleEvents(identity: string, events: ModuleEvent[], callback: ((success: boolean) => void)): void {
    let arr = [];
    for (let event of events) {
      let eventStr = JSON.stringify(event);
      arr.push(generateModuleEventsKey(event.id));
      arr.push(eventStr);
      this.sessionData.queueForLrs(eventStr);
    }
    this.sessionData.setHashValues(generateUserModuleEventsKey(identity), arr);
    callback(true);
  }

  deleteModuleEvent(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.getHashValue(generateUserModuleEventsKey(identity), generateModuleEventsKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
      }
      this.sessionData.deleteHashValue(generateUserModuleEventsKey(identity),
        generateModuleEventsKey(id), (result: boolean) => {
          if (!result) {
            auditLogger.report(LogCategory.PLUGIN, Severity.ERROR, "DelModuleEvent", identity, id);
          }
          callback(result);
        });
    });
  }
}
