import { Asset } from "../models/asset";
import { UserProfile } from "../models/userProfile";
import { XApiStatement } from "../models/xapiStatement";
import { Message } from "../models/message";
import { Membership } from "../models/membership";
import { ModuleEvent } from "../models/moduleEvent";

export interface SessionDataManager {



  // getCompetencies(userProfile: UserProfile, callback: ((competencies: Competency[]) => void)): void; //Retrueve competencies for this user
  // saveCompetencies(userProfile: UserProfile, competencies: Competency[]): void; //Store competencies for this user
  // removeCompetency(userProfile: UserProfile, id: string): void; //Removes the competency with the specified id


  setHashValues(key: string, values: string[]): void;
  getHashValues(key: string, callback: (data: string[]) => void): void;
  deleteHashValue(key: string, field: string, callback: (deleted: boolean) => void): void;



  getMessages(userProfile: UserProfile, callback: ((messages: Message[]) => void)): void //Retrieve messages for the specified thread
  saveMessages(userProfile: UserProfile, messages: Message[]): void; //Store messages for the specified thread
  removeMessage(userProfile: UserProfile, id: string): void; //Removes the message with the specified id

  getNotifications(userProfile: UserProfile, callback: ((notifications: XApiStatement[]) => void)): void; //Retrieves all notifications for this user
  // getNotificationsForBook(userProfile: UserProfile, book: string): Notification[]; //Retrieves all notifications for the specified book for this user
  saveNotifications(userProfile: UserProfile, notifications: XApiStatement[]): void; //Stores the notifications for this user
  removeNotification(userProfile: UserProfile, id: string): void; //Removes the notification with the specified id


  getAssets(userProfile: UserProfile, callback: ((assets: Asset[]) => void)): void;
  saveAssets(userProfile: UserProfile, assets: Asset[]): void;
  removeAsset(userProfile: UserProfile, id: string): void;

  getMemberships(userProfile: UserProfile, callback: ((memberships: Membership[]) => void)): void;
  saveMemberships(userProfile: UserProfile, memberships: Membership[]): void;
  removeMebership(userProfile: UserProfile, id: string): void;

  getModuleEvents(userProfile: UserProfile, callback: ((events: ModuleEvent[]) => void)): void;
  saveModuleEvents(userProfile: UserProfile, events: ModuleEvent[]): void;
  removeModuleEvent(userProfile: UserProfile, id: string): void;
}
