import { PeBLPlugin } from "../models/peblPlugin";
import { XApiStatement } from "../models/xapiStatement";
import { EventManager } from "../interfaces/eventManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { generateUserEventsKey, generateEventsKey } from "../utils/constants";
import { MessageTemplate } from "../models/messageTemplate";

export class DefaultEventManager extends PeBLPlugin implements EventManager {

  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    this.addMessageTemplate(new MessageTemplate("getEvents",
      this.validateGetEvents,
      (payload: { [key: string]: any }) => {
        this.getEvents(payload.identity, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveEvents",
      this.validateSaveEvents,
      (payload: { [key: string]: any }) => {
        this.saveEvents(payload.identity, payload.stmts);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteEvent",
      this.validateDeleteEvent,
      (payload: { [key: string]: any }) => {
        this.deleteEvent(payload.identity, payload.xId);
      }));
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
      let stmtStr = JSON.stringify(stmt);
      arr.push(generateEventsKey(stmt.id));
      arr.push(stmtStr);
      this.sessionData.queueForLrs(stmtStr);
    }
    this.sessionData.setHashValues(generateUserEventsKey(identity), arr);
  }

  //Removes the event with the specified id
  deleteEvent(identity: string, id: string): void {
    this.sessionData.getHashValue(generateUserEventsKey(identity), generateEventsKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
      }
      this.sessionData.deleteHashValue(generateUserEventsKey(identity),
        generateEventsKey(id), (result: boolean) => {
          if (!result) {
            console.log("failed to remove event", id);
          }
        });
    });
  }
}
