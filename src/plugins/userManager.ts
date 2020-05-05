import { UserManager } from "../interfaces/userManager";
import { UserProfile } from "../models/userProfile";
import { PeBLPlugin } from "../models/peblPlugin";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { MessageTemplate } from "../models/messageTemplate";
import { PermissionSet } from "../models/permission";
import { SET_ALL_USERS, generateUserToRolesKey, generateRoleToUsersKey, SET_ALL_USERS_LAST_MODIFIED_PERMISSIONS, Severity, LogCategory } from "../utils/constants";
import { auditLogger } from "../main";

export class DefaultUserManager extends PeBLPlugin implements UserManager {

  private sessionData: SessionDataManager;

  constructor(redisCache: SessionDataManager) {
    super();
    this.sessionData = redisCache;
    this.addMessageTemplate(new MessageTemplate("addUserProfile",
      this.validateAddUserProfile.bind(this),
      this.authorizeAddUserProfile.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.addUserProfile(payload.id, payload.userName, dispatchCallback, payload.userEmail);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteUserProfile",
      this.validateDeleteUserProfile.bind(this),
      this.authorizeDeleteUserProfile.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.deleteUserProfile(payload.id, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("updateUserProfile",
      this.validateUpdateUserProfile.bind(this),
      this.authorizeUpdateUserProfile.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.updateUserProfile(payload.id, dispatchCallback, payload.userName, payload.userEmail);
      }));

    this.addMessageTemplate(new MessageTemplate("getUserProfile",
      this.validateGetUserProfile.bind(this),
      this.authorizeGetUserProfile.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getUserProfile(payload.id, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("getUsers",
      this.validateGetUsers.bind(this),
      this.authorizeGetUsers.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getUsers(dispatchCallback);
      }));
  }

  validateAddUserProfile(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteUserProfile(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateUpdateUserProfile(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateGetUserProfile(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateGetUsers(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeAddUserProfile(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeDeleteUserProfile(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeGetUserProfile(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeUpdateUserProfile(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeGetUsers(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  // Add a user with the specified metadata
  addUserProfile(id: string, userName: string, callback: (data: any) => void, userEmail?: string): void {
    this.sessionData.setHashValue(SET_ALL_USERS,
      id,
      JSON.stringify({
        name: userName,
        email: userEmail
      }));
    callback(true);
  }

  // Delete a user with the specified id
  deleteUserProfile(id: string, callback: (data: any) => void): void {
    this.sessionData.deleteHashValue(SET_ALL_USERS, id, (deleted: boolean) => {
      if (!deleted) {
        auditLogger.report(LogCategory.PLUGIN, Severity.ERROR, "DelUserProfileFail", id);
      }
      callback(deleted);
    });
  }

  addUserRoles(userId: string, roleIds: string[], callback: (data: boolean) => void): void {
    auditLogger.report(LogCategory.PLUGIN, Severity.DEBUG, "AddUserRoles", userId, roleIds);
    this.sessionData.addSetValue(generateUserToRolesKey(userId), roleIds, (added: number) => {
      if (added > 0) {
        this.setLastModifiedPermissions(userId, Date.now() + "");
        for (let roleId of roleIds) {
          this.sessionData.addSetValue(generateRoleToUsersKey(roleId), userId);
        }
        callback(true);
      } else {
        callback(false);
      }
    });
  }

  getUserRoles(userId: string, callback: (roleIds: string[]) => void): void {
    this.sessionData.getSetValues(generateUserToRolesKey(userId), callback);
  }

  deleteUserRole(userId: string, roleId: string, callback: (deleted: boolean) => void): void {
    this.sessionData.deleteSetValue(generateUserToRolesKey(userId), roleId, (deleted: boolean) => {
      if (!deleted) {
        auditLogger.report(LogCategory.PLUGIN, Severity.ERROR, "DelUserRoleFail", userId, roleId);
      }

      this.sessionData.deleteSetValue(generateRoleToUsersKey(roleId), userId, (deleted: boolean) => {
        if (!deleted) {
          auditLogger.report(LogCategory.PLUGIN, Severity.ERROR, "DelUserRoleFail", userId, roleId);
        }
        this.setLastModifiedPermissions(userId, Date.now() + "");
        callback(deleted);
      });
    });
  }

  // Update user metadata
  updateUserProfile(id: string, callback: (data: any) => void, userName?: string, userEmail?: string): void {
    this.sessionData.setHashValue(SET_ALL_USERS,
      id,
      JSON.stringify({
        name: userName,
        email: userEmail
      }));
    callback(true);
  }

  //Get the specified users profile
  getUserProfile(id: string, callback: ((user: UserProfile) => void)): void {
    this.sessionData.getHashValue(SET_ALL_USERS,
      id,
      (data?: string) => {
        if (data !== undefined) {
          callback(new UserProfile(JSON.parse(data)));
        }
      });
  }

  // Get all users
  getUsers(callback: ((users: UserProfile[]) => void)): void {
    this.sessionData.getHashValues(SET_ALL_USERS,
      (data: string[]) => {
        callback(data.map((x) => new UserProfile(JSON.parse(x))));
      });
  }

  getLastModifiedPermissions(identity: string, callback: (lastModified: string) => void): void {
    this.sessionData.getHashValue(SET_ALL_USERS_LAST_MODIFIED_PERMISSIONS,
      identity,
      (lastModified?: string) => {
        if (lastModified !== undefined) {
          callback(lastModified);
        } else {
          callback("");
        }
      });
  }

  setLastModifiedPermissions(identity: string, lastModified: string): void {
    this.sessionData.setHashValue(SET_ALL_USERS_LAST_MODIFIED_PERMISSIONS, identity, lastModified);
  }
}
