import { PeBLPlugin } from "../models/peblPlugin";
import { NotificationManager } from "../interfaces/notificationManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { MessageTemplate } from "../models/messageTemplate";
import { PermissionSet } from "../models/permission";
import { generateUserClearedTimestamps, generateUserClearedNotificationsKey, generateTimestampForThread, generateBroadcastQueueForUserId, LogCategory, Severity, generateTimestampForReference, TIMESTAMP_SHARED_ANNOTATIONS } from "../utils/constants";
import { ServiceMessage } from "../models/serviceMessage";
import { auditLogger } from "../main";

export class DefaultNotificationManager extends PeBLPlugin implements NotificationManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    // this.addMessageTemplate(new MessageTemplate("getNotifications",
    //   this.validateGetNotifications.bind(this),
    //   this.authorizeGetNotifications.bind(this),
    //   (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
    //     this.getNotifications(payload.identity, payload.timestamp, dispatchCallback);
    //   }));

    // this.addMessageTemplate(new MessageTemplate("saveNotifications",
    //   this.validateSaveNotifications.bind(this),
    //   this.authorizeSaveNotifications.bind(this),
    //   (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
    //     this.saveNotifications(payload.identity, payload.notifications, dispatchCallback);
    //   }));

    this.addMessageTemplate(new MessageTemplate("deleteNotification",
      this.validateDeleteNotification.bind(this),
      this.authorizeDeleteNotification.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.deleteNotification(payload.identity, payload.records, dispatchCallback);
      }));
  }

  // validateGetNotifications(payload: { [key: string]: any }): boolean {
  //   return true;
  // }

  // authorizeGetNotifications(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
  //   let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
  //   let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

  //   return canUser || canGroup;
  // }

  // validateSaveNotifications(payload: { [key: string]: any }): boolean {
  //   return false; //TODO
  // }

  // authorizeSaveNotifications(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
  //   // let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
  //   // let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

  //   return false;// canUser || canGroup;
  // }

  validateDeleteNotification(payload: { [key: string]: any }): boolean {
    if (Array.isArray(payload.records) && (payload.records.length > 0)) {
      for (let recIndex in payload.records) {
        let rec = payload.records[recIndex];
        if (typeof rec.id !== "string")
          return false;
        if (typeof rec.type !== "string")
          return false;
        if (typeof rec.location !== "string")
          return false;
        if (typeof rec.stored !== "string")
          return false;
      }
    } else {
      return false;
    }
    return true;
  }

  authorizeDeleteNotification(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    if (permissions.user[payload.requestType]) {
      for (let key in payload.actions) {
        let obj = payload.actions[key];
        let identity = obj.identity;
        let canUser = (username == identity);
        // let canGroup = permissions.group[identity] && permissions.group[identity][obj.requestType]

        if (!(canUser // || canGroup
        ))
          return false;
      }
    }
    return true;
  }

  // getNotifications(identity: string, timestamp: number, callback: ((notifications: XApiStatement[]) => void)): void {
  // this.sessionData.getValuesGreaterThanTimestamp(generateTimestampForNotification(identity),
  //   timestamp,
  //   (data) => {
  //     this.sessionData.getHashMultiField(SET_ALL_NOTIFICATIONS,
  //       data,
  //       (result) => {
  //         callback(result.map(function(x) {
  //           let obj = JSON.parse(pakoInflate(x));
  //           if (XApiStatement.is(obj)) {
  //             return new XApiStatement(obj);
  //           } else {
  //             return new Voided(obj);
  //           }
  //         }));
  //       });
  //   });
  // }

  // saveNotifications(identity: string, notifications: XApiStatement[], callback: ((success: boolean) => void)): void {
  //   let userNotificationSet = [];
  //   let notificationSet = [];
  //   let notificationRefSet = [];
  //   let date = new Date();
  //   let isoDate = date.toISOString();
  //   let timestamp = date.getTime();
  //   for (let notification of notifications) {
  //     notification.stored = isoDate;
  //     notificationRefSet.push(notification.id);
  //     notificationSet.push(notification.id);
  //     notificationSet.push(pakoDeflate(JSON.stringify(notification)));
  //     userNotificationSet.push(timestamp);
  //     userNotificationSet.push(notification.id);
  //   }
  //   this.sessionData.addTimestampValues(generateTimestampForNotification(identity), userNotificationSet);
  //   this.sessionData.incHashKeys(SET_ALL_NOTIFICATIONS_REFS, notificationRefSet, 1);
  //   this.sessionData.setHashValues(SET_ALL_NOTIFICATIONS, notificationSet);
  //   this.sessionData.broadcast(generateBroadcastQueueForUserId(identity),
  //     JSON.stringify(new ServiceMessage(identity,
  //       {
  //         requestType: "getNotifications",
  //         data: notifications
  //       })));
  //   callback(true);
  // }

  private scanPotentialNotifications(potentialNotifications: string[],
    clearedNotificationsKey: string,
    callback: (newTimestamp: string, removeIds: string[]) => void): void {

    let acc: string[] = [];
    let lastTime: string;
    let p = () => {
      let time = potentialNotifications.pop();
      let potentialNotification = potentialNotifications.pop();
      if (time && potentialNotification) {
        if (potentialNotification.substring(0, 2) !== "v-") {
          this.sessionData.isMemberSetValue(clearedNotificationsKey,
            potentialNotification,
            (isMember) => {
              if (isMember && potentialNotification && time) {
                acc.push(potentialNotification);
                lastTime = time;
                p();
              } else if (time) {
                callback(time, acc);
              }
            });
        } else {
          lastTime = time;
          p();
        }
      } else {
        callback(lastTime, acc);
      }
    }
    p();
  }

  private processDeleteMessages(record: { [key: string]: any },
    locationTimestampLookup: { [key: string]: number },
    clearedNotificationsKey: string,
    allRemovedIds: string[],
    callback: () => void): void {

    this.sessionData.rangeRevSortedSet(generateTimestampForThread(record.location),
      locationTimestampLookup[record.location],
      record.storedTime,
      true,
      (potentialNotifications) => {
        if (record)
          this.scanPotentialNotifications(potentialNotifications,
            clearedNotificationsKey,
            (newTimestamp: string, removeIds: string[]) => {
              let time = parseInt(newTimestamp);
              if (record && (time > locationTimestampLookup[record.location]))
                locationTimestampLookup[record.location] = time;
              if (removeIds.length > 0) {
                allRemovedIds.push(...removeIds);
                callback();
              } else
                callback();
            });
      });
  }

  private processDeleteSharedAnnotations(record: { [key: string]: any },
    locationTimestampLookup: { [key: string]: number },
    clearedNotificationsKey: string,
    allRemovedIds: string[],
    callback: () => void): void {

    let saLocation = "sa" + record.location;

    this.sessionData.rangeRevSortedSet(TIMESTAMP_SHARED_ANNOTATIONS,
      locationTimestampLookup[saLocation],
      record.storedTime,
      true,
      (potentialNotifications) => {
        if (record)
          this.scanPotentialNotifications(potentialNotifications,
            clearedNotificationsKey,
            (newTimestamp: string, removeIds: string[]) => {
              let time = parseInt(newTimestamp);
              if (record && (time > locationTimestampLookup[saLocation]))
                locationTimestampLookup[saLocation] = time;
              if (removeIds.length > 0) {
                allRemovedIds.push(...removeIds);
                callback();
              } else
                callback();
            });
      });
  }

  private processDeleteReferences(record: { [key: string]: any },
    locationTimestampLookup: { [key: string]: number },
    clearedNotificationsKey: string,
    allRemovedIds: string[],
    callback: () => void): void {

    let rLocation = "r" + record.location;

    this.sessionData.rangeRevSortedSet(generateTimestampForReference(record.location),
      locationTimestampLookup[rLocation],
      record.storedTime,
      true,
      (potentialNotifications) => {
        if (record)
          this.scanPotentialNotifications(potentialNotifications,
            clearedNotificationsKey,
            (newTimestamp: string, removeIds: string[]) => {
              let time = parseInt(newTimestamp);
              if (record && (time > locationTimestampLookup[rLocation]))
                locationTimestampLookup[rLocation] = time;
              if (removeIds.length > 0) {
                allRemovedIds.push(...removeIds);
                callback();
              } else
                callback();
            });
      });
  }

  deleteNotification(identity: string, records: { [key: string]: any }[], callback: ((success: boolean) => void)): void {

    let clearedIds: string[] = [];
    let locations: { [key: string]: boolean } = {};
    records.forEach((record) => {
      clearedIds.push(record.id);
      record.storedTime = new Date(record.stored).getTime();
    });

    records = records.sort((a, b) => {
      return b.storedTime - a.storedTime;
    });

    let newestClearedPerLocation: { [key: string]: any } = [];
    records.forEach((record) => {
      let location = record.location;
      if (record.type === "reference")
        location = "r" + location;
      else if (record.type === "sharedAnnotation")
        location = "sa" + location;
      if (!locations[location]) {
        newestClearedPerLocation.push(record);
        locations[location] = true;
      }
    });

    let userClearedTimestampsKey = generateUserClearedTimestamps(identity);
    let locationSet = Object.keys(locations);
    this.sessionData.getHashMultiField(userClearedTimestampsKey,
      locationSet,
      (locationTimestamps) => {
        let locationTimestampLookup: { [key: string]: number } = {};
        for (let i = 0; i < locationTimestamps.length; i++) {
          let val = locationTimestamps[i];
          if (!val) {
            locationTimestampLookup[locationSet[i]] = 0;
          } else {
            locationTimestampLookup[locationSet[i]] = parseInt(val);
          }
        }
        let clearedNotificationsKey = generateUserClearedNotificationsKey(identity);
        this.sessionData.addSetValue(clearedNotificationsKey,
          clearedIds,
          () => {
            let allRemovedIds: string[] = [];
            let recProcesser = () => {
              let record = newestClearedPerLocation.pop();
              if (record) {
                let fn;
                if (record.type === "message") {
                  fn = this.processDeleteMessages.bind(this);
                } else if (record.type === "sharedAnnotation") {
                  fn = this.processDeleteSharedAnnotations.bind(this);
                } else if (record.type === "reference") {
                  fn = this.processDeleteReferences.bind(this);
                }
                if (fn)
                  fn(record, locationTimestampLookup, clearedNotificationsKey, allRemovedIds, recProcesser);
                else {
                  auditLogger.report(LogCategory.SYSTEM, Severity.ERROR, "ClearNoificationMissingType", record);
                  recProcesser();
                }
              } else {
                let timestampSet: string[] = [];
                for (let key in locationTimestampLookup) {
                  timestampSet.push(key);
                  timestampSet.push(locationTimestampLookup[key] + "");
                }
                this.sessionData.setHashValues(userClearedTimestampsKey, timestampSet);
                if (allRemovedIds.length > 0) {
                  this.sessionData.deleteSetValue(clearedNotificationsKey, allRemovedIds);
                  this.sessionData.broadcast(generateBroadcastQueueForUserId(identity),
                    JSON.stringify(new ServiceMessage(identity,
                      {
                        requestType: "removeClearedNotifications",
                        clearedNotifications: allRemovedIds,
                        clearedTimestamps: locationTimestampLookup
                      })));
                }
                callback(true);
              }
            };

            recProcesser();
          });
      });
  }
}
