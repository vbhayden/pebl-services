import { PeBLPlugin } from "../models/peblPlugin";
import { UserProfile } from "../models/userProfile";
import { ModuleEvent } from "../models/moduleEvent";

export interface ModuleEventsManager extends PeBLPlugin {

  validateGetModuleEvents(payload: { [key: string]: any }): boolean;
  validateSaveModuleEvents(payload: { [key: string]: any }): boolean;
  validateDeleteModuleEvent(payload: { [key: string]: any }): boolean;

  getModuleEvents(userProfile: UserProfile, callback: ((events: ModuleEvent[]) => void)): void;
  saveModuleEvents(userProfile: UserProfile, events: ModuleEvent[]): void;
  deleteModuleEvent(userProfile: UserProfile, id: string): void;
}
