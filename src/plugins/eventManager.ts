import { PeBLPlugin } from "../models/peblPlugin";
import { UserProfile } from "../models/userProfile";
import { XApiStatement } from "../models/xapiStatement";
import { EventManager } from "../interfaces/eventManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { generateUserEventsKey, generateEventsKey } from "../utils/constants";

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
    this.sessionData.getHashValues(generateUserEventsKey(userProfile.identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new XApiStatement(JSON.parse(x));
        }));
      });
  }


  // saveEventsForBook(userProfile: UserProfile, book: string, events: XApiStatement[]): void; // Store the events for this user made within the specific book


  // Store the events for this user
  saveEvents(userProfile: UserProfile, stmts: XApiStatement[]): void {
    let arr = [];
    for (let stmt of stmts) {
      arr.push(generateEventsKey(stmt.id));
      arr.push(JSON.stringify(stmt));
    }
    this.sessionData.setHashValues(generateUserEventsKey(userProfile.identity), arr);
  }

  //Removes the event with the specified id
  deleteEvent(userProfile: UserProfile, id: string): void {
    this.sessionData.deleteHashValue(generateUserEventsKey(userProfile.identity),
      generateEventsKey(id),
      (result: boolean) => {
        if (!result) {
          console.log("failed to delete event", id);
        }
      });
  }
}
