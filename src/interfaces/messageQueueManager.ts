import { ServiceMessage } from "../models/serviceMessage";
import * as WebSocket from 'ws';

export interface MessageQueueManager {
  //TODO: Is there a priority for messages?
  enqueueIncomingMessage(message: ServiceMessage, callback: ((success: boolean) => void)): void;
  enqueueOutgoingMessage(message: ServiceMessage, callback: ((success: boolean) => void)): void;

  createIncomingQueue(callback: ((success: boolean) => void)): void;
  createOutgoingQueue(sessionId: string, websocket: WebSocket, callback: ((success: boolean) => void)): void;

  removeOutgoingQueue(sessionId: string): void;

  //TODO: define this ServiceMessage
  dispatchMessage(message: ServiceMessage): void; //Get the next highest priority message from the queue

  dispatchToLrs(message: ServiceMessage): void; //Dispatch the message to the LRS component plugin
  dispatchToDatabase(message: ServiceMessage): void; //Dispatch the message to the DB component plugin
  dispatchToClient(message: ServiceMessage): void; //Dispatch the message to the connection manager to go back to the client
  dispatchToCache(message: ServiceMessage): void; //Dispatch the message to the user session data plugin

  //TODO: Should this return a const value representing the target for dispatch?
  determineDispatchTarget(message: ServiceMessage): string; //Based on the message, determine which target to dispatch to
}
