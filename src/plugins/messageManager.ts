import { PeBLPlugin } from "../models/peblPlugin";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Message } from "../models/message";
import { generateUserMessagesKey, generateMessagesKey } from "../utils/constants";
import { MessageManager } from "../interfaces/messageManager";
import { MessageTemplate } from "../models/messageTemplate";
import { PermissionSet } from "../models/permission";
import { Voided } from "../models/xapiStatement";
import { ServiceMessage } from "../models/serviceMessage";

export class DefaultMessageManager extends PeBLPlugin implements MessageManager {

  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;
    this.addMessageTemplate(new MessageTemplate("getMessages",
      this.validateGetMessages.bind(this),
      this.authorizeGetMessages.bind(this),
      (payload) => {
        this.getMessages(payload.identity, payload.timestamp, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("saveMessages",
      this.validateSaveMessages.bind(this),
      this.authorizeSaveMessages.bind(this),
      (payload) => {
        this.saveMessages(payload.identity, payload.messages, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteMessage",
      this.validateDeleteMessages.bind(this),
      this.authorizeDeleteMessages.bind(this),
      (payload) => {
        this.deleteMessage(payload.identity, payload.xId, payload.callback);
      }));
  }

  validateGetMessages(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeGetMessages(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSaveMessages(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeSaveMessages(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteMessages(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeDeleteMessages(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  getMessages(identity: string, timestamp: number, callback: ((messages: (Message | Voided)[]) => void)): void {
    this.sessionData.getValuesGreaterThanTimestamp('timestamp:messages:user:' + identity, timestamp, (data) => {
      this.sessionData.getHashMultiField(generateUserMessagesKey(identity), data, (result) => {
        callback(result.map(function(x) {
          let obj = JSON.parse(x);
          if (Message.is(obj))
            return new Message(obj);
          else
            return new Voided(obj);
        }));
      });
    });
  }

  saveMessages(identity: string, messages: Message[], callback: ((success: boolean) => void)): void {
    let arr = [];
    let date = new Date();
    for (let message of messages) {
      message.stored = date.toISOString();
      let messageStr = JSON.stringify(message);
      arr.push(generateMessagesKey(message.id));
      arr.push(messageStr);
      this.sessionData.queueForLrs(messageStr);
      this.sessionData.addTimestampValue('timestamp:messages:user:' + identity, date.getTime(), message.id);
      this.sessionData.broadcast('realtime:userid:' + identity, JSON.stringify(new ServiceMessage({
        identity: identity,
        payload: {
          requestType: "newMessage",
          data: message
        }
      })));
    }
    this.sessionData.setHashValues(generateUserMessagesKey(identity), arr);
    callback(true);
  }

  deleteMessage(identity: string, id: string, callback: ((success: boolean) => void)): void {
    this.sessionData.getHashValue(generateUserMessagesKey(identity), generateMessagesKey(id), (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
        let voided = new Message(JSON.parse(data)).toVoidRecord();
        this.sessionData.addTimestampValue('timestamp:messages:user:' + identity, new Date(voided.stored).getTime(), voided.id);
        this.sessionData.setHashValues(generateUserMessagesKey(identity), [voided.id, JSON.stringify(voided)]);
        this.sessionData.broadcast('realtime:userid:' + identity, JSON.stringify(new ServiceMessage({
          identity: identity,
          payload: {
            requestType: "newMessage",
            data: voided
          }
        })));
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
