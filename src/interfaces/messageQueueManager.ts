import { ServiceMessage } from "../models/serviceMessage";
import * as WebSocket from 'ws';

export interface MessageQueueManager {
  //TODO: Is there a priority for messages?
  initialize(): void;

  isUpgradeInProgress(): boolean;

  enqueueIncomingMessage(message: ServiceMessage): Promise<boolean>;
  enqueueOutgoingMessage(message: ServiceMessage): Promise<boolean>;

  createIncomingQueue(): Promise<boolean>;
  createOutgoingQueue(sessionId: string, websocket: WebSocket): Promise<boolean>;

  terminate(done: () => void): void;

  removeOutgoingQueue(sessionId: string): void;

  subscribeNotifications(userid: string, sessionId: string, websocket: WebSocket): Promise<boolean>;
  unsubscribeNotifications(userid: string): void;
}
