import { PeBLPlugin } from "../models/peblPlugin";
import { ModuleEvent } from "../models/moduleEvent";

export interface ModuleEventsManager extends PeBLPlugin {

  validateGetModuleEvents(payload: { [key: string]: any }): boolean;
  validateSaveModuleEvents(payload: { [key: string]: any }): boolean;
  validateDeleteModuleEvent(payload: { [key: string]: any }): boolean;

  getModuleEvents(identity: string, callback: ((events: ModuleEvent[]) => void)): void;
  saveModuleEvents(identity: string, events: ModuleEvent[], callback: ((success: boolean) => void)): void;
  deleteModuleEvent(identity: string, id: string, callback: ((success: boolean) => void)): void;
}
