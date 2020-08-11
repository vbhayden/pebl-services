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

  terminate(done: () => void): void;

  removeOutgoingQueue(sessionId: string): void;

  subscribeNotifications(userid: string, sessionId: string, websocket: WebSocket, callback: ((success: boolean) => void)): void;
  unsubscribeNotifications(userid: string): void;
}
