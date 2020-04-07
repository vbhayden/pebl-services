import { Asset } from "../models/asset";
import { UserProfile } from "../models/userProfile";
import { Annotation } from "../models/annotation";
import { SharedAnnotation } from "../models/sharedAnnotation";
import { XApiStatement } from "../models/xapiStatement";
import { Message } from "../models/message";
import { Activity } from "../models/activity";
import { ProgramAction } from "../models/programAction";
import { Membership } from "../models/membership";
import { ModuleEvent } from "../models/moduleEvent";
import { PeBLPlugin } from '../models/peblPlugin';

export interface SessionDataManager extends PeBLPlugin {
  //TODO: Are xAPI statements being stored in the cache or a different format for the data?
  // getAnnotationsForBook(userProfile: UserProfile, book: string): Annotation[]; //Retrieve annotations made by the user within a specific book
  getAnnotations(userProfile: UserProfile, callback: ((stmts: Annotation[]) => void)): void; //Retrieve annotations made by the user across all books
  saveAnnotations(userProfile: UserProfile, stmts: Annotation[]): void; //Store annotations made by the user within the specific book

  // getSharedAnnotationsForBook(userProfile: UserProfile, book: string): SharedAnnotation[]; //Retrieve shared annotations visible to the user made within a specific book
  getSharedAnnotations(userProfile: UserProfile, callback: ((stmts: SharedAnnotation[]) => void)): void; //Retrieve shared annotations visible to the user made across all books
  saveSharedAnnotations(userProfile: UserProfile, stmts: SharedAnnotation[]): void; //Store shared annotations visible to the user made within the specific book

  removeAnnotation(userProfile: UserProfile, id: string): void; //Removes the annotation with the specific id
  removeSharedAnnotation(userProfile: UserProfile, id: string): void; //Removes the shared annotation with the specific id


  // getEventsForBook(userProfile: UserProfile, book: string): XApiStatement[]; //Retrieve all events for this user made within the specific book
  getEvents(userProfile: UserProfile, callback: ((stmts: XApiStatement[]) => void)): void //Retrieve all events for this user
  // saveEventsForBook(userProfile: UserProfile, book: string, events: XApiStatement[]): void; // Store the events for this user made within the specific book
  saveEvents(userProfile: UserProfile, events: XApiStatement[]): void; // Store the events for this user
  removeEvent(userProfile: UserProfile, id: string): void; //Removes the event with the specified id


  // getCompetencies(userProfile: UserProfile, callback: ((competencies: Competency[]) => void)): void; //Retrueve competencies for this user
  // saveCompetencies(userProfile: UserProfile, competencies: Competency[]): void; //Store competencies for this user
  // removeCompetency(userProfile: UserProfile, id: string): void; //Removes the competency with the specified id


  getMessages(userProfile: UserProfile, callback: ((messages: Message[]) => void)): void //Retrieve messages for the specified thread
  saveMessages(userProfile: UserProfile, messages: Message[]): void; //Store messages for the specified thread
  removeMessage(userProfile: UserProfile, id: string): void; //Removes the message with the specified id


  getNotifications(userProfile: UserProfile, callback: ((notifications: XApiStatement[]) => void)): void; //Retrieves all notifications for this user
  // getNotificationsForBook(userProfile: UserProfile, book: string): Notification[]; //Retrieves all notifications for the specified book for this user
  saveNotifications(userProfile: UserProfile, notifications: XApiStatement[]): void; //Stores the notifications for this user
  removeNotification(userProfile: UserProfile, id: string): void; //Removes the notification with the specified id


  getActivities(userProfile: UserProfile, callback: ((activities: Activity[]) => void)): void;
  saveActivities(userProfile: UserProfile, activities: Activity[]): void;
  removeActivity(userProfile: UserProfile, id: string): void;

  getActivityEvents(userProfile: UserProfile, callback: ((events: ProgramAction[]) => void)): void;
  saveActivityEvents(userProfile: UserProfile, events: ProgramAction[]): void;
  removeActivityEvent(userProfile: UserProfile, id: string): void;

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
