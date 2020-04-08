import { MessageQueueManager } from '../interfaces/messageQueueManager';
import { SessionDataManager } from '../interfaces/sessionDataManager';
import { ServiceMessage } from '../models/serviceMessage';
import { LRS } from '../interfaces/lrsManager';
import { XApiStatement } from '../models/xapiStatement';
import { PeblData } from '../models/peblData';

import * as redis from 'redis';
import * as WebSocket from 'ws';

import RedisSMQ = require("rsmq");
// import { MessageTemplate } from '../models/messageTemplate';
import { PluginManager } from '../interfaces/pluginManager';

export class RedisMessageQueuePlugin implements MessageQueueManager {
  private lrsManager: LRS;
  // private sessionCachePlugin: SessionDataManager;
  private rsmq: RedisSMQ;
  private redisClient: redis.RedisClient;
  private subscriber: redis.RedisClient;
  private sessionSocketMap: { [key: string]: WebSocket }
  private pluginManager: PluginManager;
  private timeouts: { [key: string]: NodeJS.Timeout }
  private sessionDataManager: SessionDataManager;

  constructor(redisConfig: { [key: string]: any }, pluginManager: PluginManager, sessionDataManager: SessionDataManager, lrsManager: LRS) {
    this.lrsManager = lrsManager;
    this.rsmq = new RedisSMQ(redisConfig);
    this.redisClient = redisConfig.client;
    this.sessionDataManager = sessionDataManager;
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

  initialize(): void {
    this.createIncomingQueue((success) => { });
    this.createJobsQueue((success) => {
      if (success) {
        setTimeout(() => {
          this.enqueueJobsMessage(new ServiceMessage({ messageTimeout: 3600000, payload: { requestType: "cleanup" } }), (success) => {
            console.log("queued job");
          });
        }, 3600000);
        setTimeout(() => {
          this.enqueueJobsMessage(new ServiceMessage({ messageTimeout: 5000, payload: { requestType: "lrsSync" } }), (success) => {
            console.log("queued LRS sync");
          });
        }, 5000)
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
    } else if (target === 'lrsSync') {
      this.dispatchToLrs(message);
    }
  }

  determineDispatchTarget(message: ServiceMessage): string {
    // TODO: How do we determine this?
    //Return some constant string representing the target
    if (message.payload.requestType === 'cleanup')
      return 'cleanup';
    else if (message.payload.requestType === 'lrsSync')
      return 'lrsSync';
    else
      return 'cache';
  }

  dispatchToLrs(message: ServiceMessage): void {
    console.log('dispatch to LRS');

    this.sessionDataManager.retrieveForLrs(500, (values) => {
      if (values) {
        //TODO: translate pebl data to xapi statements
        let statements = values.map((value) => {
          let peblData = new PeblData(JSON.parse(value));
          return XApiStatement.peblToXapi(peblData);
        });
        this.lrsManager.storeStatements(statements);
      }
      setTimeout(() => {
        this.retryJob(message);
      }, message.messageTimeout);
    });
  }

  dispatchToCache(message: ServiceMessage): void {
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
  }

  dispatchToClient(message: ServiceMessage): void {
    this.enqueueOutgoingMessage(message, (success) => {
      if (success && message.messageId) {
        this.rsmq.deleteMessage({ qname: 'incomingMessages', id: message.messageId }, (err, resp) => {
          if (err) {
            console.log(err);
          } else {
            console.log(resp);
          }
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
            this.retryJob(message);
          }, message.messageTimeout);

        });
      }
    });
  }

  private retryJob(message: ServiceMessage): void {
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
  }

  private runFailedJobs(jobMessage: { [key: string]: any }) {
    this.rsmq.receiveMessage({ qname: 'jobs' }, (err, resp) => {
      if ((<RedisSMQ.QueueMessage>resp).id) {
        let serviceMessage = JSON.parse((<RedisSMQ.QueueMessage>resp).message) as ServiceMessage;
        this.retryJob(serviceMessage);
      }
    });
  }

  // private constructXApiQuery(message: ServiceMessage): XApiQuery {
  //   return new XApiQuery({
  //     //TODO get query data out of message
  //   });
  // }

}
