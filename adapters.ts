import {ServiceMessage} from './models';

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