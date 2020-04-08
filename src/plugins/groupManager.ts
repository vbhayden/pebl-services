import { GroupManager } from "../interfaces/groupManager"
import { PeBLPlugin } from "../models/peblPlugin";
import { MessageTemplate } from "../models/messageTemplate";
import { Group } from "../models/group";
// import { Role } from "../models/role";
// import { GroupRole } from "../models/groupRole";
import { SessionDataManager } from "../interfaces/sessionDataManager";

export class DefaultGroupManager extends PeBLPlugin implements GroupManager {

  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    this.addMessageTemplate(new MessageTemplate("addGroup",
      this.validateAddGroup,
      (payload) => {
        this.addGroup(payload.id, payload.groupName, payload.groupDescription, payload.groupAvatar);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteGroup",
      this.validateDeleteGroup,
      (payload) => {
        this.deleteGroup(payload.id);
      }));

    this.addMessageTemplate(new MessageTemplate("updateGroup",
      this.validateUpdateGroup,
      (payload) => {
        this.updateGroup(payload.id, payload.groupName, payload.groupDescription, payload.groupAvatar);
      }));

    this.addMessageTemplate(new MessageTemplate("addGroupMember",
      this.validateAddGroupMember,
      (payload) => {
        this.addGroupMember(payload.id, payload.userId, payload.role);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteGroupMember",
      this.validateDeleteGroupMember,
      (payload) => {
        this.deleteGroupMember(payload.id, payload.userId);
      }));

    this.addMessageTemplate(new MessageTemplate("updateGroupMember",
      this.validateUpdateGroupMember,
      (payload) => {
        this.updateGroupMember(payload.id, payload.userId, payload.role);
      }));

    this.addMessageTemplate(new MessageTemplate("getGroups",
      this.validateGetGroups,
      (payload) => {
        this.getGroups(payload.callback);
      }));
  }

  validateAddGroup(payload: { [key: string]: any }): boolean {
    // if (!(payload.id instanceof String)) {
    //   return false;
    // }
    // if (!(payload.groupName instanceof String)) {
    //   return false;
    // }
    // if (!(payload.groupDescription instanceof String)) {
    //   return false;
    // }
    // if (payload.groupAvatar) {
    //   if (!(payload.groupAvatar instanceof String)) {
    //     return false;
    //   }
    // }

    return true;
  }

  validateDeleteGroup(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateUpdateGroup(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateAddGroupMember(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteGroupMember(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateUpdateGroupMember(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateGetGroups(payload: { [key: string]: any }): boolean {
    return false;
  }

  addGroup(id: string, groupName: string, groupDescription: string, groupAvatar?: string): void {
    console.log(this.sessionData);
  }

  deleteGroup(id: string): void {

  }

  updateGroup(id: string, groupName?: string, groupDescription?: string, groupAvatar?: string): void {

  }

  addGroupMember(id: string, userId: string, role: string): void {

  }

  deleteGroupMember(id: string, userId: string): void {

  }

  updateGroupMember(id: string, userId: string, role: string): void {

  }

  getGroups(callback: ((groups: Group[]) => void)): void {

  }

  // createGroupRole(id: string, roleName: string, permissions: Role[]): void {

  // }

  // updateGroupRole(id: string, roleName?: string, permissions?: Role[]): void {

  // }

  // deleteGroupRole(id: string, roleName: string): void {

  // }

  // getGroupRoles(id: string, callback: ((groupRoles: GroupRole[]) => void)): void {

  // }
}
