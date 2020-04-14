import { PeBLPlugin } from "../models/peblPlugin";
import { ActivityManager } from "../interfaces/activityManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Activity } from "../models/activity";
import { ProgramAction } from "../models/programAction";
import { generateUserActivitiesKey, generateActivitiesKey, generateUserActivityEventsKey, generateActivityEventsKey } from "../utils/constants";

export class DefaultActivityManager extends PeBLPlugin implements ActivityManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    // this.addMessageTemplate(new MessageTemplate("getActivities",
    //   this.validateGetActivities,
    //   (payload: { [key: string]: any }) => {
    //     this.getActivities(payload.identity, payload.callback);
    //   }));

    // this.addMessageTemplate(new MessageTemplate("saveActivities",
    //   this.validateSaveActivities,
    //   (payload: { [key: string]: any }) => {
    //     this.saveActivities(payload.identity, payload.activities, payload.callback);
    //   }));

    // this.addMessageTemplate(new MessageTemplate("deleteActivity",
    //   this.validateDeleteActivity,
    //   (payload: { [key: string]: any }) => {
    //     this.deleteActivity(payload.identity, payload.xId, payload.callback);
    //   }));

    // this.addMessageTemplate(new MessageTemplate("getActivityEvents",
    //   this.validateGetActivityEvents,
    //   (payload: { [key: string]: any }) => {
    //     this.getActivityEvents(payload.identity, payload.callback);
    //   }));

    // this.addMessageTemplate(new MessageTemplate("saveActivityEvents",
    //   this.validateSaveActivityEvents,
    //   (payload: { [key: string]: any }) => {
    //     this.saveActivityEvents(payload.identity, payload.events, payload.callback);
    //   }));

    // this.addMessageTemplate(new MessageTemplate("deleteActivityEvent",
    //   this.validateDeleteActivityEvent,
    //   (payload: { [key: string]: any }) => {
    //     this.deleteActivityEvent(payload.identity, payload.xId, payload.callback);
    //   }));
  }

  validateGetActivities(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  validateSaveActivities(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  validateDeleteActivity(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  validateGetActivityEvents(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  validateSaveActivityEvents(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  validateDeleteActivityEvent(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  getActivities(identity: string, callback: ((activities: Activity[]) => void)): void {
    this.sessionData.getHashValues(generateUserActivitiesKey(identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new Activity(JSON.parse(x));
        }));
      });
  }

  saveActivities(identity: string, activities: Activity[], callback: ((success: boolean) => void)): void {
    let arr = [];
    for (let activity of activities) {
      let activityStr = JSON.stringify(activity);
      arr.push(generateActivitiesKey(activity.id));
      arr.push(activityStr);
      this.sessionData.queueForLrs(activityStr);
    }
    this.sessionData.setHashValues(generateUserActivitiesKey(identity), arr);
    callback(true);
  }

  deleteActivity(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.deleteHashValue(generateUserActivitiesKey(identity),
      generateActivitiesKey(id),
      (result: boolean) => {
        if (!result) {
          console.log("failed to delete activity", id);
        }
        callback(result);
      });
  }

  getActivityEvents(identity: string, callback: ((events: ProgramAction[]) => void)): void {
    this.sessionData.getHashValues(generateUserActivityEventsKey(identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new ProgramAction(JSON.parse(x));
        }));
      });
  }

  saveActivityEvents(identity: string, events: ProgramAction[], callback: ((success: boolean) => void)): void {
    let arr = [];
    for (let event of events) {
      let eventStr = JSON.stringify(event);
      arr.push(generateActivityEventsKey(event.id));
      arr.push(eventStr);
      this.sessionData.queueForLrs(eventStr);
    }
    this.sessionData.setHashValues(generateUserActivityEventsKey(identity), arr);
    callback(true);
  }

  deleteActivityEvent(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.getHashValue(generateUserActivityEventsKey(identity), generateActivityEventsKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
      }
      this.sessionData.deleteHashValue(generateUserActivitiesKey(identity),
        generateActivityEventsKey(id), (result: boolean) => {
          if (!result) {
            console.log("failed to remove activity event", id);
          }
          callback(result);
        });
    });
  }
}
