import { PeBLPlugin } from "../models/peblPlugin";
import { NotificationManager } from "../interfaces/notificationManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { XApiStatement } from "../models/xapiStatement";
import { generateUserNotificationsKey, generateNotificationsKey, generateBroadcastQueueForUserId } from "../utils/constants";
import { ServiceMessage } from "../models/serviceMessage";
import { MessageTemplate } from "../models/messageTemplate";
import { PermissionSet } from "../models/permission";

export class DefaultNotificationManager extends PeBLPlugin implements NotificationManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    this.addMessageTemplate(new MessageTemplate("getNotifications",
      this.validateGetNotifications.bind(this),
      this.authorizeGetNotifications.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getNotifications(payload.identity, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveNotifications",
      this.validateSaveNotifications.bind(this),
      this.authorizeSaveNotifications.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.saveNotifications(payload.identity, payload.notifications, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteNotification",
      this.validateDeleteNotification.bind(this),
      this.authorizeDeleteNotification.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.deleteNotification(payload.identity, payload.xId, dispatchCallback);
      }));
  }

  validateGetNotifications(payload: { [key: string]: any }): boolean {
    return true;
  }

  authorizeGetNotifications(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {

    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  validateSaveNotifications(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeSaveNotifications(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteNotification(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeDeleteNotification(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }


  getNotifications(identity: string, callback: ((notifications: XApiStatement[]) => void)): void {
    this.sessionData.getHashValues(generateUserNotificationsKey(identity),
      (result: string[]) => {
        callback(result.map((x) => new XApiStatement(JSON.parse(x))));
      })
  }

  saveNotifications(identity: string, notifications: XApiStatement[], callback: ((success: boolean) => void)): void {
    let arr = [];
    for (let notification of notifications) {
      let notificationStr = JSON.stringify(notification);
      arr.push(generateNotificationsKey(notification.id));
      arr.push(notificationStr);
      this.sessionData.queueForLrs(notificationStr);
    }
    this.sessionData.setHashValues(generateUserNotificationsKey(identity), arr);
    this.sessionData.broadcast(generateBroadcastQueueForUserId(identity), JSON.stringify(new ServiceMessage(identity, {
      requestType: "newNotifications",
      data: notifications
    })));
    callback(true);
  }

  deleteNotification(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.getHashValue(generateUserNotificationsKey(identity), generateNotificationsKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
      }
      this.sessionData.deleteHashValue(generateUserNotificationsKey(identity),
        generateNotificationsKey(id), (result: boolean) => {
          if (!result) {
            console.log("failed to remove notification", id);
          }
          callback(result);
        });
    });
  }

}
