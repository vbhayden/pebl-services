import { MessageQueueManager } from '../interfaces/messageQueueManager';
import { SessionDataManager } from '../interfaces/sessionDataManager';
import { ServiceMessage } from '../models/serviceMessage';

import * as redis from 'redis';
import * as WebSocket from 'ws';

import RedisSMQ = require("rsmq");

export class RedisMessageQueuePlugin implements MessageQueueManager {
  // private LRSPlugin: LRS;
  private sessionCachePlugin: SessionDataManager;
  private rsmq: RedisSMQ;
  private redisClient: redis.RedisClient;
  private subscriber: redis.RedisClient;
  private sessionSocketMap: { [key: string]: WebSocket }

  constructor(redisConfig: { [key: string]: any }, sessionCachePlugin: SessionDataManager) {
    // this.LRSPlugin = LRSPlugin;
    this.rsmq = new RedisSMQ(redisConfig);
    this.redisClient = redisConfig.client;
    this.sessionCachePlugin = sessionCachePlugin;
    this.sessionSocketMap = {};
    this.subscriber = redis.createClient(redisConfig.options);
    this.subscriber.on('message', (channel: string, message: string) => {
      if (channel === 'rsmq:rt:incomingMessages') {
        this.rsmq.receiveMessage({ qname: 'incomingMessages' }, (err, resp) => {
          if ((<RedisSMQ.QueueMessage>resp).id) {
            let serviceMessage = JSON.parse((<RedisSMQ.QueueMessage>resp).message) as ServiceMessage;
            serviceMessage.messageId = (<RedisSMQ.QueueMessage>resp).id;
            this.dispatchMessage(serviceMessage);
          }
        });
      } else {
        let sessionId = channel.replace('rsmq:rt:', '');
        this.rsmq.receiveMessage({ qname: sessionId }, (err, resp) => {
          if ((<RedisSMQ.QueueMessage>resp).id) {
            let serviceMessage = JSON.parse((<RedisSMQ.QueueMessage>resp).message) as ServiceMessage;
            serviceMessage.messageId = (<RedisSMQ.QueueMessage>resp).id;
            //TODO: How to get the websocket here?
            let socket = this.sessionSocketMap[sessionId];
            if (socket && socket.readyState === 1) {
              socket.send(JSON.stringify(serviceMessage));
              this.rsmq.deleteMessage({ qname: sessionId, id: (<RedisSMQ.QueueMessage>resp).id }, function(err, resp) {
                //TODO
              });
            }
          }
        });
      }
    });
  }

  createIncomingQueue(callback: ((success: boolean) => void)): void {
    this.rsmq.createQueue({ qname: 'incomingMessages' }, (err, resp) => {
      if (err) {
        console.log(err);
        callback(false);
      } else if (resp === 1) {
        callback(true);
      }
      this.subscriber.subscribe('rsmq:rt:incomingMessages');
    });
  }

  createOutgoingQueue(sessionId: string, websocket: WebSocket, callback: ((success: boolean) => void)): void {
    this.rsmq.createQueue({ qname: sessionId }, (err, resp) => {
      if (err) {
        console.log(err);
        console.log('outgoing error');
        callback(false);
      } else if (resp === 1) {

        callback(true);
      }
      this.sessionSocketMap[sessionId] = websocket;
      this.subscriber.subscribe('rsmq:rt:' + sessionId);
    });
  }

  removeOutgoingQueue(sessionId: string): void {
    this.subscriber.unsubscribe('rsmq:rt:' + sessionId);
    this.rsmq.deleteQueue({ qname: sessionId }, (err, resp) => {
      //
    });
    delete this.sessionSocketMap[sessionId];
  }

  enqueueIncomingMessage(message: ServiceMessage, callback: ((success: boolean) => void)): void {
    this.rsmq.sendMessage({ qname: "incomingMessages", message: JSON.stringify(message) }, function(err, resp) {
      if (err) {
        console.log(err);
        return callback(false);
      }
      console.log('Message sent. ID:', resp);
      callback(true);
    });
  }

  enqueueOutgoingMessage(message: ServiceMessage, callback: ((success: boolean) => void)): void {
    this.rsmq.sendMessage({ qname: message.sessionId, message: JSON.stringify(message) }, function(err, resp) {
      if (err) {
        console.log(err);
        return callback(false);
      }
      console.log('Message sent. ID:', resp);
      callback(true);
    });
  }

  dispatchMessage(message: ServiceMessage): void {
    // TODO
    let target = this.determineDispatchTarget(message);
    if (target === 'lrs') { //TODO: use some constant
      this.dispatchToLrs(message);
    } else if (target === 'client') {
      this.dispatchToClient(message);
    } else if (target === 'cache') {
      this.dispatchToCache(message);
    } else if (target === 'database') {
      this.dispatchToDatabase(message);
    } else if (target === 'cleanup') {
      this.dispatchCleanup(message);
    }
  }

  determineDispatchTarget(message: ServiceMessage): string {
    // TODO: How do we determine this?
    //Return some constant string representing the target
    return 'cache';
  }

  dispatchToLrs(message: ServiceMessage): void {
    //TODO: standardize requestTypes
    // if (message.requestType === 'getStatements') {
    //   this.LRSPlugin.getStatements(this.constructXApiQuery(message), function(stmts) {
    //     // TODO: do something with the result
    //   });
    // } else if (message.requestType === 'storeStatements') {
    //   //TODO: get the statements out of the message
    //   let stmts = [] as XApiStatement[];
    //   this.LRSPlugin.storeStatements(stmts);
    // } else if (message.requestType === 'voidStatements') {
    //   //TODO: get the statements out of the message
    //   let stmts = [] as XApiStatement[];
    //   this.LRSPlugin.voidStatements(stmts);
    // } else if (message.requestType === 'storeActivity') {
    //   //TODO: get the activity out of the message
    //   let activity = {} as Activity;
    //   this.LRSPlugin.storeActivity(activity, function(succeeded) {
    //     //TODO: Do something if failed or succeeded
    //   });
    // } else if (message.requestType === 'getActivity') {
    //   //TODO: get the activity type out of the message
    //   let activityType = '';
    //   //TODO: get the activity id out of the message
    //   let activityId = '';

    //   this.LRSPlugin.getActivity(activityType, function(activity) {
    //     //TODO: do something with the result
    //     if (activity) {

    //     } else {

    //     }
    //   }, activityId);
    // }
  }

  dispatchToCache(message: ServiceMessage): void {
    //TODO
    for (let template of this.sessionCachePlugin.getMessageTemplates()) {
      if (message.payload.requestType === template.verb) {
        template.action(message, (data) => {
          let payload = {
            requestType: message.payload.requestType,
            data: data
          }
          this.dispatchToClient(new ServiceMessage({
            sessionId: message.sessionId,
            userProfile: message.userProfile,
            messageId: message.messageId,
            payload: payload
          }));
        });
      }
    }
  }

  dispatchToClient(message: ServiceMessage): void {
    //TODO
    this.enqueueOutgoingMessage(message, (success) => {
      if (success && message.messageId) {
        this.rsmq.deleteMessage({ qname: 'incomingMessages', id: message.messageId }, (err, resp) => {
          if (err) {
            console.log(err);
          } else {
            console.log(resp);
          }
          //TODO
        });
      }
    });
  }

  dispatchToDatabase(message: ServiceMessage): void {
    //TODO
  }

  private dispatchCleanup(message: ServiceMessage): void {
    let scanAll = (cursor: string, pattern: string, accumulator: string[], callback: ((result: string[]) => void)) => {
      this.redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', '10', function(err: Error | null, result: [string, string[]]) {
        cursor = result[0];
        accumulator.push(...result[1]);
        if (cursor !== '0') {
          scanAll(cursor, pattern, accumulator, callback);
        } else {
          callback(accumulator);
        }
      });
    }

    this.rsmq.listQueues((err, queues) => {
      if (err) {
        //TODO
      } else {
        scanAll('0', 'sess:*', [], (sessions: string[]) => {
          let filtered = queues.filter((queue: string) => {
            if (queue === 'incomingMessages')
              return false;
            return !(sessions.includes('sess:' + queue));
          });

          for (let queue of filtered) {
            this.removeOutgoingQueue(queue);
          }
        });
      }
    });
  }

  // private constructXApiQuery(message: ServiceMessage): XApiQuery {
  //   return new XApiQuery({
  //     //TODO get query data out of message
  //   });
  // }

}
