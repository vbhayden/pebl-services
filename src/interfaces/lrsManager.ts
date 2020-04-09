import { XApiStatement } from "../models/xapiStatement";
import { XApiQuery } from "../models/xapiQuery";
import { Activity } from "../models/activity";
import { Profile } from "../models/profile";


export interface LRS {
  storeStatements(stmts: XApiStatement[]): void; //Store the specified statements into an LRS
  voidStatements(stmts: XApiStatement[]): void; //Void the specified statements in an LRS

  parseStatements(strings: string[]): XApiStatement[];
  getStatements(xApiQuery: XApiQuery, callback: ((stmts?: XApiStatement[]) => void)): void;

  storeActivity(activity: Activity, callback: ((success: boolean) => void)): void; //Store the specified activity into an LRS
  getActivity(activityType: string, callback: ((activity?: Activity) => void), activityId?: string): void;  //Retrieves the specified activity from an LRS
  removeActivity(activity: Activity, callback: ((success: boolean) => void)): void; //Removes the specified activity from an LRS

  storeProfile(profile: Profile, callback: ((success: boolean) => void)): void; //Store the specified profile into an LRS
  getProfile(profileType: string, callback: ((profile?: Profile) => void), profileId?: string): void; //Retrieves the specified profile from an LRS
  removeProfile(profile: Profile, callback: ((success: boolean) => void)): void; //Removes the specified profile from an LRS
}

