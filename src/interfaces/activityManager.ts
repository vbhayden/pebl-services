import { PeBLPlugin } from "../models/peblPlugin";
import { Activity } from "../models/activity";
import { ProgramAction } from "../models/programAction";

export interface ActivityManager extends PeBLPlugin {

  validateGetActivities(payload: { [key: string]: any }): boolean;
  validateSaveActivities(payload: { [key: string]: any }): boolean;
  validateDeleteActivity(payload: { [key: string]: any }): boolean;

  validateGetActivityEvents(payload: { [key: string]: any }): boolean;
  validateSaveActivityEvents(payload: { [key: string]: any }): boolean;
  validateDeleteActivityEvent(payload: { [key: string]: any }): boolean;

  getActivities(identity: string, callback: ((activities: Activity[]) => void)): void;
  saveActivities(identity: string, activities: Activity[]): void;
  deleteActivity(identity: string, id: string): void;

  getActivityEvents(identity: string, callback: ((events: ProgramAction[]) => void)): void;
  saveActivityEvents(identity: string, events: ProgramAction[]): void;
  deleteActivityEvent(identity: string, id: string): void;
}
