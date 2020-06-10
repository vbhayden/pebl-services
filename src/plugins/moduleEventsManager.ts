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
    if (payload.smts && Array.isArray(payload.smts) && payload.smts.length > 0) {
      for (let event in payload.smts) {
        if (ModuleRating.is(payload.smts[event]))
          payload.smts[event] = new ModuleRating(payload.smts[event]);
        else if (ModuleFeedback.is(payload.stmts[event]))
          payload.smts[event] = new ModuleFeedback(payload.stmts[event]);
        else if (ModuleExample.is(payload.stmts[event]))
          payload.stmts[event] = new ModuleExample(payload.stmts[event]);
        else if (ModuleExampleRating.is(payload.stmts[event]))
          payload.stmts[event] = new ModuleExampleRating(payload.stmts[event]);
        else if (ModuleExampleFeedback.is(payload.stmts[event]))
          payload.stmts[event] = new ModuleExampleFeedback(payload.stmts[event]);
        else if (ModuleRemovedEvent.is(payload.stmts[event]))
          payload.stmts[event] = new ModuleRemovedEvent(payload.stmts[event]);
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
