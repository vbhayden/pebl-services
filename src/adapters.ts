import { Request, Response } from 'express';
import { ServiceMessage, UserProfile, Annotation, SharedAnnotation, XApiStatement, Message, Activity, ProgramAction, XApiQuery, Profile, Group, GroupRole, Role, Asset, Membership, ModuleEvent } from './models';

export interface MessageQueue {
  //TODO: Is there a priority for messages?
  enqueueIncomingMessage(message: ServiceMessage, callback: ((success: boolean) => void)): void;
  enqueueOutgoingMessage(message: ServiceMessage, callback: ((success: boolean) => void)): void;

  createIncomingQueue(callback: ((success: boolean) => void)): void;
  createOutgoingQueue(sessionId: string, callback: ((success: boolean) => void), receivedMessage: ((message: ServiceMessage, processed: ((success: boolean) => void)) => void)): void;

  //TODO: define this ServiceMessage
  dispatchMessage(message: ServiceMessage): void; //Get the next highest priority message from the queue

  dispatchToLrs(message: ServiceMessage): void; //Dispatch the message to the LRS component plugin
  dispatchToDatabase(message: ServiceMessage): void; //Dispatch the message to the DB component plugin
  dispatchToClient(message: ServiceMessage): void; //Dispatch the message to the connection manager to go back to the client
  dispatchToCache(message: ServiceMessage): void; //Dispatch the message to the user session data plugin

  //TODO: Should this return a const value representing the target for dispatch?
  determineDispatchTarget(message: ServiceMessage): string; //Based on the message, determine which target to dispatch to
}

export interface SessionDataCache {
  //TODO: Are xAPI statements being stored in the cache or a different format for the data?
  // getAnnotationsForBook(userProfile: UserProfile, book: string): Annotation[]; //Retrieve annotations made by the user within a specific book
  getAnnotations(userProfile: UserProfile, callback: ((stmts: Annotation[]) => void)): void; //Retrieve annotations made by the user across all books
  saveAnnotations(userProfile: UserProfile, stmts: Annotation[]): void; //Store annotations made by the user within the specific book

  // getSharedAnnotationsForBook(userProfile: UserProfile, book: string): SharedAnnotation[]; //Retrieve shared annotations visible to the user made within a specific book
  getSharedAnnotations(userProfile: UserProfile, callback: ((stmts: SharedAnnotation[]) => void)): void; //Retrieve shared annotations visible to the user made across all books
  saveSharedAnnotations(userProfile: UserProfile, stmts: SharedAnnotation[]): void; //Store shared annotations visible to the user made within the specific book

  removeAnnotation(userProfile: UserProfile, id: string): void; //Removes the annotation with the specific id
  removeSharedAnnotation(userProfile: UserProfile, id: string): void; //Removes the shared annotation with the specific id


  // getEventsForBook(userProfile: UserProfile, book: string): XApiStatement[]; //Retrieve all events for this user made within the specific book
  getEvents(userProfile: UserProfile, callback: ((stmts: XApiStatement[]) => void)): void //Retrieve all events for this user
  // saveEventsForBook(userProfile: UserProfile, book: string, events: XApiStatement[]): void; // Store the events for this user made within the specific book
  saveEvents(userProfile: UserProfile, events: XApiStatement[]): void; // Store the events for this user
  removeEvent(userProfile: UserProfile, id: string): void; //Removes the event with the specified id


  // getCompetencies(userProfile: UserProfile, callback: ((competencies: Competency[]) => void)): void; //Retrueve competencies for this user
  // saveCompetencies(userProfile: UserProfile, competencies: Competency[]): void; //Store competencies for this user
  // removeCompetency(userProfile: UserProfile, id: string): void; //Removes the competency with the specified id


  getMessages(userProfile: UserProfile, callback: ((messages: Message[]) => void)): void //Retrieve messages for the specified thread
  saveMessages(userProfile: UserProfile, messages: Message[]): void; //Store messages for the specified thread
  removeMessage(userProfile: UserProfile, id: string): void; //Removes the message with the specified id


  getNotifications(userProfile: UserProfile, callback: ((notifications: XApiStatement[]) => void)): void; //Retrieves all notifications for this user
  // getNotificationsForBook(userProfile: UserProfile, book: string): Notification[]; //Retrieves all notifications for the specified book for this user
  saveNotifications(userProfile: UserProfile, notifications: XApiStatement[]): void; //Stores the notifications for this user
  removeNotification(userProfile: UserProfile, id: string): void; //Removes the notification with the specified id


  getActivities(userProfile: UserProfile, callback: ((activities: Activity[]) => void)): void;
  saveActivities(userProfile: UserProfile, activities: Activity[]): void;
  removeActivity(userProfile: UserProfile, id: string): void;

  getActivityEvents(userProfile: UserProfile, callback: ((events: ProgramAction[]) => void)): void;
  saveActivityEvents(userProfile: UserProfile, events: ProgramAction[]): void;
  removeActivityEvent(userProfile: UserProfile, id: string): void;

  getAssets(userProfile: UserProfile, callback: ((assets: Asset[]) => void)): void;
  saveAssets(userProfile: UserProfile, assets: Asset[]): void;
  removeAsset(userProfile: UserProfile, id: string): void;

  getMemberships(userProfile: UserProfile, callback: ((memberships: Membership[]) => void)): void;
  saveMemberships(userProfile: UserProfile, memberships: Membership[]): void;
  removeMebership(userProfile: UserProfile, id: string): void;

  getModuleEvents(userProfile: UserProfile, callback: ((events: ModuleEvent[]) => void)): void;
  saveModuleEvents(userProfile: UserProfile, events: ModuleEvent[]): void;
  removeModuleEvent(userProfile: UserProfile, id: string): void;
}

export interface LRS {
  storeStatements(stmts: XApiStatement[]): void; //Store the specified statements into an LRS
  voidStatements(stmts: XApiStatement[]): void; //Void the specified statements in an LRS

  getStatements(xApiQuery: XApiQuery, callback: ((stmts?: XApiStatement[]) => void)): void;

  storeActivity(activity: Activity, callback: ((success: boolean) => void)): void; //Store the specified activity into an LRS
  getActivity(activityType: string, callback: ((activity?: Activity) => void), activityId?: string): void;  //Retrieves the specified activity from an LRS
  removeActivity(activity: Activity, callback: ((success: boolean) => void)): void; //Removes the specified activity from an LRS

  storeProfile(profile: Profile, callback: ((success: boolean) => void)): void; //Store the specified profile into an LRS
  getProfile(profileType: string, callback: ((profile?: Profile) => void), profileId?: string): void; //Retrieves the specified profile from an LRS
  removeProfile(profile: Profile, callback: ((success: boolean) => void)): void; //Removes the specified profile from an LRS
}

export interface Groups {
  addGroup(id: string, groupName: string, groupDescription: string, groupAvatar?: string): void; //Add a group with the specified data to the system
  deleteGroup(id: string): void; //Delete the group with the specified Id
  updateGroup(id: string, groupName?: string, groupDescription?: string, groupAvatar?: string): void; //Update group metadata for group with specified Id

  addGroupMember(id: string, userId: string, role: string): void; //Add the specified userId as a member of the specified group with the specified metadata
  deleteGroupMember(id: string, userId: string): void; //Remove the specified userId from the specified group
  updateGroupMember(id: string, userId: string, role: string): void; //Update specified user metadata in specified group

  getGroups(callback: ((groups: Group[]) => void)): void; //Get all existing groups

  createGroupRole(id: string, roleName: string, permissions: Role[]): void; //Create a role within a group
  updateGroupRole(id: string, roleName?: string, permissions?: Role[]): void; //Update a role within a group
  deleteGroupRole(id: string, roleName: string): void; //Delete a role within a group

  getGroupRoles(id: string, callback: ((groupRoles: GroupRole[]) => void)): void; // Get all roles within a group
}

export interface Users {
  addUserProfile(id: string, userName: string, userEmail?: string, roles?: Role[]): void; // Add a user with the specified metadata
  deleteUserProfile(id: string): void; // Delete a user with the specified id
  updateUserProfile(id: string, userName?: string, userEmail?: string): void; // Update user metadata
  getUserProfile(id: string, callback: ((user: UserProfile) => void)): void; //Get the specified users profile

  getUsers(callback: ((users: UserProfile[]) => void)): void; // Get all users
}

export interface Roles {
  addRole(id: string, name: string, permissions: string[]): void; //Add a role based on a set of permissions
  deleteRole(id: string): void; //Remove a role
  updateRole(id: string, name?: string, permissions?: string[]): void; //Updates the permission set and/or name of a role
  getRole(id: string, callback: ((role: Role) => void)): void; //Get a role with the specified id

  getRoles(callback: ((roles: Role[]) => void)): void; //Get all the roles in the system
}

export interface Authentication {
  validate(token: string, res: Response): void;
  refresh(session: Express.Session, res: Response): void;
  login(req: Request, session: Express.Session, res: Response): void;
  logout(session: Express.Session, res: Response): void;
  getProfile(session: Express.Session): void;
  redirect(req: Request, session: Express.Session, res: Response): void;
}

export interface MessageValidation {
  validate(data: { [key: string]: any }): void;

}
