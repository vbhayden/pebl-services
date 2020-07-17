import { PeBLPlugin } from "../models/peblPlugin";
import { NotificationManager } from "../interfaces/notificationManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { XApiStatement, } from "../models/xapiStatement";
import { MessageTemplate } from "../models/messageTemplate";
import { PermissionSet } from "../models/permission";
import { generateUserClearedTimestamps, generateUserClearedNotificationsKey, generateTimestampForThread, generateBroadcastQueueForUserId } from "../utils/constants";
import { ServiceMessage } from "../models/serviceMessage";

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
    if (typeof payload.identity !== "string")
      return false;
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
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  getNotifications(identity: string, timestamp: number, callback: ((notifications: XApiStatement[]) => void)): void {
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
  }

  saveNotifications(identity: string, notifications: XApiStatement[], callback: ((success: boolean) => void)): void {
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
  }

  private scanPotentialNotifications(potentialNotifications: string[],
    clearedNotificationsKey: string,
    callback: (newTimestamp: string, removeIds: string[]) => void): void {

    let acc: string[] = [];
    let p = () => {
      let time = potentialNotifications.pop();
      let potentialNotification = potentialNotifications.pop();
      if (time && potentialNotification) {
        this.sessionData.isMemberSetValue(clearedNotificationsKey,
          potentialNotification,
          (isMember) => {
            if (isMember && potentialNotification) {
              acc.push(potentialNotification);
              p();
            } else if (time) {
              callback(time, acc);
            }
          });
      } else {
        p();
      }
    }
    p();
  }

  deleteNotification(identity: string, records: { [key: string]: any }[], callback: ((success: boolean) => void)): void {

    debugger;
    let ids: string[] = [];
    let locations: { [key: string]: boolean } = {};
    records.forEach((record) => {
      record.storedTime = new Date(record.stored).getTime();
      ids.push(record.id);
      locations[record.location] = true;
    });

    records = records.sort((a, b) => {
      return b.storedTime - a.storedTime;
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
          ids,
          () => {
            let allRemovedIds: string[][] = [];
            let recProcesser = () => {
              let record = records.pop();
              if (record) {
                if (record.type === "message") {
                  this.sessionData.rangeRevSortedSet(generateTimestampForThread(record.location),
                    locationTimestampLookup[record.location],
                    record.storedTime,
                    true,
                    (potentialNotifications) => {
                      if (record)
                        this.scanPotentialNotifications(potentialNotifications,
                          clearedNotificationsKey,
                          (newTimestamp: string, removeIds: string[]) => {
                            if (record)
                              this.sessionData.setHashValue(userClearedTimestampsKey,
                                record.location,
                                newTimestamp,
                                () => {
                                  if (record)
                                    locationTimestampLookup[record.location] = parseInt(newTimestamp);
                                  if (removeIds.length > 0) {
                                    allRemovedIds.push(removeIds);
                                    recProcesser();
                                  } else
                                    recProcesser();
                                });
                          });
                    });
                } else if (record.type === "sharedAnnotation") {

                } else if (record.type === "reference") {

                }
              } else {
                let flatFullSet = allRemovedIds.join();
                this.sessionData.deleteSetValue(clearedNotificationsKey, flatFullSet, recProcesser);
                this.sessionData.broadcast(generateBroadcastQueueForUserId(identity),
                  JSON.stringify(new ServiceMessage(identity,
                    {
                      payload: flatFullSet
                    })))
                callback(true);
              }
            };

            recProcesser();
          });
      });
  }
}
