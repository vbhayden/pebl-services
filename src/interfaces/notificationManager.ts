import { PeBLPlugin } from "../models/peblPlugin";
import { UserProfile } from "../models/userProfile";
import { XApiStatement } from "../models/xapiStatement";

export interface NotificationManager extends PeBLPlugin {


  validateGetNotifications(payload: { [key: string]: any }): boolean;
  validateSaveNotifications(payload: { [key: string]: any }): boolean;
  validateDeleteNotifications(payload: { [key: string]: any }): boolean;

  getNotifications(userProfile: UserProfile, callback: ((notifications: XApiStatement[]) => void)): void; //Retrieves all notifications for this user
  // getNotificationsForBook(userProfile: UserProfile, book: string): Notification[]; //Retrieves all notifications for the specified book for this user
  saveNotifications(userProfile: UserProfile, notifications: XApiStatement[]): void; //Stores the notifications for this user
  deleteNotification(userProfile: UserProfile, id: string): void; //Removes the notification with the specified id

}
