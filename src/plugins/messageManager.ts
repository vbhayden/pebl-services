import { PeBLPlugin } from "../models/peblPlugin";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { UserProfile } from "../models/userProfile";
import { Message } from "../models/message";
import { generateUserMessagesKey, generateMessagesKey } from "../utils/constants";
import { MessageManager } from "../interfaces/messageManager";

export class DefaultMessageManager extends PeBLPlugin implements MessageManager {

  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    console.log(this.sessionData);
  }

  validateGetMessages(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveMessages(payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteMessages(payload: { [key: string]: any }): boolean {
    return false;
  }


  getMessages(userProfile: UserProfile, callback: ((messages: Message[]) => void)): void {
    this.sessionData.getHashValues(generateUserMessagesKey(userProfile.identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new Message(JSON.parse(x));
        }))
      })
  }

  saveMessages(userProfile: UserProfile, messages: Message[]): void {
    let arr = [];
    for (let message of messages) {
      arr.push(generateMessagesKey(message.id));
      arr.push(JSON.stringify(message));
    }
    this.sessionData.setHashValues(generateUserMessagesKey(userProfile.identity), arr);
  }

  deleteMessage(userProfile: UserProfile, id: string): void {
    this.sessionData.deleteHashValue(generateUserMessagesKey(userProfile.identity),
      generateMessagesKey(id),
      (result: boolean) => {
        if (!result) {
          console.log("failed to delete message", id);
        }
      });
  }
}
