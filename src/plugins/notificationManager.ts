import { PeBLPlugin } from "../models/peblPlugin";
import { NotificationManager } from "../interfaces/notificationManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { XApiStatement, Voided } from "../models/xapiStatement";
import { generateUserNotificationsKey, generateNotificationsKey, generateBroadcastQueueForUserId, generateTimestampForNotification } from "../utils/constants";
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
        this.getNotifications(payload.identity, payload.timestamp, dispatchCallback);
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
    return false; //TODO
  }

  authorizeSaveNotifications(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  validateDeleteNotification(payload: { [key: string]: any }): boolean {
    if (typeof payload.xId === "string")
      return true;
    return false;
  }

  authorizeDeleteNotification(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }


  getNotifications(identity: string, timestamp: number, callback: ((notifications: XApiStatement[]) => void)): void {
    this.sessionData.getValuesGreaterThanTimestamp(generateTimestampForNotification(identity), timestamp, (data) => {
      this.sessionData.getHashMultiField(generateUserNotificationsKey(identity), data.map((x) => generateNotificationsKey(x)), (result) => {
        callback(result.map(function(x) {
          let obj = JSON.parse(x);
          if (XApiStatement.is(obj))
            return new XApiStatement(obj);
          else
            return new Voided(obj);
        }));
      });
    });
  }

  saveNotifications(identity: string, notifications: XApiStatement[], callback: ((success: boolean) => void)): void {
    let arr = [];
    let date = new Date();
    for (let notification of notifications) {
      notification.stored = date.toISOString();
      let notificationStr = JSON.stringify(notification);
      arr.push(generateNotificationsKey(notification.id));
      arr.push(notificationStr);
      this.sessionData.addTimestampValue(generateTimestampForNotification(identity), date.getTime(), notification.id);
    }
    this.sessionData.setHashValues(generateUserNotificationsKey(identity), arr);
    this.sessionData.broadcast(generateBroadcastQueueForUserId(identity), JSON.stringify(new ServiceMessage(identity, {
      requestType: "getNotifications",
      data: notifications
    })));
    callback(true);
  }

  deleteNotification(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.getHashValue(generateUserNotificationsKey(identity), generateNotificationsKey(id), (data) => {
      if (data) {
        let voided = new XApiStatement(JSON.parse(data)).toVoidRecord();
        this.sessionData.addTimestampValue(generateTimestampForNotification(identity), new Date(voided.stored).getTime(), voided.id);
        this.sessionData.setHashValues(generateUserNotificationsKey(identity), [generateNotificationsKey(voided.id), JSON.stringify(voided)]);
        this.sessionData.broadcast(generateBroadcastQueueForUserId(identity), JSON.stringify(new ServiceMessage(identity, {
          requestType: "getNotifications",
          data: voided
        })));
      }
      this.sessionData.deleteSortedTimestampMember(generateTimestampForNotification(identity),
        id,
        (deleted: number) => {
          this.sessionData.deleteHashValue(generateUserNotificationsKey(identity),
            generateNotificationsKey(id), (result: boolean) => {
              if (!result) {
                console.log("failed to remove notification", id);
              }
              callback(result);
            });
        });
    });
  }

}
