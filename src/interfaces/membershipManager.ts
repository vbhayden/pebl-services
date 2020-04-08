import { PeBLPlugin } from "../models/peblPlugin";
import { Membership } from "../models/membership";

export interface MembershipManager extends PeBLPlugin {

  validateGetMemberships(payload: { [key: string]: any }): boolean;
  validateSaveMemberships(payload: { [key: string]: any }): boolean;
  validateDeleteMembership(payload: { [key: string]: any }): boolean;

  getMemberships(identity: string, callback: ((memberships: Membership[]) => void)): void;
  saveMemberships(identity: string, memberships: Membership[]): void;
  deleteMebership(identity: string, id: string): void;
}
