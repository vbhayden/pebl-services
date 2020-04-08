import { UserManager } from "../interfaces/userManager";
import { UserProfile } from "../models/userProfile";
import { Role } from "../models/role";
import { PeBLPlugin } from "../models/peblPlugin";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { MessageTemplate } from "../models/messageTemplate";

export class DefaultUserManager extends PeBLPlugin implements UserManager {

  private sessionData: SessionDataManager;

  constructor(redisCache: SessionDataManager) {
    super();
    this.sessionData = redisCache;
    console.log(this.sessionData);
    this.addMessageTemplate(new MessageTemplate("addUserProfile",
      this.validateAddUserProfile,
      (payload) => {
        this.addUserProfile(payload.id, payload.userName, payload.userEmail, payload.roles);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteUserProfile",
      this.validateDeleteUserProfile,
      (payload) => {
        this.deleteUserProfile(payload.id);
      }));

    this.addMessageTemplate(new MessageTemplate("updateUserProfile",
      this.validateUpdateUserProfile,
      (payload) => {
        this.updateUserProfile(payload.id, payload.userName, payload.userEmail);
      }));

    this.addMessageTemplate(new MessageTemplate("getUserProfile",
      this.validateGetUserProfile,
      (payload) => {
        this.getUserProfile(payload.id, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("getUsers",
      this.validateGetUsers,
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
