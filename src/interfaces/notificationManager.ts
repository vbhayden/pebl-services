import { PeBLPlugin } from "../models/peblPlugin";
import { XApiStatement } from "../models/xapiStatement";

export interface NotificationManager extends PeBLPlugin {


  validateGetNotifications(payload: { [key: string]: any }): boolean;
  validateSaveNotifications(payload: { [key: string]: any }): boolean;
  validateDeleteNotification(payload: { [key: string]: any }): boolean;

  getNotifications(identity: string, callback: ((notifications: XApiStatement[]) => void)): void; //Retrieves all notifications for this user
  // getNotificationsForBook(identity: string, book: string): Notification[]; //Retrieves all notifications for the specified book for this user
  saveNotifications(identity: string, notifications: XApiStatement[], callback: ((success: boolean) => void)): void; //Stores the notifications for this user
  deleteNotification(identity: string, id: string, callback: ((success: boolean) => void)): void; //Removes the notification with the specified id

}
