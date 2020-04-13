import { Group } from "../models/group";
// import { Role } from "../models/role";
// import { GroupRole } from "../models/groupRole";
import { PeBLPlugin } from "../models/peblPlugin";

export interface GroupManager extends PeBLPlugin {

  validateAddGroup(payload: { [key: string]: any }): boolean;
  validateDeleteGroup(payload: { [key: string]: any }): boolean;
  validateUpdateGroup(payload: { [key: string]: any }): boolean;

  validateAddGroupMember(payload: { [key: string]: any }): boolean;
  validateDeleteGroupMember(payload: { [key: string]: any }): boolean;
  validateUpdateGroupMember(payload: { [key: string]: any }): boolean;

  validateGetGroups(payload: { [key: string]: any }): boolean;

  authorizeAddGroup(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeDeleteGroup(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeUpdateGroup(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeAddGroupMember(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeDeleteGroupMember(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeUpdateGroupMember(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeGetGroups(username: string, permissions: any, payload: { [key: string]: any }): boolean;

  addGroup(groupId: string, groupName: string, groupDescription: string, groupAvatar?: string): void; //Add a group with the specified data to the system
  deleteGroup(groupId: string): void; //Delete the group with the specified Id
  updateGroup(groupId: string, groupName?: string, groupDescription?: string, groupAvatar?: string): void; //Update group metadata for group with specified Id

  getGroupMember(groupId: string, memberId: string, callback: (roleIds: string[]) => void): void;
  addGroupMember(groupId: string, memberId: string, roleIds: string[]): void; //Add the specified userId as a member of the specified group with the specified metadata
  deleteGroupMember(groupId: string, memberId: string): void; //Remove the specified userId from the specified group
  updateGroupMember(groupId: string, memberId: string, roleIds: string[]): void; //Update specified user metadata in specified group

  getGroups(callback: ((groups: Group[]) => void)): void; //Get all existing groups

  getUsersGroups(identity: string, callback: ((groupIds: string[]) => void)): void
}
