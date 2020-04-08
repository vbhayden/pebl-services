import { PeBLPlugin } from "../models/peblPlugin";
import { UserProfile } from "../models/userProfile";
import { Membership } from "../models/membership";

export interface MembershipManager extends PeBLPlugin {

  validateGetMemberships(payload: { [key: string]: any }): boolean;
  validateSaveMemberships(payload: { [key: string]: any }): boolean;
  validateDeleteMembership(payload: { [key: string]: any }): boolean;

  getMemberships(userProfile: UserProfile, callback: ((memberships: Membership[]) => void)): void;
  saveMemberships(userProfile: UserProfile, memberships: Membership[]): void;
  deleteMebership(userProfile: UserProfile, id: string): void;
}
