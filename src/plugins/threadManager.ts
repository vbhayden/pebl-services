import { PeBLPlugin } from "../models/peblPlugin";
import { ThreadManager } from "../interfaces/threadManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Message } from "../models/message";
import { ServiceMessage } from "../models/serviceMessage";
import { MessageTemplate } from "../models/messageTemplate";
import { Voided } from "../models/xapiStatement";
import { PermissionSet } from "../models/permission";
import { GroupManager } from "../interfaces/groupManager";

export class DefaultThreadManager extends PeBLPlugin implements ThreadManager {
  private sessionData: SessionDataManager;
  private groupManager: GroupManager;

  constructor(sessionData: SessionDataManager, groupManager: GroupManager) {
    super();
    this.sessionData = sessionData;
    this.groupManager = groupManager;

    this.addMessageTemplate(new MessageTemplate("saveThreadedMessage",
      this.validateStoreThreadedMessage.bind(this),
      this.authorizeStoreThreadedMessage.bind(this),
      (payload: { [key: string]: any }) => {
        this.storeMessage(payload.identity, payload.message, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("getThreadedMessages",
      this.validateGetThreadedMessages.bind(this),
      this.authorizeGetThreadedMessages.bind(this),
      (payload: { [key: string]: any }) => {
        this.getMessages(payload.identity, payload.thread, payload.timestamp, payload.callback, payload.options);
      }));

    this.addMessageTemplate(new MessageTemplate("subscribeThread",
      this.validateSubscribeThread.bind(this),
      this.authorizeSubscribeThread.bind(this),
      (payload: { [key: string]: any }) => {
        this.subscribeThread(payload.identity, payload.thread, payload.callback, payload.options);
      }));

    this.addMessageTemplate(new MessageTemplate("unsubscribeThread",
      this.validateUnsubscribeThread.bind(this),
      this.authorizeUnsubscribeThread.bind(this),
      (payload: { [key: string]: any }) => {
        this.unsubscribeThread(payload.identity, payload.thread, payload.callback, payload.options);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteThreadedMessage",
      this.validateDeleteThreadedMessage.bind(this),
      this.authorizeDeleteThreadedMessage.bind(this),
      (payload: { [key: string]: any }) => {
        this.deleteMessage(payload.identity, payload.thread, payload.xId, payload.callback, payload.options);
      }));

    this.addMessageTemplate(new MessageTemplate("getSubscribedThreads",
      this.validateGetSubscribedThreads.bind(this),
      this.authorizeGetSubscribedThreads.bind(this),
      (payload: { [key: string]: any }) => {
        this.getSubscribedThreads(payload.identity, payload.callback);
      }))
  }

  private validateThread(thread: string): boolean {
    //Validates the base thread to make sure its not pretending to be a group thread
    if (thread.includes('_group-') || thread.includes('_private-'))
      return false;
    else
      return true;
  }

  validateGetThreadedMessages(payload: { [key: string]: any }): boolean {
    if (payload.thread && typeof payload.thread === "string") {
      if (!this.validateThread(payload.thread))
        return false;

      if (payload.options) {
        if (!(payload.options instanceof Object))
          return false;
        if (payload.options.groupId && typeof payload.options.groupId !== "string")
          return false;
        if (payload.options.isPrivate && typeof payload.options.isPrivate !== "boolean")
          return false;
      }

      return true;
    }
    return false;
  }

  authorizeGetThreadedMessages(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType]);
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType];

    return canUser || canGroup;
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
    if (payload.thread && typeof payload.thread === "string") {
      if (!this.validateThread(payload.thread))
        return false;

      if (payload.groupId && typeof payload.groupId !== "string")
        return false;

      if (payload.isPrivate && typeof payload.isPrivate !== "boolean")
        return false;
    }
    return false;
  }

  authorizeSubscribeThread(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType]);
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType];

    return canUser || canGroup;
  }

  validateUnsubscribeThread(payload: { [key: string]: any }): boolean {
    if (payload.thread && typeof payload.thread === "string") {
      if (!this.validateThread(payload.thread))
        return false;

      if (payload.groupId && typeof payload.groupId !== "string")
        return false;

      if (payload.isPrivate && typeof payload.isPrivate !== "boolean")
        return false;
    }
    return false;
  }

  authorizeUnsubscribeThread(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType]);
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType];

    return canUser || canGroup;
  }

  validateDeleteThreadedMessage(payload: { [key: string]: any }): boolean {
    //TODO: Does the user own the message they are trying to modify?

    return false;
  }

  authorizeDeleteThreadedMessage(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    return false;
  }

  validateGetSubscribedThreads(payload: { [key: string]: any }): boolean {
    return true;
  }

  authorizeGetSubscribedThreads(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType]);
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType];

    return canUser || canGroup;
  }

  subscribeThread(userId: string, baseThread: string, callback: ((success: boolean) => void), options?: { [key: string]: any }): void {
    let thread = baseThread;
    if (options && options.groupId) {
      thread = this.getGroupScopedThread(thread, options.groupId);
      this.sessionData.setHashValue('user:' + userId + ':groupThreads:' + options.groupId, baseThread, baseThread);
    } else if (options && options.isPrivate) {
      thread = this.getPrivateScopedThread(thread, userId);
      this.sessionData.setHashValue('user:' + userId + ':privateThreads', baseThread, baseThread);
    } else {
      this.sessionData.setHashValue('user:' + userId + ':threads', baseThread, baseThread);
    }
    this.sessionData.setHashValues('users:thread:' + thread, [userId, userId]);

    callback(true);
  }

  unsubscribeThread(userId: string, baseThread: string, callback: ((success: boolean) => void), options?: { [key: string]: any }): void {
    let thread = baseThread;
    if (options && options.groupId) {
      thread = this.getGroupScopedThread(thread, options.groupId);
      this.sessionData.deleteHashValue('user:' + userId + ':groupThreads:' + options.groupId, baseThread, (deleted) => { });
    } else if (options && options.isPrivate) {
      thread = this.getPrivateScopedThread(thread, userId);
      this.sessionData.deleteHashValue('user:' + userId + ':privateThreads', baseThread, (deleted) => { });
    } else {
      this.sessionData.deleteHashValue('user:' + userId + ':threads', baseThread, (deleted) => { });
    }
    this.sessionData.deleteHashValue('users:thread:' + thread, userId, (deleted) => { callback(deleted) });
  }

  private getSubscribedUsers(realThread: string, callback: ((users: string[]) => void)): void {
    this.sessionData.getHashValues('users:thread:' + realThread, callback);
  }

  getSubscribedThreads(userId: string, callback: ((threads: { [key: string]: any }) => void)): void {
    let threadsObject = {
      threads: [] as string[],
      privateThreads: [] as string[],
      groupThreads: {} as { [key: string]: string[] }
    };
    this.groupManager.getUsersGroups(userId, (groupIds) => {
      this.sessionData.getHashMultiKeys(groupIds, (groupThreads) => {
        threadsObject.groupThreads = groupThreads;
        this.sessionData.getHashKeys('user:' + userId + ':threads', (threads) => {
          threadsObject.threads = threads;
          this.sessionData.getHashKeys('user:' + userId + ':privateThreads', (privateThreads) => {
            threadsObject.privateThreads = privateThreads;
            callback(threadsObject);
          });
        });
      });
    });
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
        if (user !== message.name) //Don't send the message to the sender
          this.sessionData.broadcast('realtime:userid:' + user, JSON.stringify(new ServiceMessage({
            identity: user,
            requestType: "newThreadedMessage",
            payload: {
              message: message,
              thread: message.thread,
              groupId: message.groupId,
              isPrivate: message.isPrivate
            }
          })));
      }
    });
    callback(true);
  }

  getMessages(userId: string, baseThread: string, timestamp: number, callback: ((data: { messages: (Message | Voided)[], thread: string, groupId?: string, isPrivate?: boolean }) => void), options?: { [key: string]: any }): void {
    let thread = baseThread;
    if (options && options.groupId)
      thread = this.getGroupScopedThread(thread, options.groupId);
    else if (options && options.isPrivate)
      thread = this.getPrivateScopedThread(thread, userId);

    this.sessionData.getValuesGreaterThanTimestamp('timestamp:threads:' + thread, timestamp, (data) => {
      this.sessionData.getHashMultiField('threads:' + thread, data, (vals) => {
        callback({
          messages: vals.map((val) => {
            let obj = JSON.parse(val);
            if (Message.is(obj))
              return new Message(obj);
            else
              return new Voided(obj);
          }),
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
            this.sessionData.broadcast('realtime:userid:' + user, JSON.stringify(new ServiceMessage({
              identity: user,
              requestType: "newThreadedMessage",
              payload: {
                message: voided,
                thread: baseThread,
                groupId: options ? options.groupId : undefined,
                isPrivate: options ? options.isPrivate : undefined
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
