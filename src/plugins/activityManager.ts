import { PeBLPlugin } from "../models/peblPlugin";
import { ActivityManager } from "../interfaces/activityManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { UserProfile } from "../models/userProfile";
import { Activity } from "../models/activity";
import { ProgramAction } from "../models/programAction";

export class DefaultActivityManager extends PeBLPlugin implements ActivityManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    console.log(this.sessionData);
  }


  validateGetActivities(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveActivities(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteActivity(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateGetActivityEvents(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveActivityEvents(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteActivityEvent(payload: { [key: string]: any }): boolean {
    return false;
  }

  getActivities(userProfile: UserProfile, callback: ((activities: Activity[]) => void)): void {

  }

  saveActivities(userProfile: UserProfile, activities: Activity[]): void {

  }

  deleteActivity(userProfile: UserProfile, id: string): void {

  }

  getActivityEvents(userProfile: UserProfile, callback: ((events: ProgramAction[]) => void)): void {

  }

  saveActivityEvents(userProfile: UserProfile, events: ProgramAction[]): void {

  }

  deleteActivityEvent(userProfile: UserProfile, id: string): void {

  }
}
