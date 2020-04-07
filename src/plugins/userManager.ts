import { UserManager } from "../interfaces/userManager";
import { UserProfile } from "../models/userProfile";
import { Role } from "../models/role";
import { PeBLPlugin } from "../models/peblPlugin";

export class DefaultUserManager extends PeBLPlugin implements UserManager {

  constructor() {
    super();
  }

  // Add a user with the specified metadata    
  addUserProfile(id: string, userName: string, userEmail?: string, roles?: Role[]): void {

  }

  // Delete a user with the specified id
  deleteUserProfile(id: string): void {
  }

  // Update user metadata
  updateUserProfile(id: string, userName?: string, userEmail?: string): void {

  }


  //Get the specified users profile
  getUserProfile(id: string, callback: ((user: UserProfile) => void)): void {

  }

  // Get all users
  getUsers(callback: ((users: UserProfile[]) => void)): void {

  }
}
