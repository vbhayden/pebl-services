import { PeBLPlugin } from "../models/peblPlugin";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { MembershipManager } from "../interfaces/membershipManager";
import { Membership } from "../models/membership";
import { generateUserMembershipKey, generateMembershipsKey } from "../utils/constants";
import { MessageTemplate } from "../models/messageTemplate";
import { PermissionSet } from "../models/permission";

export class DefaultMembershipManager extends PeBLPlugin implements MembershipManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    this.addMessageTemplate(new MessageTemplate("getMemberships",
      this.validateGetMemberships.bind(this),
      this.authorizeGetMemberships.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getMemberships(payload.identity, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveMemberships",
      this.validateSaveMemberships.bind(this),
      this.authorizeSaveMemberships.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.saveMemberships(payload.identity, payload.memberships, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteMembership",
      this.validateDeleteMembership.bind(this),
      this.authorizeDeleteMembership.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.deleteMembership(payload.identity, payload.xId, dispatchCallback);
      }));
  }

  validateGetMemberships(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeGetMemberships(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveMemberships(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeSaveMemberships(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteMembership(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeDeleteMembership(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  getMemberships(identity: string, callback: ((memberships: Membership[]) => void)): void {
    this.sessionData.getHashValues(generateUserMembershipKey(identity), (result: string[]) => {
      callback(result.map(function(x) {
        return new Membership(JSON.parse(x));
      }));
    });
  }

  saveMemberships(identity: string, memberships: Membership[], callback: ((success: boolean) => void)): void {
    let arr = [];
    for (let membership of memberships) {
      let memberStr = JSON.stringify(membership);
      arr.push(generateMembershipsKey(membership.id));
      arr.push(memberStr);
      this.sessionData.queueForLrs(memberStr);
    }
    this.sessionData.setHashValues(generateUserMembershipKey(identity), arr);
    callback(true);
  }

  deleteMembership(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.getHashValue(generateUserMembershipKey(identity), generateMembershipsKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
      }
      this.sessionData.deleteHashValue(generateUserMembershipKey(identity),
        generateMembershipsKey(id), (result: boolean) => {
          if (!result) {
            console.log("failed to remove membership", id);
          }
          callback(result);
        });
    });
  }
}
