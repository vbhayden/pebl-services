import { Message } from "../models/message";
import { PeBLPlugin } from "../models/peblPlugin";

export interface MessageManager extends PeBLPlugin {

  validateGetMessages(payload: { [key: string]: any }): boolean;
  validateSaveMessages(payload: { [key: string]: any }): boolean;
  validateDeleteMessages(payload: { [key: string]: any }): boolean;

  getMessages(identity: string, callback: ((messages: Message[]) => void)): void;

  saveMessages(identity: string, messages: Message[]): void;

  deleteMessage(identity: string, id: string): void;

}
