import { PeBLPlugin } from "../models/peblPlugin";
import { RoleManager } from "../interfaces/roleManager";
import { Role } from "../models/role";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { SET_ALL_ROLES, generateRoleToUsersKey } from "../utils/constants";
import { UserManager } from "../interfaces/userManager";
import { MessageTemplate } from "../models/messageTemplate";
import { PermissionSet } from "../models/permission";

export class DefaultRoleManager extends PeBLPlugin implements RoleManager {

  private sessionData: SessionDataManager;
  private userManager: UserManager;

  constructor(sessionData: SessionDataManager, userManager: UserManager) {
    super();
    this.sessionData = sessionData;
    this.userManager = userManager;
    this.addMessageTemplate(new MessageTemplate("addRole",
      this.validateAddRole.bind(this),
      this.authorizeAddRole.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.addRole(payload.id, payload.name, payload.permissions, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteRole",
      this.validateDeleteRole.bind(this),
      this.authorizeDeleteRole.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.deleteRole(payload.id, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("updateRole",
      this.validateUpdateRole.bind(this),
      this.authorizeUpdateRole.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.updateRole(payload.id, dispatchCallback, payload.name, payload.permissions);
      }));

    this.addMessageTemplate(new MessageTemplate("getRoles",
      this.validateGetRole.bind(this),
      this.authorizeGetRoles.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getRoles(dispatchCallback);
      }));
  }

  validateAddRole(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeAddRole(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteRole(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeDeleteRole(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateUpdateRole(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeUpdateRole(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateGetRole(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeGetRole(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateGetRoles(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeGetRoles(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  // validateCopyRole(payload: { [key: string]: any }): boolean {
  //   return false;
  // }

  // copyRole(id: string, newName: string): void {

  // }

  //Add a role based on a set of permissions
  addRole(id: string, name: string, permissions: string[], callback: (data: any) => void): void {
    let p: { [key: string]: boolean } = {};
    for (let permission of permissions) {
      p[permission] = true;
    }
    this.sessionData.setHashValue(SET_ALL_ROLES,
      id,
      JSON.stringify({
        name: name,
        permissions: p
      }));
    callback(true);
  }

  //Remove a role    
  deleteRole(id: string, callback: (data: any) => void): void {
    this.sessionData.deleteHashValue(SET_ALL_ROLES,
      id,
      (deleted: boolean) => {
        if (!deleted) {
          console.log("Failed to delete role", id);
        }
        callback(deleted);
      });
    let modified = Date.now() + "";
    this.sessionData.getHashValues(generateRoleToUsersKey(id),
      (userIds: string[]) => {
        for (let userId of userIds) {
          this.userManager.setLastModifiedPermissions(userId, modified);
        }
        this.sessionData.deleteValue(generateRoleToUsersKey(id));
      });
  }

  //Updates the permission set and/or name of a role    
  updateRole(id: string, callback: (data: any) => void, name?: string, permissions?: string[]): void {
    this.sessionData.setHashValue(SET_ALL_ROLES,
      id,
      JSON.stringify({
        name: name,
        permissions: permissions
      }));
    let modified = Date.now() + "";
    this.sessionData.getHashValues(generateRoleToUsersKey(id),
      (userIds: string[]) => {
        for (let userId of userIds) {
          this.userManager.setLastModifiedPermissions(userId, modified);
        }
      });
    callback(true);
  }

  getMultiRole(ids: string[], callback: ((roles: Role[]) => void)): void {
    this.sessionData.getHashMultiField(SET_ALL_ROLES,
      ids,
      (data: string[]) => {
        callback(data.map((role) => Role.convert(role)));
      });
  }

  //Get a role with the specified id
  getRole(id: string, callback: ((role: Role) => void)): void {
    this.sessionData.getHashValue(SET_ALL_ROLES,
      id,
      (data?: string) => {
        if (data !== undefined) {
          callback(Role.convert(data));
        }
      });
  }

  //Get all the roles in the system    
  getRoles(callback: ((roles: Role[]) => void)): void {
    this.sessionData.getHashValues(SET_ALL_ROLES,
      (data: string[]) => {
        callback(data.map((x) => Role.convert(x)));
      });
  }

  getUsersByRole(roleId: string, callback: (userIds: string[]) => void): void {
    this.sessionData.getSetValues(generateRoleToUsersKey(roleId), callback);
  }
}
