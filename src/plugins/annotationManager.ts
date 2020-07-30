import { PeBLPlugin } from "../models/peblPlugin";
import { AnnotationManager } from "../interfaces/annotationManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Annotation } from "../models/annotation";
import { SharedAnnotation } from "../models/sharedAnnotation";
import { generateSubscribedSharedAnnotationsUsersKey, generateGroupSharedAnnotationsTimestamps, generateGroupSharedAnnotationsKey, generateUserAnnotationsKey, generateSharedAnnotationsKey, generateAnnotationsKey, generateTimestampForAnnotations, generateBroadcastQueueForUserId, LogCategory, Severity } from "../utils/constants";
import { MessageTemplate } from "../models/messageTemplate";
import { Voided } from "../models/xapiStatement";
import { PermissionSet } from "../models/permission";
import { ServiceMessage } from "../models/serviceMessage";
import { auditLogger } from "../main";


export class DefaultAnnotationManager extends PeBLPlugin implements AnnotationManager {

  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    this.addMessageTemplate(new MessageTemplate("getAnnotations",
      this.validateGetAnnotations.bind(this),
      this.authorizeGetAnnotations.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getAnnotations(payload.identity, payload.timestamp, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveAnnotations",
      this.validateSaveAnnotations.bind(this),
      this.authorizeSaveAnnotations.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.saveAnnotations(payload.identity, payload.stmts, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("getSharedAnnotations",
      this.validateGetSharedAnnotations.bind(this),
      this.authorizeGetSharedAnnotations.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getSharedAnnotations(payload.identity, payload.groupId, payload.timestamp, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveSharedAnnotations",
      this.validateSaveSharedAnnotations.bind(this),
      this.authorizeSaveSharedAnnotations.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.saveSharedAnnotations(payload.identity, payload.stmts, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteAnnotation",
      this.validateDeleteAnnotation.bind(this),
      this.authorizeDeleteAnnotation.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.deleteAnnotation(payload.identity, payload.xId, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteSharedAnnotation",
      this.validateDeleteSharedAnnotation.bind(this),
      this.authorizeDeleteSharedAnnotation.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.deleteSharedAnnotation(payload.identity, payload.annotation, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("pinSharedAnnotation",
      this.validatePinSharedAnnotation.bind(this),
      this.authorizePinSharedAnnotation.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.pinSharedAnnotation(payload.identity, payload.annotation, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("unpinSharedAnnotation",
      this.validateUnpinSharedAnnotation.bind(this),
      this.authorizeUnpinSharedAnnotation.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.unpinSharedAnnotation(payload.identity, payload.annotation, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("subscribeSharedAnnotations",
      this.validateSubscribeSharedAnnotations.bind(this),
      this.authorizeSubscribeSharedAnnotations.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.subscribeSharedAnnotations(payload.identity, payload.groupId, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("unsubscribeSharedAnnotations",
      this.validateUnsubscribeSharedAnnotations.bind(this),
      this.authorizeUnsubscribeSharedAnnotations.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.unsubscribeSharedAnnotations(payload.identity, payload.groupId, dispatchCallback);
      }));
  }

  validatePinSharedAnnotation(payload: { [key: string]: any }): boolean {
    if (payload.annotation && (payload.annotation instanceof Array) && (payload.annotation.length > 0)) {
      for (let annotationIndex in payload.annotation) {
        let annotation = payload.annotation[annotationIndex];

        if (SharedAnnotation.is(annotation)) {
          payload.annotation[annotationIndex] = new SharedAnnotation(annotation);
        } else {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  authorizePinSharedAnnotation(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    for (let annotation of payload.annotation) {
      if (!permissions.group[annotation.groupId] || !permissions.group[annotation.groupId][payload.requestType])
        return false;
    }
    return true;
  }

  validateUnpinSharedAnnotation(payload: { [key: string]: any }): boolean {
    if (payload.annotation && (payload.annotation instanceof Array) && (payload.annotation.length > 0)) {
      for (let annotationIndex in payload.annotation) {
        let annotation = payload.annotation[annotationIndex];

        if (SharedAnnotation.is(annotation)) {
          payload.annotation[annotationIndex] = new SharedAnnotation(annotation);
        } else {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  authorizeUnpinSharedAnnotation(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    for (let annotation of payload.annotation) {
      if (!permissions.group[annotation.groupId] || !permissions.group[annotation.groupId][payload.requestType])
        return false;
    }
    return true;
  }

  validateGetAnnotations(payload: { [key: string]: any }): boolean {
    return true;
  }

  authorizeGetAnnotations(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity && permissions.user[payload.requestType])

    return canUser;
  }

  validateSaveAnnotations(payload: { [key: string]: any }): boolean {
    if (payload.stmts && (payload.stmts instanceof Array) && (payload.stmts.length > 0)) {
      for (let annotationIndex in payload.stmts) {
        let annotation = payload.stmts[annotationIndex];
        if (Annotation.is(annotation)) {
          payload.stmts[annotationIndex] = new Annotation(annotation);
        } else {
          return false;
        }
      }
    }

    return true;
  }

  authorizeSaveAnnotations(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity && permissions.user[payload.requestType])

    return canUser;
  }

  validateGetSharedAnnotations(payload: { [key: string]: any }): boolean {
    if (!payload.groupId || typeof payload.groupId !== 'string' || payload.groupId.length === 0)
      return false;
    return true;
  }

  authorizeGetSharedAnnotations(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canGroup = permissions.group[payload.groupId] && permissions.group[payload.groupId][payload.requestType]

    return canGroup;
  }

  validateSaveSharedAnnotations(payload: { [key: string]: any }): boolean {
    if (payload.stmts && (payload.stmts instanceof Array) && (payload.stmts.length > 0)) {
      for (let annotationIndex in payload.stmts) {
        let annotation = payload.stmts[annotationIndex];

        if (annotation.pinned)
          return false;

        if (SharedAnnotation.is(annotation)) {
          payload.stmts[annotationIndex] = new SharedAnnotation(annotation);
        } else {
          return false;
        }
      }
    }

    return true;
  }

  authorizeSaveSharedAnnotations(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    for (let annotation of payload.stmts) {
      if (!permissions.group[annotation.groupId] || !permissions.group[annotation.groupId][payload.requestType])
        return false;
    }
    return true;
  }

  validateDeleteAnnotation(payload: { [key: string]: any }): boolean {
    if (Array.isArray(payload.xId)) {
      for (let id of payload.xId) {
        if (typeof id !== "string") {
          return false;
        }
      }
    }

    return true;
  }

  authorizeDeleteAnnotation(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])

    return canUser;
  }

  validateDeleteSharedAnnotation(payload: { [key: string]: any }): boolean {
    if (Array.isArray(payload.annotation) && payload.annotation.length > 0) {
      for (let annotation of payload.annotation) {
        if (SharedAnnotation.is(annotation)) {
          annotation = new SharedAnnotation(annotation);
        } else {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  authorizeDeleteSharedAnnotation(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = false;
    let canGroup = false;

    for (let annotation of payload.annotation) {
      if (annotation.owner === username) {
        canUser = true;
      }

      if (!permissions.group[annotation.groupId] || !permissions.group[annotation.groupId][payload.requestType])
        canGroup = false;
    }

    return canUser || canGroup;
  }

  validateSubscribeSharedAnnotations(payload: { [key: string]: any }): boolean {
    if (Array.isArray(payload.groupId)) {
      for (let i = 0; i < payload.groupId.length; i++) {
        let groupId = payload.groupId[i];
        if (typeof groupId !== "string" || groupId.length === 0)
          return false;
      }
      return true;
    }
    return false;
  }

  authorizeSubscribeSharedAnnotations(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    for (let groupId of payload.groupId) {
      if (!permissions.group[groupId] && permissions.group[groupId][payload.requestType])
        return false;
    }

    return true;
  }

  validateUnsubscribeSharedAnnotations(payload: { [key: string]: any }): boolean {
    if (Array.isArray(payload.groupId)) {
      for (let i = 0; i < payload.groupId.length; i++) {
        let groupId = payload.groupId[i];
        if (typeof groupId !== "string" || groupId.length === 0)
          return false;
      }
      return true;
    }
    return false;
  }

  authorizeUnsubscribeSharedAnnotations(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    for (let groupId of payload.groupId) {
      if (!permissions.group[groupId] && permissions.group[groupId][payload.requestType])
        return false;
    }

    return true;
  }

  subscribeSharedAnnotations(userId: string, groupIds: string[], callback: ((data: { [key: string]: any }) => void)): void {
    for (let i = 0; i < groupIds.length; i++) {
      let groupId = groupIds[i];
      this.sessionData.setHashValue(generateSubscribedSharedAnnotationsUsersKey(groupId), userId, userId);
    }

    callback({
      data: true,
      requestType: "subscribeSharedAnnotations"
    });
  }

  unsubscribeSharedAnnotations(userId: string, groupIds: string[], callback: ((success: boolean) => void)): void {
    let f = () => { };
    for (let i = 0; i < groupIds.length; i++) {
      let groupId = groupIds[i];
      this.sessionData.deleteHashValue(generateSubscribedSharedAnnotationsUsersKey(groupId), userId, f);
    }
    callback(true);
  }

  pinSharedAnnotation(identity: string, annotations: SharedAnnotation[], callback: ((success: boolean) => void)): void {
    let date = new Date();
    for (let annotation of annotations) {
      annotation.stored = date.toISOString();
      annotation.pinned = true;
      let str = JSON.stringify(annotation);

      this.sessionData.setHashValue(generateGroupSharedAnnotationsKey(annotation.groupId), generateSharedAnnotationsKey(annotation.id), str);
      this.sessionData.addTimestampValue(generateGroupSharedAnnotationsTimestamps(annotation.groupId), date.getTime(), annotation.id);
      this.getSubscribedUsers(annotation.groupId, (users) => {
        for (let user of users) {
          if (user !== identity) { //Don't send the message to the sender
            this.sessionData.broadcast(generateBroadcastQueueForUserId(user), JSON.stringify(new ServiceMessage(user, {
              requestType: "newSharedAnnotation",
              data: [annotation]
            })));
          }
        }
      });
    }

    callback(true);
  }

  unpinSharedAnnotation(identity: string, annotations: SharedAnnotation[], callback: ((success: boolean) => void)): void {
    let date = new Date();
    for (let annotation of annotations) {
      annotation.stored = date.toISOString();
      annotation.pinned = false;
      let str = JSON.stringify(annotation);

      this.sessionData.setHashValue(generateGroupSharedAnnotationsKey(annotation.groupId), generateSharedAnnotationsKey(annotation.id), str);
      this.sessionData.addTimestampValue(generateGroupSharedAnnotationsTimestamps(annotation.groupId), date.getTime(), annotation.id);
      this.getSubscribedUsers(annotation.groupId, (users) => {
        for (let user of users) {
          if (user !== identity) { //Don't send the message to the sender
            this.sessionData.broadcast(generateBroadcastQueueForUserId(user), JSON.stringify(new ServiceMessage(user, {
              requestType: "newSharedAnnotation",
              data: [annotation]
            })));
          }
        }
      });
    }

    callback(true);
  }

  //TODO: Are xAPI statements being stored in the cache or a different format for the data?
  // getAnnotationsForBook(identity: string, book: string): Annotation[]; //Retrieve annotations made by the user within a specific book
  //Retrieve annotations made by the user across all books
  getAnnotations(identity: string, timestamp: number, callback: ((stmts: (Annotation | Voided)[]) => void)): void {
    this.sessionData.getValuesGreaterThanTimestamp(generateTimestampForAnnotations(identity), timestamp, (data) => {
      this.sessionData.getHashMultiField(generateUserAnnotationsKey(identity), data.map((x) => generateAnnotationsKey(x)), (result) => {
        callback(result.map(function(x) {
          let obj = JSON.parse(x);
          if (Annotation.is(obj))
            return new Annotation(obj);
          else
            return new Voided(obj);
        }));
      });
    });
  }

  //Store annotations made by the user within the specific book
  saveAnnotations(identity: string, stmts: Annotation[], callback: ((success: boolean) => void)): void {
    let arr = [];
    let date = new Date();
    for (let stmt of stmts) {
      stmt.stored = date.toISOString();
      let stmtStr = JSON.stringify(stmt);
      arr.push(generateAnnotationsKey(stmt.id));
      arr.push(stmtStr);
      this.sessionData.queueForLrs(stmtStr);
      this.sessionData.addTimestampValue(generateTimestampForAnnotations(identity), date.getTime(), stmt.id);
    }
    this.sessionData.broadcast(generateBroadcastQueueForUserId(identity), JSON.stringify(new ServiceMessage(identity, {
      requestType: "newAnnotation",
      data: stmts
    })));
    this.sessionData.setHashValues(generateUserAnnotationsKey(identity), arr);
    callback(true);
  }

  // getSharedAnnotationsForBook(identity: string, book: string): SharedAnnotation[]; //Retrieve shared annotations visible to the user made within a specific book

  //Retrieve shared annotations visible to the user made across all books
  getSharedAnnotations(identity: string, groupId: string, timestamp: number, callback: ((stmts: (SharedAnnotation | Voided)[]) => void)): void {
    this.sessionData.getValuesGreaterThanTimestamp(generateGroupSharedAnnotationsTimestamps(groupId), timestamp, (data) => {
      this.sessionData.getHashMultiField(generateGroupSharedAnnotationsKey(groupId), data.map((x) => generateSharedAnnotationsKey(x)), (result) => {
        callback(result.map(function(x) {
          let obj = JSON.parse(x);
          if (SharedAnnotation.is(obj))
            return new SharedAnnotation(obj);
          else
            return new Voided(obj);
        }));
      });
    });
  }

  //Store shared annotations visible to the user made within the specific book
  saveSharedAnnotations(identity: string, stmts: SharedAnnotation[], callback: ((success: boolean) => void)): void {
    let date = new Date();
    for (let stmt of stmts) {
      stmt.stored = date.toISOString();
      let stmtStr = JSON.stringify(stmt);

      this.sessionData.setHashValue(generateGroupSharedAnnotationsKey(stmt.groupId), generateSharedAnnotationsKey(stmt.id), stmtStr);
      this.sessionData.queueForLrs(stmtStr);
      this.sessionData.addTimestampValue(generateGroupSharedAnnotationsTimestamps(stmt.groupId), date.getTime(), stmt.id);
      this.getSubscribedUsers(stmt.groupId, (users) => {
        for (let user of users) {
          if (user !== identity) { //Don't send the message to the sender
            this.sessionData.broadcast(generateBroadcastQueueForUserId(user), JSON.stringify(new ServiceMessage(user, {
              requestType: "newSharedAnnotation",
              data: [stmt]
            })));
          }
        }
      });
    }
    callback(true);
  }

  //Removes the annotation with the specific id    
  deleteAnnotation(identity: string, ids: string[], callback: ((success: boolean) => void)): void {
    for (let i = 0; i < ids.length; i++) {
      let id = ids[i];
      this.sessionData.getHashValue(generateUserAnnotationsKey(identity), generateAnnotationsKey(id), (data) => {
        if (data) {
          this.sessionData.queueForLrsVoid(data);
          let voided = new Annotation(JSON.parse(data)).toVoidRecord();
          this.sessionData.addTimestampValue(generateTimestampForAnnotations(identity), new Date(voided.stored).getTime(), voided.id);
          this.sessionData.setHashValue(generateUserAnnotationsKey(identity), generateAnnotationsKey(voided.id), JSON.stringify(voided));
          this.sessionData.broadcast(generateBroadcastQueueForUserId(identity), JSON.stringify(new ServiceMessage(identity, {
            requestType: "newAnnotation",
            data: voided
          })));
        }
        this.sessionData.deleteSortedTimestampMember(generateTimestampForAnnotations(identity),
          id,
          (deleted: number) => {
            this.sessionData.deleteHashValue(generateUserAnnotationsKey(identity),
              generateAnnotationsKey(id), (result: boolean) => {
                if (!result) {
                  auditLogger.report(LogCategory.PLUGIN, Severity.ERROR, "DelAnnotationFail", identity, id);
                }
              });
          });
      });
    }
    callback(true);
  }

  //Removes the shared annotation with the specific id
  deleteSharedAnnotation(identity: string, annotations: SharedAnnotation[], callback: ((success: boolean) => void)): void {
    for (let i = 0; i < annotations.length; i++) {
      let annotation = annotations[i];
      this.sessionData.getHashValue(generateGroupSharedAnnotationsKey(annotation.groupId), generateSharedAnnotationsKey(annotation.id), (data) => {
        if (data) {
          this.sessionData.queueForLrsVoid(data);
          let ann = new SharedAnnotation(JSON.parse(data));
          let voided = ann.toVoidRecord();
          this.sessionData.addTimestampValue(generateGroupSharedAnnotationsTimestamps(ann.groupId), new Date(voided.stored).getTime(), voided.id);
          this.sessionData.setHashValue(generateGroupSharedAnnotationsKey(ann.groupId), generateSharedAnnotationsKey(voided.id), JSON.stringify(voided));
          this.getSubscribedUsers(ann.groupId, (users) => {
            for (let user of users) {
              if (user !== identity) { //Don't send the message to the sender
                this.sessionData.broadcast(generateBroadcastQueueForUserId(user), JSON.stringify(new ServiceMessage(user, {
                  requestType: "newSharedAnnotation",
                  data: voided
                })));
              }
            }
          });
        }

        this.sessionData.deleteSortedTimestampMember(generateGroupSharedAnnotationsTimestamps(annotation.groupId),
          annotation.id,
          (deleted: number) => {
            this.sessionData.deleteHashValue(generateGroupSharedAnnotationsKey(annotation.groupId),
              generateSharedAnnotationsKey(annotation.id), (result: boolean) => {
                if (!result) {
                  auditLogger.report(LogCategory.PLUGIN, Severity.ERROR, "DelSharedAnnotationFail", identity, annotation.id);
                }

              });
          });
      });
    }
    callback(true);
  }

  private getSubscribedUsers(groupId: string, callback: ((users: string[]) => void)): void {
    this.sessionData.getHashValues(generateSubscribedSharedAnnotationsUsersKey(groupId), callback);
  }
}
