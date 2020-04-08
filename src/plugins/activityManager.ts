import { PeBLPlugin } from "../models/peblPlugin";
import { ActivityManager } from "../interfaces/activityManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Activity } from "../models/activity";
import { ProgramAction } from "../models/programAction";
import { generateUserActivitiesKey, generateActivitiesKey, generateUserActivityEventsKey, generateActivityEventsKey } from "../utils/constants";
import { MessageTemplate } from "../models/messageTemplate";

export class DefaultActivityManager extends PeBLPlugin implements ActivityManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    this.addMessageTemplate(new MessageTemplate("getActivities",
      this.validateGetActivities,
      (payload: { [key: string]: any }) => {
        this.getActivities(payload.identity, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveActivities",
      this.validateSaveActivities,
      (payload: { [key: string]: any }) => {
        this.saveActivities(payload.identity, payload.activities);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteActivity",
      this.validateDeleteActivity,
      (payload: { [key: string]: any }) => {
        this.deleteActivity(payload.identity, payload.id);
      }));

    this.addMessageTemplate(new MessageTemplate("getActivityEvents",
      this.validateGetActivityEvents,
      (payload: { [key: string]: any }) => {
        this.getActivityEvents(payload.identity, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveActivityEvents",
      this.validateSaveActivityEvents,
      (payload: { [key: string]: any }) => {
        this.saveActivityEvents(payload.identity, payload.events);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteActivityEvent",
      this.validateDeleteActivityEvent,
      (payload: { [key: string]: any }) => {
        this.deleteActivityEvent(payload.identity, payload.id);
      }));
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

  saveActivities(identity: string, activities: Activity[]): void {
    let arr = [];
    for (let activity of activities) {
      arr.push(generateActivitiesKey(activity.id));
      arr.push(JSON.stringify(activity));
    }
    this.sessionData.setHashValues(generateUserActivitiesKey(identity), arr);
  }

  deleteActivity(identity: string, id: string): void {
    this.sessionData.deleteHashValue(generateUserActivitiesKey(identity),
      generateActivitiesKey(id),
      (result: boolean) => {
        if (!result) {
          console.log("failed to delete activity", id)
        }
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

  saveActivityEvents(identity: string, events: ProgramAction[]): void {
    let arr = [];
    for (let event of events) {
      arr.push(generateActivityEventsKey(event.id));
      arr.push(JSON.stringify(event));
    }
    this.sessionData.setHashValues(generateUserActivityEventsKey(identity), arr);
  }

  deleteActivityEvent(identity: string, id: string): void {
    this.sessionData.deleteHashValue(generateActivityEventsKey(identity),
      generateActivityEventsKey(id),
      (result: boolean) => {
        if (!result) {
          console.log("failed to remove activity event", id);
        }
      });
  }
}
