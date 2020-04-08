import { PeBLPlugin } from "../models/peblPlugin";
import { AnnotationManager } from "../interfaces/annotationManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Annotation } from "../models/annotation";
import { SharedAnnotation } from "../models/sharedAnnotation";
import { generateUserAnnotationsKey, generateSharedAnnotationsKey, generateAnnotationsKey, generateUserSharedAnnotationsKey } from "../utils/constants";

export class DefaultAnnotationManager extends PeBLPlugin implements AnnotationManager {

  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    console.log(this.sessionData);
  }

  validateGetAnnotations(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveAnnotations(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateGetSharedAnnotations(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveSharedAnnotations(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteAnnotation(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteSharedAnnotation(payload: { [key: string]: any }): boolean {
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
  saveAnnotations(identity: string, stmts: Annotation[]): void {
    let arr = [];
    for (let stmt of stmts) {
      arr.push(generateAnnotationsKey(stmt.id));
      arr.push(JSON.stringify(stmt));
    }
    this.sessionData.setHashValues(generateUserAnnotationsKey(identity), arr);
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
  saveSharedAnnotations(identity: string, stmts: SharedAnnotation[]): void {
    let arr = [];
    for (let stmt of stmts) {
      arr.push(generateSharedAnnotationsKey(stmt.id));
      arr.push(JSON.stringify(stmt));
    }
    this.sessionData.setHashValues(generateUserSharedAnnotationsKey(identity), arr);
  }

  //Removes the annotation with the specific id    
  deleteAnnotation(identity: string, id: string): void {
    this.sessionData.deleteHashValue(generateUserAnnotationsKey(identity),
      generateAnnotationsKey(id),
      (result: boolean) => {
        if (!result) {
          console.log("failed to delete annotation", id);
        }
      });
  }

  //Removes the shared annotation with the specific id
  deleteSharedAnnotation(identity: string, id: string): void {
    this.sessionData.deleteHashValue(generateSharedAnnotationsKey(identity),
      generateSharedAnnotationsKey(id),
      (result: boolean) => {
        if (!result) {
          console.log("failed to delete shared annotation", id);
        }
      });

  }

}
