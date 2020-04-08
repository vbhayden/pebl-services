import { Message } from "../models/message";
import { UserProfile } from "../models/userProfile";
import { PeBLPlugin } from "../models/peblPlugin";

export interface MessageManager extends PeBLPlugin {

  validateGetMessages(payload: { [key: string]: any }): boolean;
  validateSaveMessages(payload: { [key: string]: any }): boolean;
  validateDeleteMessages(payload: { [key: string]: any }): boolean;

  getMessages(userProfile: UserProfile, callback: ((messages: Message[]) => void)): void;

  saveMessages(userProfile: UserProfile, messages: Message[]): void;

  deleteMessage(userProfile: UserProfile, id: string): void;

}
