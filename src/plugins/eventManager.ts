import { PeBLPlugin } from "../models/peblPlugin";
import { UserProfile } from "../models/userProfile";
import { XApiStatement } from "../models/xapiStatement";
import { EventManager } from "../interfaces/eventManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";

export class DefaultEventManager extends PeBLPlugin implements EventManager {

  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    console.log(this.sessionData);
  }

  validateGetEvents(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveEvents(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteEvent(payload: { [key: string]: any }): boolean {
    return false;
  }


  // getEventsForBook(userProfile: UserProfile, book: string): XApiStatement[]; //Retrieve all events for this user made within the specific book

  //Retrieve all events for this user
  getEvents(userProfile: UserProfile, callback: ((stmts: XApiStatement[]) => void)): void {

  }


  // saveEventsForBook(userProfile: UserProfile, book: string, events: XApiStatement[]): void; // Store the events for this user made within the specific book


  // Store the events for this user
  saveEvents(userProfile: UserProfile, events: XApiStatement[]): void {

  }

  //Removes the event with the specified id
  deleteEvent(userProfile: UserProfile, idt: string): void {

  }


}
