import { PeBLPlugin } from "../models/peblPlugin";
import { NavigationManager } from "../interfaces/navigationManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { generateUserNavigationsKey, generateNavigationsKey } from "../utils/constants";
import { MessageTemplate } from "../models/messageTemplate";
import { PermissionSet } from "../models/permission";
import { Navigation } from "../models/navigation";

export class DefaultNavigationManager extends PeBLPlugin implements NavigationManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    this.addMessageTemplate(new MessageTemplate("getNavigations",
      this.validateGetNavigations.bind(this),
      this.authorizeGetNavigations.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getNavigations(payload.identity, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveNavigations",
      this.validateSaveNavigations.bind(this),
      this.authorizeSaveNavigations.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.saveNavigations(payload.identity, payload.navigations, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteNavigation",
      this.validateDeleteNavigation.bind(this),
      this.authorizeDeleteNavigation.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.deleteNavigation(payload.identity, payload.xId, dispatchCallback);
      }));
  }

  validateGetNavigations(payload: { [key: string]: any }): boolean {
    return true;
  }

  authorizeGetNavigations(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  validateSaveNavigations(payload: { [key: string]: any }): boolean {
    if (payload.navigations && Array.isArray(payload.navigations) && payload.navigations.length > 0) {
      for (let nav in payload.navigations) {
        if (Navigation.is(payload.navigations[nav]))
          payload.navigations[nav] = new Navigation(payload.navigations[nav]);
        else
          return false;
      }
      return true;
    }
    return false;
  }

  authorizeSaveNavigations(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  validateDeleteNavigation(payload: { [key: string]: any }): boolean {
    if (payload.xId && typeof payload.xId === "string")
      return true;
    return false;
  }

  authorizeDeleteNavigation(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  getNavigations(identity: string, callback: ((navigations: Navigation[]) => void)): void {
    this.sessionData.getHashValues(generateUserNavigationsKey(identity),
      (result: string[]) => {
        callback(result.map((x) => new Navigation(JSON.parse(x))));
      })
  }

  saveNavigations(identity: string, navigations: Navigation[], callback: ((success: boolean) => void)): void {
    // let arr = [];
    for (let navigation of navigations) {
      let navigationStr = JSON.stringify(navigation);
      // arr.push(generateNavigationsKey(navigation.id));
      // arr.push(navigationStr);
      this.sessionData.queueForLrs(navigationStr);
    }
    // this.sessionData.setHashValues(generateUserNavigationsKey(identity), arr);

    callback(true);
  }

  deleteNavigation(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.getHashValue(generateUserNavigationsKey(identity), generateNavigationsKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
      }
      this.sessionData.deleteHashValue(generateUserNavigationsKey(identity),
        generateNavigationsKey(id), (result: boolean) => {
          if (!result) {
            console.log("failed to remove navigation", id);
          }
          callback(result);
        });
    });
  }

}
