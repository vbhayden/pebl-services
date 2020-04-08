import { PeBLPlugin } from "../models/peblPlugin";
import { UserProfile } from "../models/userProfile";
import { Activity } from "../models/activity";
import { ProgramAction } from "../models/programAction";

export interface ActivityManager extends PeBLPlugin {

  validateGetActivities(payload: { [key: string]: any }): boolean;
  validateSaveActivities(payload: { [key: string]: any }): boolean;
  validateDeleteActivity(payload: { [key: string]: any }): boolean;

  validateGetActivityEvents(payload: { [key: string]: any }): boolean;
  validateSaveActivityEvents(payload: { [key: string]: any }): boolean;
  validateDeleteActivityEvent(payload: { [key: string]: any }): boolean;

  getActivities(userProfile: UserProfile, callback: ((activities: Activity[]) => void)): void;
  saveActivities(userProfile: UserProfile, activities: Activity[]): void;
  deleteActivity(userProfile: UserProfile, id: string): void;

  getActivityEvents(userProfile: UserProfile, callback: ((events: ProgramAction[]) => void)): void;
  saveActivityEvents(userProfile: UserProfile, events: ProgramAction[]): void;
  deleteActivityEvent(userProfile: UserProfile, id: string): void;
}
