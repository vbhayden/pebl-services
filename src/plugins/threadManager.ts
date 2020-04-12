import { PeBLPlugin } from "../models/peblPlugin";
import { ThreadManager } from "../interfaces/threadManager";
import { SessionDataManager } from "../interfaces/sessionDataManager";
import { Message } from "../models/message";
import { ServiceMessage } from "../models/serviceMessage";
import { MessageTemplate } from "../models/messageTemplate";

export class DefaultThreadManager extends PeBLPlugin implements ThreadManager {
  private sessionData: SessionDataManager;

  constructor(sessionData: SessionDataManager) {
    super();
    this.sessionData = sessionData;

    this.addMessageTemplate(new MessageTemplate("storeThreadedMessage",
      this.validateThreadWritePermission,
      (payload: { [key: string]: any }) => {
        this.storeMessage(payload.message, payload.callback);
      }));

    this.addMessageTemplate(new MessageTemplate("getThreadedMessages",
      this.validateThreadReadPermission,
      (payload: { [key: string]: any }) => {
        this.getMessages(payload.thread, payload.callback, payload.groupId);
      }));

    this.addMessageTemplate(new MessageTemplate("subscribeThread",
      this.validateThreadReadPermission,
      (payload: { [key: string]: any }) => {
        this.subscribeThread(payload.identity, payload.thread, payload.callback, payload.groupId);
      }));

    this.addMessageTemplate(new MessageTemplate("unsubscribeThread",
      this.validateThreadReadPermission,
      (payload: { [key: string]: any }) => {
        this.unsubscribeThread(payload.identity, payload.thread, payload.callback, payload.groupId);
      }));

    this.addMessageTemplate(new MessageTemplate("deleteThreadedMessage",
      this.validateMessageOwnership,
      (payload: { [key: string]: any }) => {
        this.deleteMessage(payload.thread, payload.messageId, payload.callback, payload.groupId);
      }));
  }

  private validateThread(thread: string): boolean {
    //Validates the base thread to make sure its not pretending to be a group thread
    if (thread.includes('_group-'))
      return false;
    else
      return true;
  }

  validateThreadReadPermission(payload: { [key: string]: any }): boolean {
    //TODO: Does the user have permission to read messages on this thread. If a group message, is the user in that group?
    if (!this.validateThread(payload.thread))
      return false;

    if (payload.groupId) {
      //TODO
      return false;
    }

    return false;
  }

  validateThreadWritePermission(payload: { [key: string]: any }): boolean {
    //TODO: Does the user have permission to post to this thread. If a group message, is the user in that group?
    if (!this.validateThread(payload.message.thread))
      return false;

    if (payload.message.groupId) {
      //TODO
      return false;
    }

    return false;
  }

  validateMessageOwnership(payload: { [key: string]: any }): boolean {
    //TODO: Does the user own the message they are trying to modify?

    return false;
  }

  subscribeThread(userId: string, thread: string, callback: ((success: boolean) => void), groupId?: string): void {
    if (groupId)
      thread = this.getGroupScopedThread(thread, groupId);
    this.sessionData.setHashValues('users:thread', [thread, userId]);
    callback(true);
  }

  unsubscribeThread(userId: string, thread: string, callback: ((success: boolean) => void), groupId?: string): void {
    if (groupId)
      thread = this.getGroupScopedThread(thread, groupId);
    this.sessionData.deleteHashValue('users:thread', thread, (deleted) => { callback(deleted) });
  }

  private getSubscribedUsers(realThread: string, callback: ((users: string[]) => void)): void {
    this.sessionData.getHashValues('users:thread', callback);
  }

  getGroupScopedThread(thread: string, groupId: string): string {
    return thread + '_group-' + groupId;
  }

  storeMessage(message: Message, callback: ((success: boolean) => void)): void {
    console.log(message);
    let thread = message.thread;
    if (message.groupId)
      thread = this.getGroupScopedThread(thread, message.groupId);

    this.sessionData.setHashValues('threads:' + thread, [message.id, JSON.stringify(message)]);
    this.getSubscribedUsers(thread, (users) => {
      for (let user of users) {
        if (user !== message.name) //Don't send the message to the sender
          this.sessionData.broadcast('realtime:userid:' + user, JSON.stringify(new ServiceMessage({
            identity: user,
            payload: {
              requestType: "newMessage",
              data: message
            }
          })));
      }
    });
    callback(true);
  }

  getMessages(thread: string, callback: ((messages: Message[]) => void), groupId?: string): void {
    if (groupId)
      thread = this.getGroupScopedThread(thread, groupId);
    this.sessionData.getHashValues('threads:' + thread, (vals) => {
      callback(vals.map((val) => {
        return new Message(JSON.parse(val));
      }));
    });
  }

  deleteMessage(thread: string, messageId: string, callback: ((success: boolean) => void), groupId?: string): void {
    if (groupId)
      thread = this.getGroupScopedThread(thread, groupId);
    this.sessionData.deleteHashValue('threads:' + thread, messageId, (deleted) => { callback(deleted) });
  }
}