import { PeBLPlugin } from "../models/peblPlugin";
import { ActionManager } from "../interfaces/actionManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Action } from "../models/action";
import { PermissionSet } from "../models/permission";
import { MessageTemplate } from "../models/messageTemplate";
import { SqlDataStore } from "../interfaces/SqlDataStore";

export class DefaultActionManager extends PeBLPlugin implements ActionManager {
  private sessionData: SessionDataManager;
  private sqlData: SqlDataStore;

  constructor(sessionData: SessionDataManager, sqlData: SqlDataStore) {
    super();
    this.sessionData = sessionData;
    this.sqlData = sqlData;
    // this.addMessageTemplate(new MessageTemplate("getActions",
    //   this.validateGetActions.bind(this),
    //   this.authorizeGetActions.bind(this),
    //   (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
    //     this.getActions(payload.identity, dispatchCallback);
    //   }));

    this.addMessageTemplate(new MessageTemplate("saveActions",
      this.validateSaveActions.bind(this),
      this.authorizeSaveActions.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.saveActions(payload.identity, payload.actions, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("getChapterCompletionPercentages",
      this.validateGetChapterCompletionPercentages.bind(this),
      this.authorizeGetChapterCompletionPercentages.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getChapterCompletionPercentages(payload.identity, payload.params, dispatchCallback)
      }))

    // this.addMessageTemplate(new MessageTemplate("deleteAction",
    //   this.validateDeleteAction.bind(this),
    //   this.authorizeDeleteAction.bind(this),
    //   (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
    //     this.deleteAction(payload.identity, payload.xId, dispatchCallback);
    //   }));
  }

  // validateGetActions(payload: { [key: string]: any }): boolean {
  //   //TODO
  //   return true;
  // }

  // authorizeGetActions(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
  //   let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
  //   let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

  //   return canUser || canGroup;
  // }

  validateGetChapterCompletionPercentages(payload: { [key: string]: any }): boolean {
    if (payload.params && Array.isArray(payload.params) && payload.params.length > 0) {
      for (let params of payload.params) {
        if (!params.bookId || typeof params.bookId !== 'string' || params.bookId.length === 0)
          return false;
        if (!params.teamId || typeof params.teamId !== 'string' || params.teamId.length === 0)
          return false;
        if (!params.classId || typeof params.classId !== 'string' || params.classId.length == 0)
          return false;
        if (!params.timestamp || typeof params.timestamp !== 'number')
          return false;
      }
      return true;
    }
    return false;
  }

  authorizeGetChapterCompletionPercentages(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    if (username !== payload.identity || !permissions.user[payload.requestType])
      return false;

    for (let params of payload.params) {
      if (!permissions.group[params.classId] || !permissions.group[params.classId][payload.requestType])
        return false;
    }

    return true;
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
    if (permissions.user[payload.requestType]) {
      for (let key in payload.actions) {
        let obj = payload.actions[key];
        let identity = (<Action>obj).getActorId();
        let canUser = (username == identity);
        // let canGroup = permissions.group[identity] && permissions.group[identity][obj.requestType]

        if (!(canUser // || canGroup
        ))
          return false;
      }
    }

    return true;
  }

  // validateDeleteAction(payload: { [key: string]: any }): boolean {
  //   if (payload.xId && typeof payload.xId === "string")
  //     return true;
  //   return false;
  // }

  // authorizeDeleteAction(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
  //   let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
  //   let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

  //   return canUser || canGroup;
  // }

  // getActions(identity: string, callback: ((actions: Action[]) => void)): void {
  //   this.sessionData.getHashValues(generateUserActionsKey(identity),
  //     (result: string[]) => {
  //       callback(result.map(function(x) {
  //         return new Action(JSON.parse(x));
  //       }));
  //     });
  // }

  getChapterCompletionPercentages(identity: string, params: { [key: string]: any }[], callback: ((data: any) => void)): void {
    for (let param of params) {
      this.sqlData.getLogins(param.teamId, param.classId, param.timestamp, (logins) => {
        if (logins.length > 0) {
          this.sqlData.getCompletions(param.bookId, param.teamId, param.classId, param.timestamp, (completions) => {
            let completionsByChapter = {} as { [key: string]: any };
            for (let completion of completions) {
              if (!completionsByChapter[completion.chapter])
                completionsByChapter[completion.chapter] = 0;
              completionsByChapter[completion.chapter]++;
            }

            for (let chapter in completionsByChapter) {
              completionsByChapter[chapter] = (completionsByChapter[chapter] / logins.length) * 100;
            }

            callback({ data: completionsByChapter });
          })
        } else {
          callback({ data: {} });
        }
      })
    }
  }

  saveActions(identity: string, actions: Action[], callback: ((success: boolean) => void)): void {
    let arr = [];
    let completions = [];
    for (let action of actions) {
      arr.push(JSON.stringify(action));
      if (Action.isCompletion(action))
        completions.push(action);
    }
    this.sessionData.queueForLrs(arr);
    if (completions.length > 0) {
      this.sqlData.insertCompletions(completions);
    }
    callback(true);
  }

  // deleteAction(identity: string, id: string, callback: ((success: boolean) => void)): void {
  //   this.sessionData.getHashValue(generateUserActionsKey(identity), generateActionsKey(id), (data) => {
  //     if (data) {
  //       this.sessionData.queueForLrsVoid(data);
  //     }
  //     this.sessionData.deleteHashValue(generateUserActionsKey(identity),
  //       generateUserActionsKey(id), (result: boolean) => {
  //         if (!result) {
  //           auditLogger.report(LogCategory.PLUGIN, Severity.ERROR, "DelActionFail", identity, id);
  //           callback(false);
  //         } else
  //           callback(true);
  //       });
  //   });
  // }
}
