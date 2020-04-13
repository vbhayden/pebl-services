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

  addUserProfile(id: string, userName: string, userEmail?: string): void; // Add a user with the specified metadata
  deleteUserProfile(id: string): void; // Delete a user with the specified id
  updateUserProfile(id: string, userName?: string, userEmail?: string): void; // Update user metadata
  getUserProfile(id: string, callback: ((user: UserProfile) => void)): void; //Get the specified users profile

  addUserRoles(id: string, roleIds: string[]): void;
  getUserRoles(id: string, callback: (roleIds: string[]) => void): void;
  deleteUserRole(id: string, roleId: string): void;

  getUsers(callback: ((users: UserProfile[]) => void)): void; // Get all users
}
