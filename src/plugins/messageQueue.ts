import { MessageQueueManager } from '../interfaces/messageQueueManager';
// import { SessionDataManager } from '../interfaces/sessionDataManager';
import { ServiceMessage } from '../models/serviceMessage';

import * as redis from 'redis';
import * as WebSocket from 'ws';

import RedisSMQ = require("rsmq");
// import { MessageTemplate } from '../models/messageTemplate';
import { PluginManager } from '../interfaces/pluginManager';

export class RedisMessageQueuePlugin implements MessageQueueManager {
  // private LRSPlugin: LRS;
  // private sessionCachePlugin: SessionDataManager;
  private rsmq: RedisSMQ;
  private redisClient: redis.RedisClient;
  private subscriber: redis.RedisClient;
  private sessionSocketMap: { [key: string]: WebSocket }
  private pluginManager: PluginManager;
  private timeouts: { [key: string]: NodeJS.Timeout }

  constructor(redisConfig: { [key: string]: any }, pluginManager: PluginManager) {
    // this.LRSPlugin = LRSPlugin;
    this.rsmq = new RedisSMQ(redisConfig);
    this.redisClient = redisConfig.client;
    // this.sessionCachePlugin = sessionCachePlugin;
    this.sessionSocketMap = {};
    this.timeouts = {};
    this.pluginManager = pluginManager;
    this.subscriber = redis.createClient(redisConfig.options);
    this.subscriber.subscribe('activeJobs');
    this.subscriber.on('message', (channel: string, message: string) => {
      if (channel === 'rsmq:rt:incomingMessages') {
        this.rsmq.receiveMessage({ qname: 'incomingMessages' }, (err, resp) => {
          if ((<RedisSMQ.QueueMessage>resp).id) {
            let serviceMessage = JSON.parse((<RedisSMQ.QueueMessage>resp).message) as ServiceMessage;
            serviceMessage.messageId = (<RedisSMQ.QueueMessage>resp).id;
            this.dispatchMessage(serviceMessage);
          }
        });
      } else if (channel === 'rsmq:rt:jobs') {
        this.rsmq.receiveMessage({ qname: 'jobs' }, (err, resp) => {
          if ((<RedisSMQ.QueueMessage>resp).id) {
            let serviceMessage = JSON.parse((<RedisSMQ.QueueMessage>resp).message) as ServiceMessage;
            serviceMessage.messageId = (<RedisSMQ.QueueMessage>resp).id;
            this.dispatchMessage(serviceMessage);

            let jobStartedMessage = {
              type: 'jobStarted',
              id: serviceMessage.messageId,
              timeout: serviceMessage.messageTimeout
            }
            this.redisClient.publish('activeJobs', JSON.stringify(jobStartedMessage));
            console.log('job started');
          }
        });
      } else if (channel === 'activeJobs') {
        //When a job is started, all nodes receive a jobStarted message indicating which job was started and how long it should take for it to run
        //They set a timeout to check for failed jobs in the case they do not recieve the paired jobFinished message within the alloted timeout
        //When a jobFinished event arrives, the nodes remove their timeouts for that job
        let jobMessage = JSON.parse(message);
        if (jobMessage.type === 'jobStarted') {
          this.timeouts[jobMessage.id] = setTimeout(() => {
            this.runFailedJobs(jobMessage);
          }, jobMessage.timeout + 30000);
        } else if (jobMessage.type === 'jobFinished') {
          clearTimeout(this.timeouts[jobMessage.id]);
        }
      } else {
        let sessionId = channel.replace('rsmq:rt:', '');
        this.rsmq.receiveMessage({ qname: sessionId }, (err, resp) => {
          if ((<RedisSMQ.QueueMessage>resp).id) {
            let serviceMessage = JSON.parse((<RedisSMQ.QueueMessage>resp).message) as ServiceMessage;
            serviceMessage.messageId = (<RedisSMQ.QueueMessage>resp).id;

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
        callback(false);
      } else if (resp === 1) {

        callback(true);
      }
      this.sessionSocketMap[sessionId] = websocket;
      this.subscriber.subscribe('rsmq:rt:' + sessionId);
    });
  }

  createJobsQueue(callback: ((success: boolean) => void)): void {
    this.rsmq.createQueue({ qname: 'jobs' }, (err, resp) => {
      if (err) {
        console.log(err);
        callback(false);
      } else if (resp === 1) {
        callback(true);
      }
      this.subscriber.subscribe('rsmq:rt:jobs');
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
      callback(true);
    });
  }

  enqueueOutgoingMessage(message: ServiceMessage, callback: ((success: boolean) => void)): void {
    if (message.sessionId) {
      this.rsmq.sendMessage({ qname: message.sessionId, message: JSON.stringify(message) }, function(err, resp) {
        if (err) {
          console.log(err);
          return callback(false);
        }
        callback(true);
      });
    } else {
      callback(false);
    }
  }

  enqueueJobsMessage(message: ServiceMessage, callback: ((success: boolean) => void)): void {
    this.rsmq.sendMessage({ qname: 'jobs', message: JSON.stringify(message) }, function(err, resp) {
      if (err) {
        console.log(err);
        return callback(false);
      }
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
    if (message.payload.requestType === 'cleanup')
      return 'cleanup';
    else
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
    // for (let template of this.sessionCachePlugin.getMessageTemplates()) {
    //   if (message.payload.requestType === template.verb) {

    let messageTemplate = this.pluginManager.getMessageTemplate(message.payload.requestType);

    if (messageTemplate) {
      messageTemplate.action(message, (data) => {
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
    } else {
      console.log("bad message template");
    }
    //   }
    // }
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
            if (queue === 'incomingMessages' || queue === 'jobs')
              return false;
            return !(sessions.includes('sess:' + queue));
          });

          for (let queue of filtered) {
            this.removeOutgoingQueue(queue);
          }

          //Re-add the message in specified timeout period
          setTimeout(() => {
            this.enqueueJobsMessage(new ServiceMessage({ messageTimeout: message.messageTimeout, payload: message.payload }), (success) => {
              if (success && message.messageId) {
                //Delete the old message
                this.rsmq.deleteMessage({ qname: 'jobs', id: message.messageId }, (err, resp) => {
                  if (err) {
                    console.log(err);
                  } else {
                    let jobFinishedMessage = {
                      type: 'jobFinished',
                      id: message.messageId,
                      timeout: message.messageTimeout
                    }
                    this.redisClient.publish('activeJobs', JSON.stringify(jobFinishedMessage));
                    console.log('job finished');
                  }
                });
              }
            });
          }, message.messageTimeout);

        });
      }
    });
  }

  private runFailedJobs(jobMessage: { [key: string]: any }) {
    this.rsmq.receiveMessage({ qname: 'jobs' }, (err, resp) => {
      if ((<RedisSMQ.QueueMessage>resp).id) {
        let serviceMessage = JSON.parse((<RedisSMQ.QueueMessage>resp).message) as ServiceMessage;
        this.enqueueJobsMessage(new ServiceMessage({ messageTimeout: serviceMessage.messageTimeout, payload: serviceMessage.payload }), (success) => {
          if (success && serviceMessage.messageId) {
            //Delete the old message
            this.rsmq.deleteMessage({ qname: 'jobs', id: serviceMessage.messageId }, (err, resp) => {
              if (err) {
                console.log(err);
              } else {
                let jobFinishedMessage = {
                  type: 'jobFinished',
                  id: serviceMessage.messageId,
                  timeout: serviceMessage.messageTimeout
                }
                this.redisClient.publish('activeJobs', JSON.stringify(jobFinishedMessage));
              }
            });
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
