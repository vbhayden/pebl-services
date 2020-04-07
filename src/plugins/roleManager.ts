import { PeBLPlugin } from "../models/peblPlugin";
import { RoleManager } from "../interfaces/roleManager";
import { Role } from "../models/role";
import { SessionDataManager } from "../interfaces/sessionDataManager";

export class DefaultRoleManager extends PeBLPlugin implements RoleManager {

  constructor(redisCache: SessionDataManager) {
    super();
  }

  //Add a role based on a set of permissions
  addRole(id: string, name: string, permissions: string[]): void {

  }

  //Remove a role    
  deleteRole(id: string): void {

  }

  //Updates the permission set and/or name of a role    
  updateRole(id: string, name?: string, permissions?: string[]): void {

  }

  //Get a role with the specified id
  getRole(id: string, callback: ((role: Role) => void)): void {

  }

  //Get all the roles in the system    
  getRoles(callback: ((roles: Role[]) => void)): void {

  }
}
