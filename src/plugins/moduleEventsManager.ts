import { PeBLPlugin } from "../models/peblPlugin";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { ModuleEventsManager } from "../interfaces/moduleEventsManager";
import { ModuleEvent, ModuleRating, ModuleFeedback, ModuleExample, ModuleExampleRating, ModuleExampleFeedback, ModuleRemovedEvent } from "../models/moduleEvent";
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
    return true;
  }

  authorizeGetModuleEvents(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  validateSaveModuleEvents(payload: { [key: string]: any }): boolean {
    if (payload.events && Array.isArray(payload.events) && payload.events.length > 0) {
      for (let event in payload.events) {
        if (ModuleRating.is(payload.events[event]))
          payload.events[event] = new ModuleRating(payload.events[event]);
        else if (ModuleFeedback.is(payload.events[event]))
          payload.events[event] = new ModuleFeedback(payload.events[event]);
        else if (ModuleExample.is(payload.events[event]))
          payload.events[event] = new ModuleExample(payload.events[event]);
        else if (ModuleExampleRating.is(payload.events[event]))
          payload.events[event] = new ModuleExampleRating(payload.events[event]);
        else if (ModuleExampleFeedback.is(payload.events[event]))
          payload.events[event] = new ModuleExampleFeedback(payload.events[event]);
        else if (ModuleRemovedEvent.is(payload.events[event]))
          payload.events[event] = new ModuleRemovedEvent(payload.events[event]);
        else
          return false;
      }
      return true;
    }
    return false;
  }

  authorizeSaveModuleEvents(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  validateDeleteModuleEvent(payload: { [key: string]: any }): boolean {
    if (payload.xId && typeof payload.xId == "string")
      return true;
    return false;
  }

  authorizeDeleteModuleEvent(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
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
    for (let stmt of events) {
      let stmtStr = JSON.stringify(stmt);
      this.sessionData.queueForLrs(stmtStr);
    }
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
