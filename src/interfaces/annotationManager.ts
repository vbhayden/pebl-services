import { PeBLPlugin } from "../models/peblPlugin";
import { UserProfile } from "../models/userProfile";
import { Annotation } from "../models/annotation";
import { SharedAnnotation } from "../models/sharedAnnotation";

export interface AnnotationManager extends PeBLPlugin {

  validateGetAnnotations(payload: { [key: string]: any }): boolean;
  validateSaveAnnotations(payload: { [key: string]: any }): boolean;
  validateDeleteAnnotation(payload: { [key: string]: any }): boolean;

  validateGetSharedAnnotations(payload: { [key: string]: any }): boolean;
  validateSaveSharedAnnotations(payload: { [key: string]: any }): boolean;
  validateDeleteSharedAnnotation(payload: { [key: string]: any }): boolean;

  //TODO: Are xAPI statements being stored in the cache or a different format for the data?
  // getAnnotationsForBook(userProfile: UserProfile, book: string): Annotation[]; //Retrieve annotations made by the user within a specific book
  getAnnotations(userProfile: UserProfile, callback: ((stmts: Annotation[]) => void)): void; //Retrieve annotations made by the user across all books
  saveAnnotations(userProfile: UserProfile, stmts: Annotation[]): void; //Store annotations made by the user within the specific book

  // getSharedAnnotationsForBook(userProfile: UserProfile, book: string): SharedAnnotation[]; //Retrieve shared annotations visible to the user made within a specific book
  getSharedAnnotations(userProfile: UserProfile, callback: ((stmts: SharedAnnotation[]) => void)): void; //Retrieve shared annotations visible to the user made across all books
  saveSharedAnnotations(userProfile: UserProfile, stmts: SharedAnnotation[]): void; //Store shared annotations visible to the user made within the specific book

  deleteAnnotation(userProfile: UserProfile, id: string): void; //Removes the annotation with the specific id
  deleteSharedAnnotation(userProfile: UserProfile, id: string): void; //Removes the shared annotation with the specific id
}
