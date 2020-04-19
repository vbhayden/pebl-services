import { PeBLPlugin } from "../models/peblPlugin";
import { ActionManager } from "../interfaces/actionManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Action } from "../models/action";
import { generateUserActionsKey, generateActionsKey } from "../utils/constants";
import { PermissionSet } from "../models/permission";
import { MessageTemplate } from "../models/messageTemplate";

export class DefaultActionManager extends PeBLPlugin implements ActionManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    this.addMessageTemplate(new MessageTemplate("getActions",
      this.validateGetActions.bind(this),
      this.authorizeGetActions.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getActions(payload.identity, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveActions",
      this.validateSaveActions.bind(this),
      this.authorizeSaveActions.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.saveActions(payload.identity, payload.actions, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteAction",
      this.validateDeleteAction.bind(this),
      this.authorizeDeleteAction.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.deleteAction(payload.identity, payload.xId, dispatchCallback);
      }));
  }

  validateGetActions(payload: { [key: string]: any }): boolean {
    //TODO
    return true;
  }

  authorizeGetActions(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  validateSaveActions(payload: { [key: string]: any }): boolean {
    if (payload.actions && Array.isArray(payload.actions) && payload.actions.length > 0) {
      for (let action in payload.actions) {
        if (Action.is(payload.actions[action])) {
          payload.actions[action] = new Action(payload.actions[action]);
        }
        else
          return false;
      }
      return true;
    }
    return false;
  }

  authorizeSaveActions(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  validateDeleteAction(payload: { [key: string]: any }): boolean {
    if (payload.xId && typeof payload.xId === "string")
      return true;
    return false;
  }

  authorizeDeleteAction(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  getActions(identity: string, callback: ((actions: Action[]) => void)): void {
    this.sessionData.getHashValues(generateUserActionsKey(identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new Action(JSON.parse(x));
        }));
      });
  }

  saveActions(identity: string, actions: Action[], callback: ((success: boolean) => void)): void {
    let arr = [];
    for (let action of actions) {
      let actionStr = JSON.stringify(action);
      arr.push(generateActionsKey(action.id));
      arr.push(actionStr);
      this.sessionData.queueForLrs(actionStr);
    }
    this.sessionData.setHashValues(generateUserActionsKey(identity), arr);
    callback(true);
  }

  deleteAction(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.getHashValue(generateUserActionsKey(identity), generateActionsKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
      }
      this.sessionData.deleteHashValue(generateUserActionsKey(identity),
        generateUserActionsKey(id), (result: boolean) => {
          if (!result) {
            console.log("failed to remove action", id);
            callback(false);
          } else
            callback(true);
        });
    });
  }
}
