import { MessageQueue, SessionDataCache } from '../adapters';
import { ServiceMessage } from '../models';

import RedisSMQ = require("rsmq");

export class RedisMessageQueuePlugin implements MessageQueue {
  // private LRSPlugin: LRS;
  private SessionCachePlugin: SessionDataCache;
  private rsmq: RedisSMQ;
  private redisConfig: { [key: string]: any };

  constructor(redisConfig: { [key: string]: any }, sessionCachePlugin: SessionDataCache) {
    // this.LRSPlugin = LRSPlugin;
    this.rsmq = new RedisSMQ(redisConfig);
    this.redisConfig = redisConfig;
    this.SessionCachePlugin = sessionCachePlugin
  }

  createIncomingQueue(callback: ((success: boolean) => void)): void {
    this.rsmq.createQueue({ qname: 'incomingMessages' }, (err, resp) => {
      if (err) {
        console.log(err);
        return callback(false);
      } else if (resp === 1) {
        const subscriber = this.redisConfig.client;
        subscriber.subscribe('rsmq:rt:incomingMessages');
        subscriber.on('message', (message: string) => {
          this.rsmq.receiveMessage({ qname: 'incomingMessages' }, (err, resp) => {
            if ((<RedisSMQ.QueueMessage>resp).id) {
              let serviceMessage = JSON.parse((<RedisSMQ.QueueMessage>resp).message) as ServiceMessage;
              serviceMessage.messageId = (<RedisSMQ.QueueMessage>resp).id;

              this.dispatchMessage(serviceMessage);
              // this.enqueueOutgoingMessage(JSON.parse((<RedisSMQ.QueueMessage>resp).message) as any, function(success: boolean) {
              //   //TODO
              //   if (success) {
              //     this.rsmq.deleteMessage({ qname: 'incomingMessages', id: (<RedisSMQ.QueueMessage>resp).id }, function(err, resp) {
              //       //TODO
              //     });
              //   }
              // });
            }
          });
        })
        callback(true);
      }
    });
  }

  createOutgoingQueue(sessionId: string, callback: ((success: boolean) => void)): void {
    this.rsmq.createQueue({ qname: sessionId }, (err, resp) => {
      if (err) {
        console.log(err);
        return callback(false);
      } else if (resp === 1) {
        const subscriber = this.redisConfig.client;
        subscriber.subscribe('rsmq:rt:' + sessionId);
        subscriber.on('message', (message: string) => {
          this.rsmq.receiveMessage({ qname: sessionId }, (err, resp) => {
            if ((<RedisSMQ.QueueMessage>resp).id) {
              //TODO: Send the message back down the websocket to the client
              this.rsmq.deleteMessage({ qname: sessionId, id: (<RedisSMQ.QueueMessage>resp).id }, function(err, resp) {
                //TODO
              });
            }
          });
        });
        callback(true);
      }
    });
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
    if (message.payload.requestType === 'getAnnotations') {
      this.SessionCachePlugin.getAnnotations(message.userProfile, (annotations) => {
        let payload = {
          requestType: message.payload.requestType,
          data: annotations
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


  // private constructXApiQuery(message: ServiceMessage): XApiQuery {
  //   return new XApiQuery({
  //     //TODO get query data out of message
  //   });
  // }

}
