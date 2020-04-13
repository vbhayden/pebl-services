import { GroupManager } from "../interfaces/groupManager"
import { PeBLPlugin } from "../models/peblPlugin";
import { MessageTemplate } from "../models/messageTemplate";
import { Group } from "../models/group";
// import { Role } from "../models/role";
// import { GroupRole } from "../models/groupRole";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { PermissionSet } from "../models/permission";
import { generateUserGroupsKey, SET_ALL_GROUPS, generateGroupMembersKey } from "../utils/constants";

export class DefaultGroupManager extends PeBLPlugin implements GroupManager {

  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    this.addMessageTemplate(new MessageTemplate("addGroup",
      this.validateAddGroup,
      this.authorizeAddGroup,
      (payload) => {
        this.addGroup(payload.id, payload.groupName, payload.groupDescription, payload.groupAvatar);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteGroup",
      this.validateDeleteGroup,
      this.authorizeDeleteGroup,
      (payload) => {
        this.deleteGroup(payload.id);
      }));

    this.addMessageTemplate(new MessageTemplate("updateGroup",
      this.validateUpdateGroup,
      this.authorizeUpdateGroup,
      (payload) => {
        this.updateGroup(payload.id, payload.groupName, payload.groupDescription, payload.groupAvatar);
      }));

    this.addMessageTemplate(new MessageTemplate("addGroupMember",
      this.validateAddGroupMember,
      this.authorizeAddGroupMember,
      (payload) => {
        this.addGroupMember(payload.id, payload.userId, payload.role);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteGroupMember",
      this.validateDeleteGroupMember,
      this.authorizeDeleteGroupMember,
      (payload) => {
        this.deleteGroupMember(payload.id, payload.userId);
      }));

    this.addMessageTemplate(new MessageTemplate("updateGroupMember",
      this.validateUpdateGroupMember,
      this.authorizeUpdateGroupMember,
      (payload) => {
        this.updateGroupMember(payload.id, payload.userId, payload.role);
      }));

    this.addMessageTemplate(new MessageTemplate("getGroups",
      this.validateGetGroups,
      this.authorizeGetGroups,
      (payload) => {
        this.getGroups(payload.callback);
      }));
  }

  validateAddGroup(payload: { [key: string]: any }): boolean {
    if (!(payload.id instanceof String)) {
      return false;
    }
    if (!(payload.groupName instanceof String)) {
      return false;
    }
    if (!(payload.groupDescription instanceof String)) {
      return false;
    }
    if (payload.groupAvatar) {
      if (!(payload.groupAvatar instanceof String)) {
        return false;
      }
    }

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

  authorizeAddGroup(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeDeleteGroup(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeUpdateGroup(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeAddGroupMember(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeDeleteGroupMember(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeUpdateGroupMember(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeGetGroups(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  addGroup(id: string, groupName: string, groupDescription: string, groupAvatar?: string): void {
    this.sessionData.setHashValue(SET_ALL_GROUPS,
      id,
      JSON.stringify({
        name: groupName,
        description: groupDescription,
        avatar: groupAvatar
      }));
  }

  deleteGroup(id: string): void {
    this.sessionData.deleteHashValue(SET_ALL_GROUPS,
      id,
      (deleted: boolean) => {
        if (!deleted) {
          console.log("Failed to delete group", id);
        }
        this.sessionData.deleteValue(generateGroupMembersKey(id),
          (deleted: boolean) => {
            if (!deleted) {
              console.log("Failed to delete group members", id);
            }
          });
      });
  }

  getGroup(id: string, callback: (group: Group) => void) {
    this.sessionData.getHashValue(SET_ALL_GROUPS,
      id,
      (group?: string) => {
        if (group !== undefined) {
          callback(Group.convert(group));
        } else {
          console.log("failed to retreive group", id);
        }
      });
  }

  updateGroup(id: string, groupName?: string, groupDescription?: string, groupAvatar?: string): void {
    this.sessionData.setHashValue(SET_ALL_GROUPS,
      id,
      JSON.stringify({
        name: groupName,
        description: groupDescription,
        avatar: groupAvatar
      }));
  }

  addGroupMember(groupId: string, userId: string, roleIds: string[]): void {
    this.sessionData.setHashValue(generateGroupMembersKey(groupId), userId, JSON.stringify(roleIds));
    this.sessionData.addSetValue(generateUserGroupsKey(userId), groupId);
  }

  getGroupMember(groupId: string, userId: string, callback: (roleIds: string[]) => void): void {
    this.sessionData.getHashValue(generateGroupMembersKey(groupId),
      userId,
      (data?: string) => {
        if (data !== undefined) {
          callback(JSON.parse(data));
        }
      });
  }

  deleteGroupMember(groupId: string, userId: string): void {
    this.sessionData.deleteHashValue(generateGroupMembersKey(groupId),
      userId,
      (deleted: boolean) => {
        if (!deleted) {
          console.log("failed to delete group member", groupId);
        }
      });
    this.sessionData.deleteSetValue(generateUserGroupsKey(userId), groupId);
  }

  updateGroupMember(groupId: string, userId: string, roleIds: string[]): void {
    this.sessionData.setHashValue(generateGroupMembersKey(groupId), userId, JSON.stringify(roleIds));
  }

  getGroups(callback: ((groups: Group[]) => void)): void {
    this.sessionData.getHashValues(SET_ALL_GROUPS,
      (groupData: string[]) => {
        callback(groupData.map((x) => Group.convert(x)));
      });
  }

  getUsersGroups(identity: string, callback: ((groupIds: string[]) => void)): void {
    this.sessionData.getSetValues(generateUserGroupsKey(identity),
      (groupIds: string[]) => {
        callback(groupIds);
      });
  }
}
