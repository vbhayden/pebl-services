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

  addGroup(groupId: string, groupName: string, groupDescription: string, groupAvatar?: string): Promise<true>; //Add a group with the specified data to the system
  deleteGroup(groupId: string): Promise<boolean>; //Delete the group with the specified Id
  updateGroup(groupId: string, groupName?: string, groupDescription?: string, groupAvatar?: string): Promise<true>; //Update group metadata for group with specified Id


  addGroupMemberUser(groupId: string, memberUserId: string, roleIds: string[]): Promise<true>;
  addGroupMemberGroup(groupId: string, memberGroupId: string, roleIds: string[]): Promise<true>;

  getGroupMemberUser(groupId: string, memberUserId: string): Promise<string[]>;
  getGroupMemberUsers(groupId: string): Promise<string[]>;

  getGroupMemberGroup(groupId: string, memberGroupId: string): Promise<string[]>;
  getGroupMemberGroups(groupId: string): Promise<string[]>;

  deleteGroupMemberUser(groupId: string, memberUserId: string): Promise<boolean>; //Remove the specified userId from the specified group
  deleteGroupMemberGroup(groupId: string, memberGroupId: string): Promise<boolean>;

  updateGroupMemberUser(groupId: string, memberUserId: string, roleIds: string[]): Promise<true>;
  updateGroupMemberGroup(groupId: string, memberGroupId: string, roleIds: string[]): Promise<true>;

  getGroups(): Promise<Group[]>; //Get all existing groups
  getGroupsGroups(groupId: string): Promise<string[]>;

  getUsersGroups(userId: string): Promise<string[]>;
}
