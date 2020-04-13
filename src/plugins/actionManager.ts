import { PeBLPlugin } from "../models/peblPlugin";
import { ActionManager } from "../interfaces/actionManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { MessageTemplate } from "../models/messageTemplate";
import { Action } from "../models/action";
import { generateUserActionsKey, generateActionsKey } from "../utils/constants";

export class DefaultActionManager extends PeBLPlugin implements ActionManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    this.addMessageTemplate(new MessageTemplate("getActions",
      this.validateGetActions,
      (payload: { [key: string]: any }) => {
        this.getActions(payload.identity, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveActions",
      this.validateSaveActions,
      (payload: { [key: string]: any }) => {
        this.saveActions(payload.identity, payload.actions, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteAction",
      this.validateDeleteAction,
      (payload: { [key: string]: any }) => {
        this.deleteAction(payload.identity, payload.xId, payload.callback);
      }));
  }

  validateGetActions(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  validateSaveActions(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  validateDeleteAction(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
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