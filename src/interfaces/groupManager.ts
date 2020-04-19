import { Group } from "../models/group";
// import { Role } from "../models/role";
// import { GroupRole } from "../models/groupRole";
import { PeBLPlugin } from "../models/peblPlugin";

export interface GroupManager extends PeBLPlugin {

  validateAddGroup(payload: { [key: string]: any }): boolean;
  validateDeleteGroup(payload: { [key: string]: any }): boolean;
  validateUpdateGroup(payload: { [key: string]: any }): boolean;

  validateAddGroupMemberUser(payload: { [key: string]: any }): boolean;
  validateDeleteGroupMemberUser(payload: { [key: string]: any }): boolean;
  validateUpdateGroupMemberUser(payload: { [key: string]: any }): boolean;

  validateGetGroups(payload: { [key: string]: any }): boolean;

  authorizeAddGroup(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeDeleteGroup(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeUpdateGroup(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeAddGroupMemberUser(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeDeleteGroupMemberUser(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeUpdateGroupMemberUser(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeGetGroups(username: string, permissions: any, payload: { [key: string]: any }): boolean;

  addGroup(groupId: string, groupName: string, groupDescription: string, callback: (data: any) => void, groupAvatar?: string): void; //Add a group with the specified data to the system
  deleteGroup(groupId: string, callback: (data: any) => void): void; //Delete the group with the specified Id
  updateGroup(groupId: string, callback: (data: any) => void, groupName?: string, groupDescription?: string, groupAvatar?: string): void; //Update group metadata for group with specified Id


  addGroupMemberUser(groupId: string, memberUserId: string, roleIds: string[], callback: (data: any) => void): void
  addGroupMemberGroup(groupId: string, memberGroupId: string, roleIds: string[]): void

  getGroupMemberUser(groupId: string, memberUserId: string, callback: (roleIds: string[]) => void): void
  getGroupMemberUsers(groupId: string, callback: (userIds: string[]) => void): void

  getGroupMemberGroup(groupId: string, memberGroupId: string, callback: (roleIds: string[]) => void): void
  getGroupMemberGroups(groupId: string, callback: (groupIds: string[]) => void): void;

  deleteGroupMemberUser(groupId: string, memberUserId: string, callback: (data: any) => void): void; //Remove the specified userId from the specified group
  deleteGroupMemberGroup(groupId: string, memberGroupId: string, callback: (data: any) => void): void

  updateGroupMemberUser(groupId: string, memberUserId: string, roleIds: string[], callback: (data: any) => void): void;
  updateGroupMemberGroup(groupId: string, memberGroupId: string, roleIds: string[]): void;

  getGroups(callback: ((groups: Group[]) => void)): void; //Get all existing groups
  getGroupsGroups(groupId: string, callback: ((groupIds: string[]) => void)): void;

  getUsersGroups(userId: string, callback: ((groupIds: string[]) => void)): void;
}
