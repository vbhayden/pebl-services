import { GroupManager } from "../interfaces/groupManager"
import { PeBLPlugin } from "../models/peblPlugin";
import { MessageTemplate } from "../models/messageTemplate";
import { Group } from "../models/group";
// import { Role } from "../models/role";
// import { GroupRole } from "../models/groupRole";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { PermissionSet } from "../models/permission";
import { SET_ALL_GROUPS, generateGroupToGroupMembershipKey, generateUserToGroupMembershipKey, generateGroupToUserMembersKey, generateGroupToGroupMembersKey } from "../utils/constants";
import { UserManager } from "../interfaces/userManager";

export class DefaultGroupManager extends PeBLPlugin implements GroupManager {

  private sessionData: SessionDataManager;
  private userManager: UserManager;

  constructor(sessionData: SessionDataManager, userManager: UserManager) {
    super();
    this.sessionData = sessionData;
    this.userManager = userManager;
    this.addMessageTemplate(new MessageTemplate("addGroup",
      this.validateAddGroup.bind(this),
      this.authorizeAddGroup.bind(this),
      (payload) => {
        this.addGroup(payload.id, payload.groupName, payload.groupDescription, payload.groupAvatar);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteGroup",
      this.validateDeleteGroup.bind(this),
      this.authorizeDeleteGroup.bind(this),
      (payload) => {
        this.deleteGroup(payload.id);
      }));

    this.addMessageTemplate(new MessageTemplate("updateGroup",
      this.validateUpdateGroup.bind(this),
      this.authorizeUpdateGroup.bind(this),
      (payload) => {
        this.updateGroup(payload.id, payload.groupName, payload.groupDescription, payload.groupAvatar);
      }));

    this.addMessageTemplate(new MessageTemplate("addGroupMemberUser",
      this.validateAddGroupMemberUser.bind(this),
      this.authorizeAddGroupMemberUser.bind(this),
      (payload) => {
        this.addGroupMemberUser(payload.id, payload.userId, payload.roles);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteGroupMemberUser",
      this.validateDeleteGroupMemberUser.bind(this),
      this.authorizeDeleteGroupMemberUser.bind(this),
      (payload) => {
        this.deleteGroupMemberUser(payload.id, payload.userId);
      }));

    this.addMessageTemplate(new MessageTemplate("updateGroupMemberUser",
      this.validateUpdateGroupMemberUser.bind(this),
      this.authorizeUpdateGroupMemberUser.bind(this),
      (payload) => {
        this.updateGroupMemberUser(payload.id, payload.userId, payload.roles);
      }));

    this.addMessageTemplate(new MessageTemplate("getGroups",
      this.validateGetGroups.bind(this),
      this.authorizeGetGroups.bind(this),
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

  validateAddGroupMemberUser(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteGroupMemberUser(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateUpdateGroupMemberUser(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateGetGroups(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeAddGroup(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return permissions.user[payload.requestType];
  }

  authorizeDeleteGroup(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeUpdateGroup(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeAddGroupMemberUser(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeDeleteGroupMemberUser(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeUpdateGroupMemberUser(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
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

        let modified = Date.now() + "";

        //TODO re-write using MULTI/EXEC
        this.getGroupMemberUsers(id, (userIds: string[]) => {
          this.getGroupMemberGroups(id, (groupIds: string[]) => {

            let processUsers = (userIds: string[]) => {
              let userId = userIds.pop();
              if (userId === undefined) {
                processGroups(groupIds);
              } else {
                this.userManager.setLastModifiedPermissions(userId, modified);
                this.deleteGroupMemberUser(id, userId);
              }
            }

            let processGroups = (groupIds: string[]) => {
              let groupId = groupIds.pop();
              if (groupId === undefined) {
                this.sessionData.deleteValue(generateGroupToUserMembersKey(id),
                  (deleted: boolean) => {
                    if (!deleted) {
                      console.log("Failed to delete group members", id);
                    }
                    this.sessionData.deleteValue(generateGroupToGroupMembersKey(id),
                      (deleted: boolean) => {
                        if (!deleted) {
                          console.log("Failed to delete group members", id);
                        }
                      });
                  });
              } else {
                this.deleteGroupMemberGroup(id, groupId);
              }
            }

            processUsers(userIds);
          });
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


  addGroupMemberUser(groupId: string, memberUserId: string, roleIds: string[]): void {
    this.sessionData.setHashValue(generateGroupToUserMembersKey(groupId), memberUserId, JSON.stringify(roleIds));
    this.userManager.setLastModifiedPermissions(memberUserId, Date.now() + "");
    this.sessionData.addSetValue(generateUserToGroupMembershipKey(memberUserId), groupId);
  }

  addGroupMemberGroup(groupId: string, memberGroupId: string, roleIds: string[]): void {
    this.sessionData.setHashValue(generateGroupToGroupMembersKey(groupId), memberGroupId, JSON.stringify(roleIds));
    //TODO groups need to trigger for nested groups
    //this.setLastModifiedPermissions(memberUserId, Date.now() + "");
    this.sessionData.addSetValue(generateGroupToGroupMembershipKey(memberGroupId), groupId);
  }



  getGroupMemberUser(groupId: string, memberUserId: string, callback: (roleIds: string[]) => void): void {
    this.sessionData.getHashValue(generateGroupToUserMembersKey(groupId),
      memberUserId,
      (data?: string) => {
        if (data !== undefined) {
          callback(JSON.parse(data));
        }
      });
  }

  getGroupMemberUsers(groupId: string, callback: (userIds: string[]) => void): void {
    this.sessionData.getHashKeys(generateGroupToUserMembersKey(groupId),
      (data: string[]) => {
        if (data !== undefined) {
          callback(data);
        }
      });
  }



  getGroupMemberGroup(groupId: string, memberGroupId: string, callback: (roleIds: string[]) => void): void {
    this.sessionData.getHashValue(generateGroupToGroupMembersKey(groupId),
      memberGroupId,
      (data?: string) => {
        if (data !== undefined) {
          callback(JSON.parse(data));
        }
      });
  }

  getGroupMemberGroups(groupId: string, callback: (groupIds: string[]) => void): void {
    this.sessionData.getHashKeys(generateGroupToGroupMembersKey(groupId),
      (data: string[]) => {
        callback(data);
      });
  }



  deleteGroupMemberUser(groupId: string, memberUserId: string): void {
    this.sessionData.deleteHashValue(generateGroupToUserMembersKey(groupId),
      memberUserId,
      (deleted: boolean) => {
        if (!deleted) {
          console.log("failed to delete group member", groupId);
        }
      });
    this.userManager.setLastModifiedPermissions(memberUserId, Date.now() + "");
    this.sessionData.deleteSetValue(generateUserToGroupMembershipKey(memberUserId), groupId);
  }

  deleteGroupMemberGroup(groupId: string, memberGroupId: string): void {
    this.sessionData.deleteHashValue(generateGroupToGroupMembersKey(groupId),
      memberGroupId,
      (deleted: boolean) => {
        if (!deleted) {
          console.log("failed to delete group member", groupId);
        }
      });
    //TODO groups need to trigger for nested groups
    //this.setLastModifiedPermissions(memberUserId, Date.now() + "");
    this.sessionData.deleteSetValue(generateGroupToGroupMembershipKey(memberGroupId), groupId);
  }



  updateGroupMemberUser(groupId: string, memberUserId: string, roleIds: string[]): void {
    this.sessionData.setHashValue(generateGroupToUserMembersKey(groupId), memberUserId, JSON.stringify(roleIds));
    this.userManager.setLastModifiedPermissions(memberUserId, Date.now() + "");
  }

  updateGroupMemberGroup(groupId: string, memberGroupId: string, roleIds: string[]): void {
    this.sessionData.setHashValue(generateGroupToGroupMembersKey(groupId), memberGroupId, JSON.stringify(roleIds));
    //TODO groups need to trigger for nested groups
    //this.setLastModifiedPermissions(memberUserId, Date.now() + "");
  }



  getGroups(callback: ((groups: Group[]) => void)): void {
    this.sessionData.getHashValues(SET_ALL_GROUPS,
      (groupData: string[]) => {
        callback(groupData.map((x) => Group.convert(x)));
      });
  }

  getUsersGroups(userId: string, callback: ((groupIds: string[]) => void)): void {
    this.sessionData.getSetValues(generateUserToGroupMembershipKey(userId),
      (groupIds: string[]) => {
        callback(groupIds);
      });
  }

  getGroupsGroups(groupId: string, callback: ((groupIds: string[]) => void)): void {
    this.sessionData.getSetValues(generateGroupToGroupMembershipKey(groupId),
      (groupIds: string[]) => {
        callback(groupIds);
      });
  }
}
