import { PeBLPlugin } from "../models/peblPlugin";
import { AnnotationManager } from "../interfaces/annotationManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Annotation } from "../models/annotation";
import { SharedAnnotation } from "../models/sharedAnnotation";
import { generateUserAnnotationsKey, generateSharedAnnotationsKey, generateAnnotationsKey, generateTimestampForAnnotations, generateBroadcastQueueForUserId, QUEUE_ALL_USERS, LogCategory, Severity } from "../utils/constants";
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
        this.getSharedAnnotations(payload.identity, payload.timestamp, dispatchCallback);
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
        this.deleteSharedAnnotation(payload.identity, payload.xId, dispatchCallback);
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
  }

  validatePinSharedAnnotation(payload: { [key: string]: any }): boolean {
    let annotation = payload.annotation;
    if (SharedAnnotation.is(annotation)) {
      payload.annotation = new Annotation(annotation);
    } else {
      return false;
    }
    return true;
  }

  authorizePinSharedAnnotation(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  validateUnpinSharedAnnotation(payload: { [key: string]: any }): boolean {
    let annotation = payload.annotation;
    if (SharedAnnotation.is(annotation)) {
      payload.annotation = new Annotation(annotation);
    } else {
      return false;
    }
    return true;
  }

  authorizeUnpinSharedAnnotation(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  validateGetAnnotations(payload: { [key: string]: any }): boolean {
    return true;
  }

  authorizeGetAnnotations(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
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
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  validateGetSharedAnnotations(payload: { [key: string]: any }): boolean {
    return true;
  }

  authorizeGetSharedAnnotations(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
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
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  validateDeleteAnnotation(payload: { [key: string]: any }): boolean {
    if (typeof (payload.xId) === "string") {
      return true;
    }

    return false;
  }

  authorizeDeleteAnnotation(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  validateDeleteSharedAnnotation(payload: { [key: string]: any }): boolean {
    if (typeof (payload.xId) === "string") {
      return true;
    }

    return false;
  }

  authorizeDeleteSharedAnnotation(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType])
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType]

    return canUser || canGroup;
  }

  pinSharedAnnotation(identity: string, annotation: Annotation, callback: ((success: boolean) => void)): void {
    let date = new Date();
    annotation.stored = date.toISOString();
    annotation.pinned = true;
    let str = JSON.stringify(annotation);
    this.sessionData.addTimestampValue('timestamp:sharedAnnotations', date.getTime(), annotation.id);
    this.sessionData.broadcast(QUEUE_ALL_USERS, JSON.stringify(new ServiceMessage(identity, {
      requestType: "newSharedAnnotation",
      data: [annotation]
    })));
    this.sessionData.setHashValue('sharedAnnotations', generateSharedAnnotationsKey(annotation.id), str);
    callback(true);
  }

  unpinSharedAnnotation(identity: string, annotation: Annotation, callback: ((success: boolean) => void)): void {
    let date = new Date();
    annotation.stored = date.toISOString();
    annotation.pinned = false;
    let str = JSON.stringify(annotation);
    this.sessionData.addTimestampValue('timestamp:sharedAnnotations', date.getTime(), annotation.id);
    this.sessionData.broadcast(QUEUE_ALL_USERS, JSON.stringify(new ServiceMessage(identity, {
      requestType: "newSharedAnnotation",
      data: [annotation]
    })));
    this.sessionData.setHashValue('sharedAnnotations', generateSharedAnnotationsKey(annotation.id), str);
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
  getSharedAnnotations(identity: string, timestamp: number, callback: ((stmts: (SharedAnnotation | Voided)[]) => void)): void {
    this.sessionData.getValuesGreaterThanTimestamp('timestamp:sharedAnnotations', timestamp, (data) => {
      this.sessionData.getHashMultiField('sharedAnnotations', data.map((x) => generateSharedAnnotationsKey(x)), (result) => {
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
    let arr = [];
    let date = new Date();
    for (let stmt of stmts) {
      stmt.stored = date.toISOString();
      let stmtStr = JSON.stringify(stmt);
      arr.push(generateSharedAnnotationsKey(stmt.id));
      arr.push(stmtStr);
      this.sessionData.queueForLrs(stmtStr);
      this.sessionData.addTimestampValue('timestamp:sharedAnnotations', date.getTime(), stmt.id);
    }
    this.sessionData.broadcast(QUEUE_ALL_USERS, JSON.stringify(new ServiceMessage(identity, {
      requestType: "newSharedAnnotation",
      data: stmts
    })));
    this.sessionData.setHashValues('sharedAnnotations', arr);
    callback(true);
  }

  //Removes the annotation with the specific id    
  deleteAnnotation(identity: string, id: string, callback: ((success: boolean) => void)): void {
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
              callback(result);
            });
        });
    });
  }

  //Removes the shared annotation with the specific id
  deleteSharedAnnotation(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.getHashValue('sharedAnnotations', generateSharedAnnotationsKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
        let voided = new Annotation(JSON.parse(data)).toVoidRecord();
        this.sessionData.addTimestampValue('timestamp:sharedAnnotations', new Date(voided.stored).getTime(), voided.id);
        this.sessionData.setHashValue('sharedAnnotations', generateSharedAnnotationsKey(voided.id), JSON.stringify(voided));
        this.sessionData.broadcast(QUEUE_ALL_USERS, JSON.stringify(new ServiceMessage(identity, {
          requestType: "newSharedAnnotation",
          data: voided
        })));
      }

      this.sessionData.deleteSortedTimestampMember('timestamp:sharedAnnotations',
        id,
        (deleted: number) => {
          this.sessionData.deleteHashValue('sharedAnnotations',
            generateSharedAnnotationsKey(id), (result: boolean) => {
              if (!result) {
                auditLogger.report(LogCategory.PLUGIN, Severity.ERROR, "DelSharedAnnotationFail", identity, id);
              }
              callback(result);
            });
        });
    });
  }
}
