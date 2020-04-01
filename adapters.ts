import {ServiceMessage, UserProfile, Annotation, SharedAnnotation, XApiStatement, Competency, Message} from './models';

export interface Dispatch {
	//TODO: define this ServiceMessage
	getQueuedMessage(): ServiceMessage; //Get the next highest priority message from the queue

	dispatchToLrs(message: ServiceMessage): void; //Dispatch the message to the LRS component plugin
	dispatchToDatabase(message: ServiceMessage): void; //Dispatch the message to the DB component plugin
	dispatchToClient(message: ServiceMessage): void; //Dispatch the message to the connection manager to go back to the client
	dispatchToCache(message: ServiceMessage): void; //Dispatch the message to the user session data plugin

	//TODO: Should this return a const value representing the target for dispatch?
	determineDispatchTarget(message: ServiceMessage): void; //Based on the message, determine which target to dispatch to
}

export interface MessageQueue {
	enqueueMessage(message: ServiceMessage): void; //Place the message into the queue

	//TODO: Is there a priority for messages?
}

export interface SessionDataCache {
	//TODO: Are xAPI statements being stored in the cache or a different format for the data?
	getAnnotationsForBook(userProfile: UserProfile, book: string): Annotation[]; //Retrieve annotations made by the user within a specific book
	getAnnotations(userProfile: UserProfile): Annotation[]; //Retrieve annotations made by the user across all books
	saveAnnotationsForBook(userProfile: UserProfile, book: string, stmts: Annotation[]): void; //Store annotations made by the user within the specific book

	getSharedAnnotationsForBook(userProfile: UserProfile, book: string): SharedAnnotation[]; //Retrieve shared annotations visible to the user made within a specific book
	getSharedAnnotations(userProfile: UserProfile): SharedAnnotation[]; //Retrieve shared annotations visible to the user made across all books
	saveSharedAnnotationsForBook(userProfile: UserProfile, book: string, stmts: SharedAnnotation[]): void; //Store shared annotations visible to the user made within the specific book

	removeAnnotation(userProfile: UserProfile, id: string): void; //Removes the annotation with the specific id
	removeSharedAnnotation(userProfile: UserProfile, id: string): void; //Removes the shared annotation with the specific id


	getEventsForBook(userProfile: UserProfile, book: string): XApiStatement[]; //Retrieve all events for this user made within the specific book
	getEvents(userProfile: UserProfile): XApiStatement[]; //Retrieve all events for this user
	saveEventsForBook(userProfile: UserProfile, book: string, events: XApiStatement[]): void; // Store the events for this user made within the specific book
	saveEvents(userProfile: UserProfile, events: XApiStatement[]): void; // Store the events for this user
	removeEvent(userProfile: UserProfile, id: string): void; //Removes the event with the specified id


	getCompetencies(userProfile: UserProfile): Competency[]; //Retrueve competencies for this user
	saveCompetencies(userProfile: UserProfile, competencies: Competency[]): void; //Store competencies for this user
	removeCompetency(userProfile: UserProfile, id: string): void; //Removes the competency with the specified id


	getMessages(userProfile: UserProfile, thread: string): Message[]; //Retrieve messages for the specified thread
	saveMessages(userProfile: UserProfile, thread: string, messages: Message[]): void; //Store messages for the specified thread
	removeMessage(userProfile: UserProfile, id: string): void; //Removes the message with the specified id


	getNotifications(userProfile: UserProfile): Notification[]; //Retrieves all notifications for this user
	getNotificationsForBook(userProfile: UserProfile, book: string): Notification[]; //Retrieves all notifications for the specified book for this user
	saveNotifications(userProfile: UserProfile, notifications: Notification[]): void; //Stores the notifications for this user
	removeNotification(userProfile: UserProfile, id: string): void; //Removes the notification with the specified id
}