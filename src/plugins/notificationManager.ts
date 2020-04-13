import { PeBLPlugin } from "../models/peblPlugin";
import { NotificationManager } from "../interfaces/notificationManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { XApiStatement } from "../models/xapiStatement";
import { generateUserNotificationsKey, generateNotificationsKey } from "../utils/constants";
import { ServiceMessage } from "../models/serviceMessage";

export class DefaultNotificationManager extends PeBLPlugin implements NotificationManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    // this.addMessageTemplate(new MessageTemplate("getNotifications",
    //   this.validateGetNotifications,
    //   (payload) => {
    //     this.getNotifications(payload.identity, payload.callback);
    //   }));

    // this.addMessageTemplate(new MessageTemplate("saveNotifications",
    //   this.validateSaveNotifications,
    //   (payload) => {
    //     this.saveNotifications(payload.identity, payload.notifications);
    //   }));

    // this.addMessageTemplate(new MessageTemplate("deleteNotification",
    //   this.validateDeleteNotification,
    //   (payload) => {
    //     this.deleteNotification(payload.identity, payload.xId);
    //   }));
  }

  validateGetNotifications(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveNotifications(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteNotification(payload: { [key: string]: any }): boolean {
    return false;
  }


  getNotifications(identity: string, callback: ((notifications: XApiStatement[]) => void)): void {
    this.sessionData.getHashValues(generateUserNotificationsKey(identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new XApiStatement(JSON.parse(x));
        }));
      })
  }

  saveNotifications(identity: string, notifications: XApiStatement[]): void {
    let arr = [];
    for (let notification of notifications) {
      let notificationStr = JSON.stringify(notification);
      arr.push(generateNotificationsKey(notification.id));
      arr.push(notificationStr);
      this.sessionData.queueForLrs(notificationStr);
    }
    this.sessionData.setHashValues(generateUserNotificationsKey(identity), arr);
    this.sessionData.broadcast('realtime:userid:' + identity, JSON.stringify(new ServiceMessage({
      identity: identity,
      payload: {
        requestType: "newNotifications",
        data: notifications
      }
    })));
  }

  deleteNotification(identity: string, id: string): void {
    this.sessionData.getHashValue(generateUserNotificationsKey(identity), generateNotificationsKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
      }
      this.sessionData.deleteHashValue(generateUserNotificationsKey(identity),
        generateNotificationsKey(id), (result: boolean) => {
          if (!result) {
            console.log("failed to remove notification", id);
          }
        });
    });
  }

}
