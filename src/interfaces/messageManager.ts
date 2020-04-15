import { Message } from "../models/message";
import { PeBLPlugin } from "../models/peblPlugin";
import { Voided } from "../models/xapiStatement";

export interface MessageManager extends PeBLPlugin {

  validateGetMessages(payload: { [key: string]: any }): boolean;
  validateSaveMessages(payload: { [key: string]: any }): boolean;
  validateDeleteMessages(payload: { [key: string]: any }): boolean;

  getMessages(identity: string, timestamp: number, callback: ((messages: (Message | Voided)[]) => void)): void;

  saveMessages(identity: string, messages: Message[], callback: ((success: boolean) => void)): void;

  deleteMessage(identity: string, id: string, callback: ((success: boolean) => void)): void;

}
