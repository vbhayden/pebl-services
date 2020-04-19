import { PeBLPlugin } from "../models/peblPlugin";
import { XApiStatement } from "../models/xapiStatement";

export interface EventManager extends PeBLPlugin {

  validateGetEvents(payload: { [key: string]: any }): boolean;
  validateSaveEvents(payload: { [key: string]: any }): boolean;
  validateDeleteEvent(payload: { [key: string]: any }): boolean;

  // getEventsForBook(identity: string, book: string): XApiStatement[]; //Retrieve all events for this user made within the specific book
  getEvents(identity: string, callback: ((stmts: XApiStatement[]) => void)): void //Retrieve all events for this user
  // saveEventsForBook(identity: string, book: string, events: XApiStatement[]): void; // Store the events for this user made within the specific book
  saveEvents(identity: string, stmts: XApiStatement[], callback: ((success: boolean) => void)): void; // Store the events for this user
  deleteEvent(identity: string, id: string, callback: ((success: boolean) => void)): void; //Removes the event with the specified id
}
