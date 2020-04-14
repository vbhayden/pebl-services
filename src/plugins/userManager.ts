import { UserManager } from "../interfaces/userManager";
import { UserProfile } from "../models/userProfile";
import { PeBLPlugin } from "../models/peblPlugin";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { MessageTemplate } from "../models/messageTemplate";
import { PermissionSet } from "../models/permission";
import { SET_ALL_USERS, generateUserToRolesKey, generateRoleToUsersKey } from "../utils/constants";

export class DefaultUserManager extends PeBLPlugin implements UserManager {

  private sessionData: SessionDataManager;

  constructor(redisCache: SessionDataManager) {
    super();
    this.sessionData = redisCache;
    console.log(this.sessionData);
    this.addMessageTemplate(new MessageTemplate("addUserProfile",
      this.validateAddUserProfile,
      this.authorizeAddUserProfile,
      (payload) => {
        this.addUserProfile(payload.id, payload.userName, payload.userEmail);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteUserProfile",
      this.validateDeleteUserProfile,
      this.authorizeDeleteUserProfile,
      (payload) => {
        this.deleteUserProfile(payload.id);
      }));

    this.addMessageTemplate(new MessageTemplate("updateUserProfile",
      this.validateUpdateUserProfile,
      this.authorizeUpdateUserProfile,
      (payload) => {
        this.updateUserProfile(payload.id, payload.userName, payload.userEmail);
      }));

    this.addMessageTemplate(new MessageTemplate("getUserProfile",
      this.validateGetUserProfile,
      this.authorizeGetUserProfile,
      (payload) => {
        this.getUserProfile(payload.id, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("getUsers",
      this.validateGetUsers,
      this.authorizeGetUsers,
      (payload) => {
        this.getUsers(payload.callback);
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
  addUserProfile(id: string, userName: string, userEmail?: string): void {
    this.sessionData.setHashValue(SET_ALL_USERS,
      id,
      JSON.stringify({
        name: userName,
        email: userEmail
      }));
  }

  // Delete a user with the specified id
  deleteUserProfile(id: string): void {
    this.sessionData.deleteHashValue(SET_ALL_USERS, id);
  }

  addUserRoles(userId: string, roleIds: string[]): void {
    this.sessionData.addSetValue(generateUserToRolesKey(userId), roleIds);
    for (let roleId of roleIds) {
      this.sessionData.addSetValue(generateRoleToUsersKey(roleId), userId);
    }
  }

  getUserRoles(userId: string, callback: (roleIds: string[]) => void): void {
    this.sessionData.getSetValues(generateUserToRolesKey(userId), callback);
  }

  deleteUserRole(userId: string, roleId: string): void {
    this.sessionData.deleteSetValue(generateUserToRolesKey(userId), roleId);
    this.sessionData.deleteSetValue(generateRoleToUsersKey(roleId), userId);
  }

  // Update user metadata
  updateUserProfile(id: string, userName?: string, userEmail?: string): void {
    this.sessionData.setHashValue(SET_ALL_USERS,
      id,
      JSON.stringify({
        name: userName,
        email: userEmail
      }));
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
}
