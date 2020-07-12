import { ServiceMessage } from "../models/serviceMessage";
import * as WebSocket from 'ws';

export interface MessageQueueManager {
  //TODO: Is there a priority for messages?
  initialize(): void;

  isUpgradeInProgress(): boolean;

  enqueueIncomingMessage(message: ServiceMessage, callback: ((success: boolean) => void)): void;
  enqueueOutgoingMessage(message: ServiceMessage, callback: ((success: boolean) => void)): void;

  createIncomingQueue(callback: ((success: boolean) => void)): void;
  createOutgoingQueue(sessionId: string, websocket: WebSocket, callback: ((success: boolean) => void)): void;

  removeOutgoingQueue(sessionId: string): void;

  // dispatchToLrs(message: JobMessage): void; //Dispatch the message to the LRS component plugin
  // dispatchToClient(message: ServiceMessage): void; //Dispatch the message to the connection manager to go back to the client
  // dispatchToCache(message: ServiceMessage): void; //Dispatch the message to the user session data plugin

  subscribeNotifications(userid: string, sessionId: string, websocket: WebSocket, callback: ((success: boolean) => void)): void;
  unsubscribeNotifications(userid: string): void;
}
