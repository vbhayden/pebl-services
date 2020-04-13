import { PeBLPlugin } from "../models/peblPlugin";
import { AnnotationManager } from "../interfaces/annotationManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Annotation } from "../models/annotation";
import { SharedAnnotation } from "../models/sharedAnnotation";
import { generateUserAnnotationsKey, generateSharedAnnotationsKey, generateAnnotationsKey, generateUserSharedAnnotationsKey } from "../utils/constants";
import { MessageTemplate } from "../models/messageTemplate";

export class DefaultAnnotationManager extends PeBLPlugin implements AnnotationManager {

  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    this.addMessageTemplate(new MessageTemplate("getAnnotations",
      this.validateGetAnnotations,
      (payload: { [key: string]: any }) => {
        this.getAnnotations(payload.identity, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveAnnotations",
      this.validateSaveAnnotations,
      (payload: { [key: string]: any }) => {
        this.saveAnnotations(payload.identity, payload.stmts, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("getSharedAnnotations",
      this.validateGetSharedAnnotations,
      (payload: { [key: string]: any }) => {
        this.getSharedAnnotations(payload.identity, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveSharedAnnotations",
      this.validateSaveSharedAnnotations,
      (payload: { [key: string]: any }) => {
        this.saveSharedAnnotations(payload.identity, payload.stmts, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteAnnotation",
      this.validateDeleteAnnotation,
      (payload: { [key: string]: any }) => {
        this.deleteAnnotation(payload.identity, payload.xId, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteSharedAnnotation",
      this.validateDeleteSharedAnnotation,
      (payload: { [key: string]: any }) => {
        this.deleteSharedAnnotation(payload.identity, payload.xId, payload.callback);
      }));
  }

  validateGetAnnotations(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  validateSaveAnnotations(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  validateGetSharedAnnotations(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  validateSaveSharedAnnotations(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  validateDeleteAnnotation(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  validateDeleteSharedAnnotation(payload: { [key: string]: any }): boolean {
    //TODO
    return false;
  }

  //TODO: Are xAPI statements being stored in the cache or a different format for the data?
  // getAnnotationsForBook(identity: string, book: string): Annotation[]; //Retrieve annotations made by the user within a specific book
  //Retrieve annotations made by the user across all books
  getAnnotations(identity: string, callback: ((stmts: Annotation[]) => void)): void {
    this.sessionData.getHashValues(generateUserAnnotationsKey(identity),
      (result: string[]) => {
        console.log(result);
        callback(result.map(function(x) {
          return new Annotation(JSON.parse(x));
        }));
      });
  }

  //Store annotations made by the user within the specific book
  saveAnnotations(identity: string, stmts: Annotation[], callback: ((success: boolean) => void)): void {
    let arr = [];
    for (let stmt of stmts) {
      let stmtStr = JSON.stringify(stmt);
      arr.push(generateAnnotationsKey(stmt.id));
      arr.push(stmtStr);
      this.sessionData.queueForLrs(stmtStr);
    }
    this.sessionData.setHashValues(generateUserAnnotationsKey(identity), arr);
    callback(true);
  }

  // getSharedAnnotationsForBook(identity: string, book: string): SharedAnnotation[]; //Retrieve shared annotations visible to the user made within a specific book

  //Retrieve shared annotations visible to the user made across all books
  getSharedAnnotations(identity: string, callback: ((stmts: SharedAnnotation[]) => void)): void {
    this.sessionData.getHashValues(generateUserSharedAnnotationsKey(identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new SharedAnnotation(JSON.parse(x));
        }));
      });
  }

  //Store shared annotations visible to the user made within the specific book
  saveSharedAnnotations(identity: string, stmts: SharedAnnotation[], callback: ((success: boolean) => void)): void {
    let arr = [];
    for (let stmt of stmts) {
      let stmtStr = JSON.stringify(stmt);
      arr.push(generateSharedAnnotationsKey(stmt.id));
      arr.push(stmtStr);
      this.sessionData.queueForLrs(stmtStr);
    }
    this.sessionData.setHashValues(generateUserSharedAnnotationsKey(identity), arr);
    callback(true);
  }

  //Removes the annotation with the specific id    
  deleteAnnotation(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.getHashValue(generateUserAnnotationsKey(identity), generateAnnotationsKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
      }
      this.sessionData.deleteHashValue(generateUserAnnotationsKey(identity),
        generateAnnotationsKey(id), (result: boolean) => {
          if (!result) {
            console.log("failed to remove annotation", id);
          }
          callback(result);
        });
    });
  }

  //Removes the shared annotation with the specific id
  deleteSharedAnnotation(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.getHashValue(generateUserSharedAnnotationsKey(identity), generateSharedAnnotationsKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
      }
      this.sessionData.deleteHashValue(generateUserSharedAnnotationsKey(identity),
        generateSharedAnnotationsKey(id), (result: boolean) => {
          if (!result) {
            console.log("failed to remove shared annotation", id);
          }
          callback(result);
        });
    });
  }
}
