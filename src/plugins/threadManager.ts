import { PeBLPlugin } from "../models/peblPlugin";
import { ThreadManager } from "../interfaces/threadManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Message } from "../models/message";
import { ServiceMessage } from "../models/serviceMessage";
import { MessageTemplate } from "../models/messageTemplate";
import { Voided } from "../models/xapiStatement";
import { PermissionSet } from "../models/permission";
import { generateBroadcastQueueForUserId, generateTimestampForThread, generateThreadKey, generateUserThreadsKey, generateUserPrivateThreadsKey, generateUserGroupThreadsKey, generateSubscribedUsersKey, generateUserClearedNotificationsKey } from "../utils/constants";
import { GroupManager } from "../interfaces/groupManager";
import { NotificationManager } from "../interfaces/notificationManager";

export class DefaultThreadManager extends PeBLPlugin implements ThreadManager {
  private sessionData: SessionDataManager;
  private groupManager: GroupManager;
  // private notificationManager: NotificationManager;

  constructor(sessionData: SessionDataManager, groupManager: GroupManager, notificationManager: NotificationManager) {
    super();
    this.sessionData = sessionData;
    this.groupManager = groupManager;
    // this.notificationManager = notificationManager;

    this.addMessageTemplate(new MessageTemplate("saveThreadedMessage",
      this.validateStoreThreadedMessage.bind(this),
      this.authorizeStoreThreadedMessage.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.storeMessage(payload.identity, payload.message, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("getThreadedMessages",
      this.validateGetThreadedMessages.bind(this),
      this.authorizeGetThreadedMessages.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getMessages(payload.identity, payload.requests, dispatchCallback);
      }));

    this.addMessageTemplate(new MessageTemplate("subscribeThread",
      this.validateSubscribeThread.bind(this),
      this.authorizeSubscribeThread.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.subscribeThread(payload.identity, payload.thread, dispatchCallback, payload.options);
      }));

    this.addMessageTemplate(new MessageTemplate("unsubscribeThread",
      this.validateUnsubscribeThread.bind(this),
      this.authorizeUnsubscribeThread.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.unsubscribeThread(payload.identity, payload.thread, dispatchCallback, payload.options);
      }));

    // this.addMessageTemplate(new MessageTemplate("deleteThreadedMessage",
    //   this.validateDeleteThreadedMessage.bind(this),
    //   this.authorizeDeleteThreadedMessage.bind(this),
    //   (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
    //     this.deleteMessage(payload.identity, payload.thread, payload.xId, dispatchCallback, payload.options);
    //   }));

    this.addMessageTemplate(new MessageTemplate("getSubscribedThreads",
      this.validateGetSubscribedThreads.bind(this),
      this.authorizeGetSubscribedThreads.bind(this),
      (payload: { [key: string]: any }, dispatchCallback: (data: any) => void) => {
        this.getSubscribedThreads(payload.identity, dispatchCallback);
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
    if (payload.requests) {
      for (let requestIndex in payload.requests) {
        let request = payload.requests[requestIndex];
        if (request.thread && typeof request.thread === "string") {
          if (!this.validateThread(request.thread))
            return false;

          if (request.options) {
            if (!(request.options instanceof Object))
              return false;
            if (request.options.groupId && typeof request.options.groupId !== "string")
              return false;
            if (request.options.isPrivate && typeof request.options.isPrivate !== "boolean")
              return false;
          }
        }
      }
      return true;
    } else {
      let request = payload;
      if (request.thread && typeof request.thread === "string") {
        if (!this.validateThread(request.thread))
          return false;

        if (request.options) {
          if (!(request.options instanceof Object))
            return false;
          if (request.options.groupId && typeof request.options.groupId !== "string")
            return false;
          if (request.options.isPrivate && typeof request.options.isPrivate !== "boolean")
            return false;
        }

        payload.requests = [request];
        return true;
      }
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

      return true;
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

  // validateDeleteThreadedMessage(payload: { [key: string]: any }): boolean {
  //   //TODO: Does the user own the message they are trying to modify?

  //   return false;
  // }

  // authorizeDeleteThreadedMessage(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
  //   return false;
  // }

  validateGetSubscribedThreads(payload: { [key: string]: any }): boolean {
    return true;
  }

  authorizeGetSubscribedThreads(username: string, permissions: PermissionSet, payload: { [key: string]: any }): boolean {
    let canUser = (username == payload.identity) && (permissions.user[payload.requestType]);
    let canGroup = permissions.group[payload.identity] && permissions.group[payload.identity][payload.requestType];

    return canUser || canGroup;
  }

  subscribeThread(userId: string, baseThread: string, callback: ((data: { [key: string]: any }) => void), options?: { [key: string]: any }): void {
    let thread = baseThread;
    if (options && options.groupId) {
      thread = this.getGroupScopedThread(thread, options.groupId);
      this.sessionData.setHashValue(generateUserGroupThreadsKey(userId, options.groupId), baseThread, baseThread);
      this.sessionData.setHashValue(generateSubscribedUsersKey(thread), userId, userId);
    } else if (options && options.isPrivate) {
      this.sessionData.setHashValue(generateUserPrivateThreadsKey(userId), baseThread, baseThread);
    } else {
      this.sessionData.setHashValue(generateUserThreadsKey(userId), baseThread, baseThread);
      this.sessionData.setHashValue(generateSubscribedUsersKey(thread), userId, userId);
    }

    callback({
      data: true,
      thread: baseThread,
      options: options,
      requestType: "subscribeThread"
    });
  }

  unsubscribeThread(userId: string, baseThread: string, callback: ((success: boolean) => void), options?: { [key: string]: any }): void {
    let thread = baseThread;
    if (options && options.groupId) {
      thread = this.getGroupScopedThread(thread, options.groupId);
      this.sessionData.deleteHashValue(generateUserGroupThreadsKey(userId, options.groupId), baseThread, (deleted) => { });
      this.sessionData.deleteHashValue(generateSubscribedUsersKey(thread), userId, (deleted) => { callback(deleted) });
    } else if (options && options.isPrivate) {
      this.sessionData.deleteHashValue(generateUserPrivateThreadsKey(userId), baseThread, (deleted) => { callback(deleted) });
    } else {
      this.sessionData.deleteHashValue(generateUserThreadsKey(userId), baseThread, (deleted) => { });
      this.sessionData.deleteHashValue(generateSubscribedUsersKey(thread), userId, (deleted) => { callback(deleted) });
    }
  }

  private getSubscribedUsers(realThread: string, callback: ((users: string[]) => void)): void {
    this.sessionData.getHashValues(generateSubscribedUsersKey(realThread), callback);
  }

  getSubscribedThreads(userId: string, callback: (data: { [key: string]: any }) => void): void {
    let threadsObject = {
      threads: [] as string[],
      privateThreads: [] as string[],
      groupThreads: {} as { [key: string]: string[] }
    };
    this.groupManager.getUsersGroups(userId, (groupIds) => {
      let groupKeys = groupIds.map((groupId) => {
        return generateUserGroupThreadsKey(userId, groupId);
      });
      this.sessionData.getHashMultiKeys(groupKeys, (groupThreads) => {
        threadsObject.groupThreads = groupThreads;
        this.sessionData.getHashKeys(generateUserThreadsKey(userId), (threads) => {
          threadsObject.threads = threads;
          this.sessionData.getHashKeys(generateUserPrivateThreadsKey(userId), (privateThreads) => {
            threadsObject.privateThreads = privateThreads;
            callback({ data: threadsObject, requestType: "getSubscribedThreads" });
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
    this.sessionData.addTimestampValue(generateTimestampForThread(thread), date.getTime(), message.id);
    this.sessionData.setHashValue(generateThreadKey(thread), message.id, messageStr);

    if (!message.isPrivate) {
      this.getSubscribedUsers(thread, (users) => {
        for (let user of users) {
          if (user !== userId) { //Don't send the message to the sender
            this.sessionData.broadcast(generateBroadcastQueueForUserId(user), JSON.stringify(new ServiceMessage(user, {
              requestType: "newThreadedMessage",
              data: message,
              thread: message.thread,
              options: { isPrivate: message.isPrivate, groupId: message.groupId }
            })));
          } else {
            this.sessionData.addSetValue(generateUserClearedNotificationsKey(userId), message.id);
          }
        }
      });
    }
    callback(true);
  }

  getMessages(userId: string, threadRequests: { [key: string]: any }[], callback: ((data: { [key: string]: any }[]) => void)): void {
    let results: { [key: string]: any }[] = [];

    let processThreads = (threadRequests: { [key: string]: any }[]) => {
      let threadRequest = threadRequests.pop();
      if (threadRequest) {
        let baseThread = threadRequest.thread;
        let timestamp = threadRequest.timestamp;
        let options = threadRequest.options;
        let thread = baseThread;
        if (options && options.groupId)
          thread = this.getGroupScopedThread(thread, options.groupId);
        else if (options && options.isPrivate)
          thread = this.getPrivateScopedThread(thread, userId);

        this.sessionData.getValuesGreaterThanTimestamp(generateTimestampForThread(thread), timestamp, (data) => {
          this.sessionData.getHashMultiField(generateThreadKey(thread), data, (vals) => {
            results.push({
              data: vals.map((val) => {
                let obj = JSON.parse(val);
                if (Message.is(obj))
                  return new Message(obj);
                else
                  return new Voided(obj);
              }),
              thread: baseThread,
              options: options
            });
            processThreads(threadRequests);
          });
        });
      } else {
        callback(results);
      }
    };

    processThreads(threadRequests);
  }

  deleteMessage(userId: string, baseThread: string, messageId: string, callback: ((success: boolean) => void), options?: { [key: string]: any }): void {
    let thread = baseThread;
    if (options && options.groupId)
      thread = this.getGroupScopedThread(baseThread, options.groupId);
    else if (options && options.isPrivate)
      thread = this.getPrivateScopedThread(baseThread, userId)

    this.sessionData.getHashValue(generateThreadKey(thread), messageId, (data) => {
      if (data) {
        this.sessionData.queueForLrsVoid(data);
        let voided = new Message(JSON.parse(data)).toVoidRecord();
        this.sessionData.addTimestampValue(generateTimestampForThread(thread), new Date(voided.stored).getTime(), voided.id);
        this.sessionData.setHashValue(generateThreadKey(thread), voided.id, JSON.stringify(voided));
        if (!(options && options.isPrivate)) {
          this.getSubscribedUsers(thread, (users) => {
            for (let user of users) {
              this.sessionData.broadcast(generateBroadcastQueueForUserId(user), JSON.stringify(new ServiceMessage(user, {
                requestType: "newThreadedMessage",
                data: voided,
                thread: baseThread,
                options: options
              })));
            }
          });
        }
      }
      this.sessionData.deleteSortedTimestampMember(generateTimestampForThread(thread),
        messageId,
        (deleted: number) => {
          this.sessionData.deleteHashValue(generateThreadKey(thread),
            messageId,
            (result: boolean) => {
              callback(result);
            });
        });

    });
  }
}
