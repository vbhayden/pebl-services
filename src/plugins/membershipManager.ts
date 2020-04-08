import { PeBLPlugin } from "../models/peblPlugin";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { MembershipManager } from "../interfaces/membershipManager";
import { Membership } from "../models/membership";
import { generateUserMembershipKey, generateMembershipsKey } from "../utils/constants";

export class DefaultMembershipManager extends PeBLPlugin implements MembershipManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    console.log(this.sessionData);
  }

  validateGetMemberships(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveMemberships(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteMembership(payload: { [key: string]: any }): boolean {
    return false;
  }

  getMemberships(identity: string, callback: ((memberships: Membership[]) => void)): void {
    this.sessionData.getHashValues(generateUserMembershipKey(identity), (result: string[]) => {
      callback(result.map(function(x) {
        return new Membership(JSON.parse(x));
      }));
    });
  }

  saveMemberships(identity: string, memberships: Membership[]): void {
    let arr = [];
    for (let membership of memberships) {
      arr.push(generateMembershipsKey(membership.id));
      arr.push(JSON.stringify(membership));
    }
    this.sessionData.setHashValues(generateUserMembershipKey(identity), arr);
  }

  deleteMebership(identity: string, id: string): void {
    this.sessionData.deleteHashValue(generateUserMembershipKey(identity),
      generateMembershipsKey(id), (result: boolean) => {
        if (!result) {
          console.log("failed to remove membership", id);
        }
      });
  }

}
