import { PeBLPlugin } from "../models/peblPlugin";
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


  // getEventsForBook(identity: string, book: string): XApiStatement[]; //Retrieve all events for this user made within the specific book

  //Retrieve all events for this user
  getEvents(identity: string, callback: ((stmts: XApiStatement[]) => void)): void {
    this.sessionData.getHashValues(generateUserEventsKey(identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new XApiStatement(JSON.parse(x));
        }));
      });
  }


  // saveEventsForBook(identity: string, book: string, events: XApiStatement[]): void; // Store the events for this user made within the specific book


  // Store the events for this user
  saveEvents(identity: string, stmts: XApiStatement[]): void {
    let arr = [];
    for (let stmt of stmts) {
      arr.push(generateEventsKey(stmt.id));
      arr.push(JSON.stringify(stmt));
    }
    this.sessionData.setHashValues(generateUserEventsKey(identity), arr);
  }

  //Removes the event with the specified id
  deleteEvent(identity: string, id: string): void {
    this.sessionData.deleteHashValue(generateUserEventsKey(identity),
      generateEventsKey(id),
      (result: boolean) => {
        if (!result) {
          console.log("failed to delete event", id);
        }
      });
  }
}
