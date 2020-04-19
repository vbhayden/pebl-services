import { UserProfile } from "../models/userProfile";
import { PeBLPlugin } from "../models/peblPlugin";

export interface UserManager extends PeBLPlugin {
  validateAddUserProfile(payload: { [key: string]: any }): boolean;
  validateDeleteUserProfile(payload: { [key: string]: any }): boolean;
  validateUpdateUserProfile(payload: { [key: string]: any }): boolean;
  validateGetUserProfile(payload: { [key: string]: any }): boolean;

  validateGetUsers(payload: { [key: string]: any }): boolean;

  authorizeAddUserProfile(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeDeleteUserProfile(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeUpdateUserProfile(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeGetUserProfile(username: string, permissions: any, payload: { [key: string]: any }): boolean;
  authorizeGetUsers(username: string, permissions: any, payload: { [key: string]: any }): boolean;

  // Add a user with the specified metadata
  addUserProfile(id: string, userName: string, callback: (data: any) => void, userEmail?: string): void;
  // Delete a user with the specified id
  deleteUserProfile(id: string, callback: (data: any) => void): void;
  // Update user metadata
  updateUserProfile(id: string, callback: (data: any) => void, userName?: string, userEmail?: string): void;
  //Get the specified users profile
  getUserProfile(id: string, callback: ((user: UserProfile) => void)): void;

  addUserRoles(id: string, roleIds: string[]): void;
  getUserRoles(id: string, callback: (roleIds: string[]) => void): void;
  deleteUserRole(id: string, roleId: string, callback: () => void): void;

  getUsers(callback: ((users: UserProfile[]) => void)): void; // Get all users

  setLastModifiedPermissions(identity: string, lastModified: string): void;
  getLastModifiedPermissions(identity: string, callback: (lastModified: string) => void): void;
}
