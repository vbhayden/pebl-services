import { PeBLPlugin } from "../models/peblPlugin";
import { XApiStatement } from "../models/xapiStatement";

export interface NavigationManager extends PeBLPlugin {


  // validateGetNavigations(payload: { [key: string]: any }): boolean;
  validateSaveNavigations(payload: { [key: string]: any }): boolean;
  // validateDeleteNavigation(payload: { [key: string]: any }): boolean;

  // getNavigations(identity: string, callback: ((navigation: XApiStatement[]) => void)): void; //Retrieves all navigation for this user
  // getNotificationsForBook(identity: string, book: string): Notification[]; //Retrieves all navigation for the specified book for this user
  saveNavigations(identity: string, navigations: XApiStatement[], callback: ((success: boolean) => void)): void; //Stores the navigation for this user
  // deleteNavigation(identity: string, id: string, callback: ((success: boolean) => void)): void; //Removes the navigation with the specified id

}
