import { UserProfile } from "../models/userProfile";
import { Role } from "../models/role";
import { PeBLPlugin } from "../models/peblPlugin";

export interface UserManager extends PeBLPlugin {
  validateAddUserProfile(payload: { [key: string]: any }): boolean;
  validateDeleteUserProfile(payload: { [key: string]: any }): boolean;
  validateUpdateUserProfile(payload: { [key: string]: any }): boolean;
  validateGetUserProfile(payload: { [key: string]: any }): boolean;

  validateGetUsers(payload: { [key: string]: any }): boolean;

  addUserProfile(id: string, userName: string, userEmail?: string, roles?: Role[]): void; // Add a user with the specified metadata
  deleteUserProfile(id: string): void; // Delete a user with the specified id
  updateUserProfile(id: string, userName?: string, userEmail?: string): void; // Update user metadata
  getUserProfile(id: string, callback: ((user: UserProfile) => void)): void; //Get the specified users profile

  getUsers(callback: ((users: UserProfile[]) => void)): void; // Get all users
}
