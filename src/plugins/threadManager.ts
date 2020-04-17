import { PeBLPlugin } from "../models/peblPlugin";
import { ThreadManager } from "../interfaces/threadManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Message } from "../models/message";
import { ServiceMessage } from "../models/serviceMessage";
import { MessageTemplate } from "../models/messageTemplate";
import { Voided } from "../models/xapiStatement";
import { PermissionSet } from "../models/permission";
import { generateBroadcastQueueForUserId } from "../utils/constants";

export class DefaultThreadManager extends PeBLPlugin implements ThreadManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;

    this.addMessageTemplate(new MessageTemplate("storeThreadedMessage",
      this.validateStoreThreadedMessage.bind(this),
      this.authorizeStoreThreadedMessage.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.storeMessage(payload.identity, payload.message, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("getThreadedMessages",
      this.validateGetThreadedMessages.bind(this),
      this.authorizeGetThreadedMessages.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getMessages(payload.identity, payload.thread, payload.timestamp, dispatchCallback, payload.groupId);
      }));

    this.addMessageTemplate(new MessageTemplate("subscribeThread",
      this.validateSubscribeThread.bind(this),
      this.authorizeSubscribeThread.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.subscribeThread(payload.identity, payload.thread, dispatchCallback, payload.groupId);
      }));

    this.addMessageTemplate(new MessageTemplate("unsubscribeThread",
      this.validateUnsubscribeThread.bind(this),
      this.authorizeUnsubscribeThread.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.unsubscribeThread(payload.identity, payload.thread, dispatchCallback, payload.groupId);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteThreadedMessage",
      this.validateDeleteThreadedMessage.bind(this),
      this.authorizeDeleteThreadedMessage.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.deleteMessage(payload.identity, payload.thread, payload.xId, dispatchCallback, payload.groupId);
      }));
  }

  private validateThread(thread: string): boolean {
    //Validates the base thread to make sure its not pretending to be a group thread
    if (thread.includes('_group-') || thread.includes('_private-'))
      return false;
    else
      return true;
  }

  validateGetThreadedMessages(payload: { [key: string]: any }): boolean {
    if (payload.message && Message.is(payload.message)) {
      if (!this.validateThread(payload.message.thread))
        return false;

      payload.message = new Message(payload.message);
      return true;
    }
    return false;
  }

  authorizeGetThreadedMessages(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return true;
  }

  validateStoreThreadedMessage(payload: { [key: string]: any }): boolean {
    if (payload.message && Message.is(payload.message)) {
      if (!this.validateThread(payload.message.thread))
        return false;

      payload.message = new Message(payload.message);
      return true;
    }
    return false;
  }

  authorizeStoreThreadedMessage(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType]);
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType];

    return canUser || canGroup;
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

  subscribeThread(userId: string, thread: string, callback: ((success: boolean) => void), options?: { [key: string]: any }): void {
    if (options && options.groupId)
      thread = this.getGroupScopedThread(thread, options.groupId);
    else if (options && options.isPrivate)
      thread = this.getPrivateScopedThread(thread, userId);
    this.sessionData.setHashValues('users:thread:' + thread, [userId, userId]);
    callback(true);
  }

  unsubscribeThread(userId: string, thread: string, callback: ((success: boolean) => void), options?: { [key: string]: any }): void {
    if (options && options.groupId)
      thread = this.getGroupScopedThread(thread, options.groupId);
    else if (options && options.isPrivate)
      thread = this.getPrivateScopedThread(thread, userId);
    this.sessionData.deleteHashValue('users:thread:' + thread, userId, (deleted) => { callback(deleted) });
  }

  private getSubscribedUsers(realThread: string, callback: ((users: string[]) => void)): void {
    this.sessionData.getHashValues('users:thread:' + realThread, callback);
  }

  getGroupScopedThread(thread: string, groupId: string): string {
    return thread + '_group-' + groupId;
  }

  getPrivateScopedThread(thread: string, username: string): string {
    return thread + '_user-' + username;
  }

  storeMessage(userId: string, message: Message, callback: ((success: boolean) => void)): void {
    let thread = message.thread;
    if (message.groupId)
      thread = this.getGroupScopedThread(thread, message.groupId);
    else if (message.isPrivate)
      thread = this.getPrivateScopedThread(thread, userId);

    let date = new Date();
    message.stored = date.toISOString();

    let messageStr = JSON.stringify(message);

    this.sessionData.queueForLrs(messageStr);
    this.sessionData.addTimestampValue('timestamp:threads:' + thread, date.getTime(), message.id);
    this.sessionData.setHashValues('threads:' + thread, [message.id, messageStr]);

    this.getSubscribedUsers(thread, (users) => {
      for (let user of users) {
        if (user !== message.name) {//Don't send the message to the sender
          this.sessionData.broadcast(generateBroadcastQueueForUserId(user), JSON.stringify(new ServiceMessage(user, {
            requestType: "newThreadedMessage",
            data: message,
            thread: message.thread,
            groupId: message.groupId,
            isPrivate: message.isPrivate
          })));
        }
      }
    });
    callback(true);
  }

  getMessages(userId: string, baseThread: string, timestamp: number, callback: ((messages: (Message | Voided)[], additionalData: { [key: string]: any }) => void), options?: { [key: string]: any }): void {
    let thread = baseThread;
    if (options && options.groupId)
      thread = this.getGroupScopedThread(thread, options.groupId);
    else if (options && options.isPrivate)
      thread = this.getPrivateScopedThread(thread, userId);

    this.sessionData.getValuesGreaterThanTimestamp('timestamp:threads:' + thread, timestamp, (data) => {
      this.sessionData.getHashMultiField('threads:' + thread, data, (vals) => {
        callback(vals.map((val) => {
          let obj = JSON.parse(val);
          if (Message.is(obj))
            return new Message(obj);
          else
            return new Voided(obj);
        }), {
          thread: baseThread,
          groupId: options ? options.groupId : undefined,
          isPrivate: options ? options.isPrivate : undefined
        });
      });
    });
  }

  deleteMessage(userId: string, baseThread: string, messageId: string, callback: ((success: boolean) => void), options?: { [key: string]: any }): void {
    let thread = baseThread;
    if (options && options.groupId)
      thread = this.getGroupScopedThread(baseThread, options.groupId);
    else if (options && options.isPrivate)
      thread = this.getPrivateScopedThread(baseThread, userId)

    this.sessionData.getHashValue('threads:' + thread, messageId, (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
        let voided = new Message(JSON.parse(data)).toVoidRecord();
        this.sessionData.addTimestampValue('timestamp:threads:' + thread, new Date(voided.stored).getTime(), voided.id);
        this.sessionData.setHashValues('threads:' + thread, [voided.id, JSON.stringify(voided)]);
        this.getSubscribedUsers(thread, (users) => {
          for (let user of users) {
            this.sessionData.broadcast(generateBroadcastQueueForUserId(user), JSON.stringify(new ServiceMessage(user, {
              requestType: "newThreadedMessage",
              data: voided,
              thread: baseThread,
              groupId: options ? options.groupId : undefined,
              isPrivate: options ? options.isPrivate : undefined
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
