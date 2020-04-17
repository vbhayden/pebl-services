import { PeBLPlugin } from "../models/peblPlugin";
import { ThreadManager } from "../interfaces/threadManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Message } from "../models/message";
import { ServiceMessage } from "../models/serviceMessage";
import { MessageTemplate } from "../models/messageTemplate";
import { Voided } from "../models/xapiStatement";
import { PermissionSet } from "../models/permission";

export class DefaultThreadManager extends PeBLPlugin implements ThreadManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;

    this.addMessageTemplate(new MessageTemplate("storeThreadedMessage",
      this.validateStoreThreadedMessage.bind(this),
      this.authorizeStoreThreadedMessage.bind(this),
      (payload: { [key: string]: any }) => {
        this.storeMessage(payload.message, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("getThreadedMessages",
      this.validateGetThreadedMessages.bind(this),
      this.authorizeGetThreadedMessages.bind(this),
      (payload: { [key: string]: any }) => {
        this.getMessages(payload.thread, payload.timestamp, payload.callback, payload.groupId);
      }));

    this.addMessageTemplate(new MessageTemplate("subscribeThread",
      this.validateSubscribeThread.bind(this),
      this.authorizeSubscribeThread.bind(this),
      (payload: { [key: string]: any }) => {
        this.subscribeThread(payload.identity, payload.thread, payload.callback, payload.groupId);
      }));

    this.addMessageTemplate(new MessageTemplate("unsubscribeThread",
      this.validateUnsubscribeThread.bind(this),
      this.authorizeUnsubscribeThread.bind(this),
      (payload: { [key: string]: any }) => {
        this.unsubscribeThread(payload.identity, payload.thread, payload.callback, payload.groupId);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteThreadedMessage",
      this.validateDeleteThreadedMessage.bind(this),
      this.authorizeDeleteThreadedMessage.bind(this),
      (payload: { [key: string]: any }) => {
        this.deleteMessage(payload.thread, payload.xId, payload.callback, payload.groupId);
      }));
  }

  private validateThread(thread: string): boolean {
    //Validates the base thread to make sure its not pretending to be a group thread
    if (thread.includes('_group-'))
      return false;
    else
      return true;
  }

  validateGetThreadedMessages(payload: { [key: string]: any }): boolean {
    //TODO: Does the user have permission to read messages on this thread. If a group message, is the user in that group?
    if (!this.validateThread(payload.thread))
      return false;

    if (payload.groupId) {
      //TODO
      return false;
    }

    return false;
  }

  authorizeGetThreadedMessages(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateStoreThreadedMessage(payload: { [key: string]: any }): boolean {
    //TODO: Does the user have permission to post to this thread. If a group message, is the user in that group?
    if (!this.validateThread(payload.message.thread))
      return false;

    if (payload.message.groupId) {
      //TODO
      return false;
    }

    return false;
  }

  authorizeStoreThreadedMessage(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateSubscribeThread(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeSubscribeThread(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateUnsubscribeThread(payload: { [key: string]: any }): boolean {
    return false;
  }

  authorizeUnsubscribeThread(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateDeleteThreadedMessage(payload: { [key: string]: any }): boolean {
    //TODO: Does the user own the message they are trying to modify?

    return false;
  }

  authorizeDeleteThreadedMessage(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  subscribeThread(userId: string, thread: string, callback: ((success: boolean) => void), groupId?: string): void {
    if (groupId)
      thread = this.getGroupScopedThread(thread, groupId);
    this.sessionData.setHashValues('users:thread:' + thread, [userId, userId]);
    callback(true);
  }

  unsubscribeThread(userId: string, thread: string, callback: ((success: boolean) => void), groupId?: string): void {
    if (groupId)
      thread = this.getGroupScopedThread(thread, groupId);
    this.sessionData.deleteHashValue('users:thread:' + thread, userId, (deleted) => { callback(deleted) });
  }

  private getSubscribedUsers(realThread: string, callback: ((users: string[]) => void)): void {
    this.sessionData.getHashValues('users:thread:' + realThread, callback);
  }

  getGroupScopedThread(thread: string, groupId: string): string {
    return thread + '_group-' + groupId;
  }

  storeMessage(message: Message, callback: ((success: boolean) => void)): void {
    let thread = message.thread;
    if (message.groupId)
      thread = this.getGroupScopedThread(thread, message.groupId);

    let date = new Date();
    message.stored = date.toISOString();

    let messageStr = JSON.stringify(message);

    this.sessionData.queueForLrs(messageStr);
    this.sessionData.addTimestampValue('timestamp:threads:' + thread, date.getTime(), message.id);
    this.sessionData.setHashValues('threads:' + thread, [message.id, messageStr]);

    this.getSubscribedUsers(thread, (users) => {
      for (let user of users) {
        if (user !== message.name) //Don't send the message to the sender
          this.sessionData.broadcast('realtime:userid:' + user, JSON.stringify(new ServiceMessage({
            identity: user,
            payload: {
              requestType: "newThreadedMessage",
              data: message
            }
          })));
      }
    });
    callback(true);
  }

  getMessages(thread: string, timestamp: number, callback: ((messages: (Message | Voided)[]) => void), groupId?: string): void {
    if (groupId)
      thread = this.getGroupScopedThread(thread, groupId);

    this.sessionData.getValuesGreaterThanTimestamp('timestamp:threads:' + thread, timestamp, (data) => {
      this.sessionData.getHashMultiField('threads:' + thread, data, (vals) => {
        callback(vals.map((val) => {
          let obj = JSON.parse(val);
          if (Message.is(obj))
            return new Message(obj);
          else
            return new Voided(obj);
        }));
      });
    });
    this.sessionData.getHashValues('threads:' + thread, (vals) => {
      callback(vals.map((val) => {
        return new Message(JSON.parse(val));
      }));
    });
  }

  deleteMessage(thread: string, messageId: string, callback: ((success: boolean) => void), groupId?: string): void {
    if (groupId)
      thread = this.getGroupScopedThread(thread, groupId);

    this.sessionData.getHashValue('threads:' + thread, messageId, (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
        let voided = new Message(JSON.parse(data)).toVoidRecord();
        this.sessionData.addTimestampValue('timestamp:threads:' + thread, new Date(voided.stored).getTime(), voided.id);
        this.sessionData.setHashValues('threads:' + thread, [voided.id, JSON.stringify(voided)]);
        this.getSubscribedUsers(thread, (users) => {
          for (let user of users) {
            this.sessionData.broadcast('realtime:userid:' + user, JSON.stringify(new ServiceMessage({
              identity: user,
              payload: {
                requestType: "newThreadedMessage",
                data: voided
              }
            })));
          }
        });
      }
      this.sessionData.deleteHashValue('threads:' + thread,
        messageId, (result: boolean) => {
          callback(result);
        });
    });
  }
}
