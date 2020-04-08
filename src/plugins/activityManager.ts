import { PeBLPlugin } from "../models/peblPlugin";
import { ActivityManager } from "../interfaces/activityManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { UserProfile } from "../models/userProfile";
import { Activity } from "../models/activity";
import { ProgramAction } from "../models/programAction";
import { generateUserActivitiesKey, generateActivitiesKey, generateUserActivityEventsKey, generateActivityEventsKey } from "../utils/constants";

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
    this.sessionData.getHashValues(generateUserActivitiesKey(userProfile.identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new Activity(JSON.parse(x));
        }));
      });
  }

  saveActivities(userProfile: UserProfile, activities: Activity[]): void {
    let arr = [];
    for (let activity of activities) {
      arr.push(generateActivitiesKey(activity.id));
      arr.push(JSON.stringify(activity));
    }
    this.sessionData.setHashValues(generateUserActivitiesKey(userProfile.identity), arr);
  }

  deleteActivity(userProfile: UserProfile, id: string): void {
    this.sessionData.deleteHashValue(generateUserActivitiesKey(userProfile.identity),
      generateActivitiesKey(id),
      (result: boolean) => {
        if (!result) {
          console.log("failed to delete activity", id)
        }
      });
  }

  getActivityEvents(userProfile: UserProfile, callback: ((events: ProgramAction[]) => void)): void {
    this.sessionData.getHashValues(generateUserActivityEventsKey(userProfile.identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new ProgramAction(JSON.parse(x));
        }));
      });
  }

  saveActivityEvents(userProfile: UserProfile, events: ProgramAction[]): void {
    let arr = [];
    for (let event of events) {
      arr.push(generateActivityEventsKey(event.id));
      arr.push(JSON.stringify(event));
    }
    this.sessionData.setHashValues(generateUserActivityEventsKey(userProfile.identity), arr);
  }

  deleteActivityEvent(userProfile: UserProfile, id: string): void {
    this.sessionData.deleteHashValue(generateActivityEventsKey(userProfile.identity),
      generateActivityEventsKey(id),
      (result: boolean) => {
        if (!result) {
          console.log("failed to remove activity event", id);
        }
      });
  }
}
