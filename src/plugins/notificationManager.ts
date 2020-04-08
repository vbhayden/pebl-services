import { PeBLPlugin } from "../models/peblPlugin";
import { NotificationManager } from "../interfaces/notificationManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { XApiStatement } from "../models/xapiStatement";
import { generateUserNotificationsKey, generateNotificationsKey } from "../utils/constants";

export class DefaultNotificationManager extends PeBLPlugin implements NotificationManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    console.log(this.sessionData);
  }

  validateGetNotifications(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveNotifications(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteNotifications(payload: { [key: string]: any }): boolean {
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
      arr.push(generateNotificationsKey(notification.id));
      arr.push(JSON.stringify(notification));
    }
    this.sessionData.setHashValues(generateUserNotificationsKey(identity), arr);
  }

  deleteNotification(identity: string, id: string): void {
    this.sessionData.deleteHashValue(generateUserNotificationsKey(identity),
      generateNotificationsKey(id),
      (result: boolean) => {
        if (!result) {
          console.log("failed to remove notification", id)
        }
      });
  }

}
