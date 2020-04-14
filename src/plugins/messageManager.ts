import { PeBLPlugin } from "../models/peblPlugin";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Message } from "../models/message";
import { generateUserMessagesKey, generateMessagesKey } from "../utils/constants";
import { MessageManager } from "../interfaces/messageManager";

export class DefaultMessageManager extends PeBLPlugin implements MessageManager {

  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    // this.addMessageTemplate(new MessageTemplate("getMessages",
    //   this.validateGetMessages,
    //   (payload) => {
    //     this.getMessages(payload.identity, payload.callback);
    //   }));

    // this.addMessageTemplate(new MessageTemplate("saveMessages",
    //   this.validateSaveMessages,
    //   (payload) => {
    //     this.saveMessages(payload.identity, payload.messages, payload.callback);
    //   }));

    // this.addMessageTemplate(new MessageTemplate("deleteMessage",
    //   this.validateDeleteMessages,
    //   (payload) => {
    //     this.deleteMessage(payload.identity, payload.xId, payload.callback);
    //   }));
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


  getMessages(identity: string, callback: ((messages: Message[]) => void)): void {
    this.sessionData.getHashValues(generateUserMessagesKey(identity),
      (result: string[]) => {
        callback(result.map(function(x) {
          return new Message(JSON.parse(x));
        }))
      })
  }

  saveMessages(identity: string, messages: Message[], callback: ((success: boolean) => void)): void {
    let arr = [];
    for (let message of messages) {
      let messageStr = JSON.stringify(message);
      arr.push(generateMessagesKey(message.id));
      arr.push(messageStr);
      this.sessionData.queueForLrs(messageStr);
    }
    this.sessionData.setHashValues(generateUserMessagesKey(identity), arr);
    callback(true);
  }

  deleteMessage(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.getHashValue(generateUserMessagesKey(identity), generateMessagesKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
      }
      this.sessionData.deleteHashValue(generateUserMessagesKey(identity),
        generateMessagesKey(id), (result: boolean) => {
          if (!result) {
            console.log("failed to remove message", id);
          }
          callback(result);
        });
    });
  }
}
