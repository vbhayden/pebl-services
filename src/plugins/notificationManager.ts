import { PeBLPlugin } from "../models/peblPlugin";
import { NotificationManager } from "../interfaces/notificationManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { XApiStatement, Voided } from "../models/xapiStatement";
import { generateUserNotificationsKey, generateBroadcastQueueForUserId, generateTimestampForNotification, LogCategory, Severity, SET_ALL_NOTIFICATIONS, SET_ALL_NOTIFICATIONS_REFS } from "../utils/constants";
import { ServiceMessage } from "../models/serviceMessage";
import { MessageTemplate } from "../models/messageTemplate";
import { PermissionSet } from "../models/permission";
import { auditLogger } from "../main";

export class DefaultNotificationManager extends PeBLPlugin implements NotificationManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    this.addMessageTemplate(new MessageTemplate("getNotifications",
      this.validateGetNotifications.bind(this),
      this.authorizeGetNotifications.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getNotifications(payload.identity, payload.timestamp, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveNotifications",
      this.validateSaveNotifications.bind(this),
      this.authorizeSaveNotifications.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.saveNotifications(payload.identity, payload.notifications, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteNotification",
      this.validateDeleteNotification.bind(this),
      this.authorizeDeleteNotification.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.deleteNotification(payload.identity, payload.xId, dispatchCallback);
      }));
  }

  validateGetNotifications(payload: { [key: string]: any }): boolean {
    return true;
  }

  authorizeGetNotifications(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  validateSaveNotifications(payload: { [key: string]: any }): boolean {
    return false; //TODO
  }

  authorizeSaveNotifications(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  validateDeleteNotification(payload: { [key: string]: any }): boolean {
    if (typeof payload.xId === "string")
      return true;
    return false;
  }

  authorizeDeleteNotification(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }


  getNotifications(identity: string, timestamp: number, callback: ((notifications: XApiStatement[]) => void)): void {
    this.sessionData.getValuesGreaterThanTimestamp(generateTimestampForNotification(identity),
      timestamp,
      (data) => {
        this.sessionData.getHashMultiField(SET_ALL_NOTIFICATIONS,
          data,
          (result) => {
            callback(result.map(function(x) {
              let obj = JSON.parse(x);
              if (XApiStatement.is(obj)) {
                return new XApiStatement(obj);
              } else {
                return new Voided(obj);
              }
            }));
          });
      });
  }

  saveNotifications(identity: string, notifications: XApiStatement[], callback: ((success: boolean) => void)): void {
    let userNotificationSet = [];
    let notificationSet = [];
    let notificationRefSet = [];
    let date = new Date();
    let isoDate = date.toISOString();
    let timestamp = date.getTime();
    for (let notification of notifications) {
      notification.stored = isoDate;
      notificationRefSet.push(notification.id);
      notificationSet.push(notification.id);
      notificationSet.push(JSON.stringify(notification));
      userNotificationSet.push(timestamp);
      userNotificationSet.push(notification.id);
    }
    this.sessionData.addTimestampValues(generateTimestampForNotification(identity), userNotificationSet);
    this.sessionData.incHashKeys(SET_ALL_NOTIFICATIONS_REFS, notificationRefSet, 1);
    this.sessionData.setHashValues(SET_ALL_NOTIFICATIONS, notificationSet);
    this.sessionData.broadcast(generateBroadcastQueueForUserId(identity),
      JSON.stringify(new ServiceMessage(identity,
        {
          requestType: "getNotifications",
          data: notifications
        })));
    callback(true);
  }

  deleteNotification(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.rankSortedSetMember(generateUserNotificationsKey(identity),
      id,
      (rank) => {
        if (rank) {
          this.sessionData.getHashValue(SET_ALL_NOTIFICATIONS,
            id,
            (data) => {
              if (data) {
                let voided = new XApiStatement(JSON.parse(data)).toVoidRecord();
                this.sessionData.setHashValue(SET_ALL_NOTIFICATIONS, voided.id, JSON.stringify(voided));
                this.sessionData.incHashKey(SET_ALL_NOTIFICATIONS_REFS,
                  voided.id,
                  1);
                this.sessionData.addTimestampValue(generateTimestampForNotification(identity),
                  new Date(voided.stored).getTime(),
                  voided.id);
                this.sessionData.incHashKey(SET_ALL_NOTIFICATIONS_REFS,
                  id,
                  -1,
                  (refs) => {
                    if (refs <= 0) {
                      this.sessionData.deleteHashValue(SET_ALL_NOTIFICATIONS_REFS, id, (deleted) => {
                        if (!deleted) {
                          auditLogger.report(LogCategory.PLUGIN, Severity.ERROR, "delNotificationRefFail", identity, id);
                        }
                      });
                      this.sessionData.deleteHashValue(SET_ALL_NOTIFICATIONS, id, (deleted) => {
                        if (!deleted) {
                          auditLogger.report(LogCategory.PLUGIN, Severity.ERROR, "delNotificationFail", identity, id);
                        }
                      });
                    }
                  });
                this.sessionData.broadcast(generateBroadcastQueueForUserId(identity),
                  JSON.stringify(new ServiceMessage(identity,
                    {
                      requestType: "getNotifications",
                      data: voided
                    })));
              }
              this.sessionData.deleteSortedTimestampMember(generateTimestampForNotification(identity),
                id,
                (deleted: number) => {
                  let b = deleted >= 1;
                  if (!b) {
                    auditLogger.report(LogCategory.PLUGIN, Severity.ERROR, "delNotificationTimeFail", identity, id);
                  }
                  callback(b);
                });
            });
        }
      });
  }
}
