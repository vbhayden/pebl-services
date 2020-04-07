import { Role } from "../models/role";
import { PeBLPlugin } from "../models/peblPlugin";

export interface RoleManager extends PeBLPlugin {
  addRole(id: string, name: string, permissions: string[]): void; //Add a role based on a set of permissions
  deleteRole(id: string): void; //Remove a role
  updateRole(id: string, name?: string, permissions?: string[]): void; //Updates the permission set and/or name of a role
  getRole(id: string, callback: ((role: Role) => void)): void; //Get a role with the specified id

  getRoles(callback: ((roles: Role[]) => void)): void; //Get all the roles in the system
}
