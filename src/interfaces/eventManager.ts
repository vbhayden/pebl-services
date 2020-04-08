import { PeBLPlugin } from "../models/peblPlugin";
import { UserProfile } from "../models/userProfile";
import { XApiStatement } from "../models/xapiStatement";

export interface EventManager extends PeBLPlugin {

  validateGetEvents(payload: { [key: string]: any }): boolean;
  validateSaveEvents(payload: { [key: string]: any }): boolean;
  validateDeleteEvent(payload: { [key: string]: any }): boolean;

  // getEventsForBook(userProfile: UserProfile, book: string): XApiStatement[]; //Retrieve all events for this user made within the specific book
  getEvents(userProfile: UserProfile, callback: ((stmts: XApiStatement[]) => void)): void //Retrieve all events for this user
  // saveEventsForBook(userProfile: UserProfile, book: string, events: XApiStatement[]): void; // Store the events for this user made within the specific book
  saveEvents(userProfile: UserProfile, stmts: XApiStatement[]): void; // Store the events for this user
  deleteEvent(userProfile: UserProfile, id: string): void; //Removes the event with the specified id
}
