import { Role } from "../models/role";
import { PeBLPlugin } from "../models/peblPlugin";

export interface RoleManager extends PeBLPlugin {
  validateAddRole(payload: { [key: string]: any }): boolean;
  validateDeleteRole(payload: { [key: string]: any }): boolean;
  validateUpdateRole(payload: { [key: string]: any }): boolean;

  validateGetRole(payload: { [key: string]: any }): boolean;
  validateGetRoles(payload: { [key: string]: any }): boolean;

  // validateCopyRole(payload: { [key: string]: any }): boolean;

  // copyRole(id: string, newName: string): void;

  addRole(id: string, name: string, permissions: string[]): void; //Add a role based on a set of permissions
  deleteRole(id: string): void; //Remove a role
  updateRole(id: string, name?: string, permissions?: string[]): void; //Updates the permission set and/or name of a role

  getMultiRole(ids: string[], callback: ((roles: Role[]) => void)): void;
  getRole(id: string, callback: ((role: Role) => void)): void; //Get a role with the specified id

  getRoles(callback: ((roles: Role[]) => void)): void; //Get all the roles in the system
}
