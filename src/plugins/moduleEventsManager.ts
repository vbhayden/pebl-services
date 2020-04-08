import { PeBLPlugin } from "../models/peblPlugin";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { ModuleEventsManager } from "../interfaces/moduleEventsManager";
import { ModuleEvent } from "../models/moduleEvent";
import { generateUserModuleEventsKey, generateModuleEventsKey } from "../utils/constants";

export class DefaultModuleEventsManager extends PeBLPlugin implements ModuleEventsManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    console.log(this.sessionData);
  }

  validateGetModuleEvents(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveModuleEvents(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteModuleEvent(payload: { [key: string]: any }): boolean {
    return false;
  }

  getModuleEvents(identity: string, callback: ((events: ModuleEvent[]) => void)): void {
    this.sessionData.getHashValues(generateUserModuleEventsKey(identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new ModuleEvent(JSON.parse(x));
        }));
      });
  }

  saveModuleEvents(identity: string, events: ModuleEvent[]): void {
    let arr = [];
    for (let event of events) {
      arr.push(generateModuleEventsKey(event.id));
      arr.push(JSON.stringify(event));
    }
    this.sessionData.setHashValues(generateUserModuleEventsKey(identity), arr);
  }

  deleteModuleEvent(identity: string, id: string): void {
    this.sessionData.deleteHashValue(generateUserModuleEventsKey(identity),
      generateModuleEventsKey(id), (result: boolean) => {
        if (!result) {
          console.log("failed to remove module event", id);
        }
      });
  }
}
