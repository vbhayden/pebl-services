import { Group } from "../models/group";
import { Role } from "../models/role";
import { GroupRole } from "../models/groupRole";
import { PeBLPlugin } from "../models/peblPlugin";


export interface GroupManager extends PeBLPlugin {
  addGroup(id: string, groupName: string, groupDescription: string, groupAvatar?: string): void; //Add a group with the specified data to the system
  deleteGroup(id: string): void; //Delete the group with the specified Id
  updateGroup(id: string, groupName?: string, groupDescription?: string, groupAvatar?: string): void; //Update group metadata for group with specified Id

  addGroupMember(id: string, userId: string, role: string): void; //Add the specified userId as a member of the specified group with the specified metadata
  deleteGroupMember(id: string, userId: string): void; //Remove the specified userId from the specified group
  updateGroupMember(id: string, userId: string, role: string): void; //Update specified user metadata in specified group

  getGroups(callback: ((groups: Group[]) => void)): void; //Get all existing groups

  createGroupRole(id: string, roleName: string, permissions: Role[]): void; //Create a role within a group
  updateGroupRole(id: string, roleName?: string, permissions?: Role[]): void; //Update a role within a group
  deleteGroupRole(id: string, roleName: string): void; //Delete a role within a group

  getGroupRoles(id: string, callback: ((groupRoles: GroupRole[]) => void)): void; // Get all roles within a group
}
