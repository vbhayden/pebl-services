import { PeBLPlugin } from "../models/peblPlugin";
import { Annotation } from "../models/annotation";
import { SharedAnnotation } from "../models/sharedAnnotation";
import { Voided } from "../models/xapiStatement";

export interface AnnotationManager extends PeBLPlugin {

  validateGetAnnotations(payload: { [key: string]: any }): boolean;
  validateSaveAnnotations(payload: { [key: string]: any }): boolean;
  validateDeleteAnnotation(payload: { [key: string]: any }): boolean;

  validateGetSharedAnnotations(payload: { [key: string]: any }): boolean;
  validateSaveSharedAnnotations(payload: { [key: string]: any }): boolean;
  validateDeleteSharedAnnotation(payload: { [key: string]: any }): boolean;

  //TODO: Are xAPI statements being stored in the cache or a different format for the data?
  // getAnnotationsForBook(identity: string, book: string): Annotation[]; //Retrieve annotations made by the user within a specific book
  getAnnotations(identity: string, timestamp: number, callback: ((stmts: (Annotation | Voided)[]) => void)): void; //Retrieve annotations made by the user across all books
  saveAnnotations(identity: string, stmts: Annotation[], callback: ((success: boolean) => void)): void; //Store annotations made by the user within the specific book

  // getSharedAnnotationsForBook(identity: string, book: string): SharedAnnotation[]; //Retrieve shared annotations visible to the user made within a specific book
  getSharedAnnotations(identity: string, timestamp: number, callback: ((stmts: (SharedAnnotation | Voided)[]) => void)): void; //Retrieve shared annotations visible to the user made across all books
  saveSharedAnnotations(identity: string, stmts: SharedAnnotation[], callback: ((success: boolean) => void)): void; //Store shared annotations visible to the user made within the specific book

  deleteAnnotation(identity: string, id: string, callback: ((success: boolean) => void)): void; //Removes the annotation with the specific id
  deleteSharedAnnotation(identity: string, id: string, callback: ((success: boolean) => void)): void; //Removes the shared annotation with the specific id
}
