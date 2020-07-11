import { MessageQueueManager } from '../interfaces/messageQueueManager';
import { SessionDataManager } from '../interfaces/sessionDataManager';
import { ServiceMessage } from '../models/serviceMessage';
import { LRS } from '../interfaces/lrsManager';

import { generateOutgoingQueueForId, MESSAGE_QUEUE_INCOMING_MESSAGES, QUEUE_CLEANUP_TIMEOUT, LRS_SYNC_TIMEOUT, LRS_SYNC_LIMIT, JOB_BUFFER_TIMEOUT, QUEUE_REALTIME_BROADCAST_PREFIX, generateBroadcastQueueForUserId, QUEUE_OUTGOING_MESSAGE_PREFIX, QUEUE_INCOMING_MESSAGE, QUEUE_ACTIVE_JOBS, SET_ALL_ACTIVE_JOBS, SET_ALL_JOBS, QUEUE_ALL_USERS, LogCategory, Severity, ARCHIVE_USER_TIMEOUT } from '../utils/constants';

import * as redis from 'redis';
import * as WebSocket from 'ws';

import RedisSMQ = require("rsmq");
import { PluginManager } from '../interfaces/pluginManager';
import { JobMessage } from '../models/job';
import { auditLogger } from '../main';
import { ArchiveManager } from '../interfaces/archiveManager';

export class RedisMessageQueuePlugin implements MessageQueueManager {
  private lrsManager: LRS;
  private rsmq: RedisSMQ;
  private redisClient: redis.RedisClient;
  private subscriber: redis.RedisClient;
  private sessionSocketMap: { [key: string]: WebSocket }
  private useridSocketMap: { [key: string]: WebSocket }
  private pluginManager: PluginManager;
  private timeouts: { [key: string]: NodeJS.Timeout }
  private sessionDataManager: SessionDataManager;
  private archiveManager: ArchiveManager;

  constructor(redisConfig: { [key: string]: any },
    pluginManager: PluginManager,
    sessionDataManager: SessionDataManager,
    lrsManager: LRS,
    archiveManager: ArchiveManager) {

    this.archiveManager = archiveManager;
    this.lrsManager = lrsManager;
    this.rsmq = new RedisSMQ(redisConfig);
    this.redisClient = redisConfig.client;
    this.sessionDataManager = sessionDataManager;
    this.sessionSocketMap = {};
    this.useridSocketMap = {};
    this.timeouts = {};
    this.pluginManager = pluginManager;
    this.subscriber = redis.createClient(redisConfig.options);
    this.subscriber.subscribe(QUEUE_ACTIVE_JOBS);
    this.subscriber.subscribe(QUEUE_ALL_USERS);
    this.subscriber.on('message', (channel: string, message: string) => {
      if (channel === QUEUE_INCOMING_MESSAGE) {
        this.receiveIncomingMessages();
      } else if (channel === QUEUE_ACTIVE_JOBS) {
        this.processActiveJob(message);
      } else if (channel.startsWith(QUEUE_REALTIME_BROADCAST_PREFIX)) {
        let userid = channel.substr(QUEUE_REALTIME_BROADCAST_PREFIX.length);
        let socket = this.useridSocketMap[userid];
        if (socket && socket.readyState === 1) {
          socket.send(JSON.stringify(ServiceMessage.parse(message).payload));
        }
      } else if (channel === QUEUE_ALL_USERS) {
        let serviceMessage = ServiceMessage.parse(message);
        let payload = JSON.stringify(serviceMessage.payload);
        for (let socket in this.sessionSocketMap) {
          this.sessionSocketMap[socket].send(payload);
        }
      } else {
        let sessionId = channel.substr(QUEUE_OUTGOING_MESSAGE_PREFIX.length);
        let socket = this.sessionSocketMap[sessionId];
        if (socket && socket.readyState === 1) {
          this.receiveOutgoingMessages(sessionId, socket);
        }
      }
    });
  }

  private processJob(message: string | JobMessage, startup?: boolean): void {
    let jobMessage: JobMessage;
    if (message instanceof JobMessage) {
      jobMessage = message;
    } else {
      jobMessage = JobMessage.parse(message);
    }

    jobMessage.startTime = Date.now();

    this.sessionDataManager.setHashValueIfNotExisting(SET_ALL_ACTIVE_JOBS,
      jobMessage.jobType,
      JSON.stringify(jobMessage),
      (didSet: boolean) => {
        if (didSet) {
          auditLogger.report(LogCategory.SYSTEM, Severity.INFO, 'JobStarted', jobMessage);
          this.dispatchJobMessage(jobMessage);
          this.redisClient.publish(QUEUE_ACTIVE_JOBS, JSON.stringify(jobMessage));
        } else {
          auditLogger.report(LogCategory.SYSTEM, Severity.INFO, 'JobAlreadyStarted', jobMessage);
          if (startup) {
            this.sessionDataManager.getHashValue(SET_ALL_ACTIVE_JOBS,
              jobMessage.jobType,
              (data?: string) => {
                if (data) {
                  this.processActiveJob(JobMessage.parse(data));
                } else {
                  this.processJob(jobMessage);
                }
              });
          }
        }
      });
  }

  //When a job is started, all nodes receive a jobStarted message indicating which job was started and how long it should take for it to run
  //They set a timeout to check for failed jobs in the case they do not recieve the paired jobFinished message within the alloted timeout
  //When a jobFinished event arrives, the nodes remove their timeouts for that job
  private processActiveJob(message: string | JobMessage): void {
    let jobMessage: JobMessage;
    if (message instanceof JobMessage) {
      jobMessage = message;
    } else {
      jobMessage = JobMessage.parse(message);
    }

    if (jobMessage.finished) {
      clearTimeout(this.timeouts[jobMessage.jobType]);
      this.timeouts[jobMessage.jobType] = setTimeout(() => {
        this.processJob(new JobMessage(jobMessage.jobType, jobMessage.timeout));
      }, jobMessage.timeout);

    } else if (jobMessage.startTime) {
      let remainingTime = jobMessage.timeout + JOB_BUFFER_TIMEOUT;
      remainingTime -= (Date.now() - jobMessage.startTime);

      if (remainingTime > 0) {
        this.timeouts[jobMessage.jobType] = setTimeout(() => {
          this.sessionDataManager.deleteHashValue(SET_ALL_ACTIVE_JOBS,
            jobMessage.jobType,
            (deleted: boolean) => {
              this.processJob(new JobMessage(jobMessage.jobType, jobMessage.timeout));
            });
        }, remainingTime);
      } else {
        this.sessionDataManager.deleteHashValue(SET_ALL_ACTIVE_JOBS, jobMessage.jobType, (deleted: boolean) => {
          this.processJob(new JobMessage(jobMessage.jobType, jobMessage.timeout));
        });
      }
    }
  }

  private isQueueMessage(msg: RedisSMQ.QueueMessage | {}): msg is RedisSMQ.QueueMessage {
    return (msg as RedisSMQ.QueueMessage).id !== undefined;
  }

  initialize(): void {
    this.createIncomingQueue((success) => {
      this.sessionDataManager.deleteValue(SET_ALL_JOBS, () => {
        let jobSet = [
          new JobMessage("cleanup", QUEUE_CLEANUP_TIMEOUT),
          new JobMessage("lrsSync", LRS_SYNC_TIMEOUT),
          new JobMessage("archiveUsers", ARCHIVE_USER_TIMEOUT)
        ];

        let walkJobs = (jobs: JobMessage[]) => {
          let job = jobs.pop();
          if (job) {
            this.sessionDataManager.addSetValue(SET_ALL_JOBS, JSON.stringify(job),
              (added: number) => {
                walkJobs(jobs);
              });
          } else {
            this.sessionDataManager.getSetValues(SET_ALL_JOBS,
              (jobs: string[]) => {
                auditLogger.report(LogCategory.SYSTEM, Severity.INFO, "AvailableJobs", jobs);
                jobs.map((job) => this.processJob(JobMessage.parse(job), true));
              });
          }
        }
        walkJobs(jobSet);
      });
    });
  }

  createIncomingQueue(callback: ((success: boolean) => void)): void {
    this.rsmq.createQueue({ qname: MESSAGE_QUEUE_INCOMING_MESSAGES, maxsize: -1 }, (err, resp) => {
      if (err) {
        auditLogger.report(LogCategory.SYSTEM, Severity.ERROR, "CreateInQueueFail", err);
        callback(false);
      } else if (resp === 1) {
        auditLogger.report(LogCategory.SYSTEM, Severity.INFO, "CreateInQueue", err);
        callback(true);
      }
      this.subscriber.subscribe(QUEUE_INCOMING_MESSAGE);
    });
  }

  createOutgoingQueue(sessionId: string, websocket: WebSocket, callback: ((success: boolean) => void)): void {
    this.rsmq.createQueue({ qname: sessionId, maxsize: -1 }, (err, resp) => {
      if (err) {
        auditLogger.report(LogCategory.SYSTEM, Severity.ERROR, "CreateOutQueueFail", sessionId, err);
        callback(false);
      } else if (resp === 1) {
        auditLogger.report(LogCategory.SYSTEM, Severity.INFO, "CreateOutQueue", sessionId, err);
        callback(true);
      }
      this.sessionSocketMap[sessionId] = websocket;
      this.subscriber.subscribe(generateOutgoingQueueForId(sessionId));
    });
  }

  subscribeNotifications(userid: string, sessionId: string, websocket: WebSocket, callback: ((success: boolean) => void)): void {
    this.useridSocketMap[userid] = websocket;
    this.subscriber.subscribe(generateBroadcastQueueForUserId(userid));
    callback(true);
  }

  removeOutgoingQueue(sessionId: string): void {
    this.subscriber.unsubscribe(generateOutgoingQueueForId(sessionId));
    this.rsmq.deleteQueue({ qname: sessionId }, (err, resp) => {
      //
    });
    delete this.sessionSocketMap[sessionId];
  }

  unsubscribeNotifications(userid: string): void {
    this.subscriber.unsubscribe(generateBroadcastQueueForUserId(userid));
    delete this.useridSocketMap[userid];
  }

  enqueueIncomingMessage(message: ServiceMessage, callback: ((success: boolean) => void)): void {
    this.rsmq.sendMessage({ qname: MESSAGE_QUEUE_INCOMING_MESSAGES, message: JSON.stringify(message) }, function(err, resp) {
      if (err) {
        auditLogger.report(LogCategory.SYSTEM, Severity.CRITICAL, "AddInMsgFail", err, message.sessionId);
        return callback(false);
      }
      callback(true);
    });
  }

  enqueueOutgoingMessage(message: ServiceMessage, callback: ((success: boolean) => void)): void {
    if (message.sessionId) {
      this.rsmq.sendMessage({ qname: message.sessionId, message: JSON.stringify(message) }, function(err, resp) {
        if (err) {
          auditLogger.report(LogCategory.SYSTEM, Severity.CRITICAL, "AddOutMsgFail", err, message.sessionId, message.messageId, message.getRequestType());
          callback(false);
        } else {
          callback(true);
        }
      });
    } else {
      callback(false);
    }
  }

  dispatchJobMessage(message: JobMessage): void {
    auditLogger.report(LogCategory.SYSTEM, Severity.INFO, 'JobDispatch', message);
    if (message.jobType === 'cleanup') {
      this.dispatchCleanup(message);
    } else if (message.jobType === 'lrsSync') {
      this.dispatchToLrs(message);
    } else {
      auditLogger.report(LogCategory.SYSTEM, Severity.CRITICAL, "UnknownJobTarget", message);
    }
  }

  private clearActiveJob(message: JobMessage): void {
    this.sessionDataManager.deleteHashValue(SET_ALL_ACTIVE_JOBS,
      message.jobType,
      () => {
        message.finished = true;
        auditLogger.report(LogCategory.SYSTEM, Severity.INFO, "JobFinished", message);
        this.redisClient.publish(QUEUE_ACTIVE_JOBS, JSON.stringify(message));
      });
  }

  dispatchToLrs(message: JobMessage): void {
    this.sessionDataManager.retrieveForLrs(LRS_SYNC_LIMIT, (values) => {
      if (values) {
        let vals = this.lrsManager.parseStatements(values);
        if (vals[0].length > 0) {
          this.lrsManager.storeStatements(vals[0], () => {
            this.sessionDataManager.trimForLrs(LRS_SYNC_LIMIT);
            auditLogger.report(LogCategory.SYSTEM, Severity.INFO, 'JobSuccess', message);
            this.clearActiveJob(message);
          }, (e) => {
            auditLogger.report(LogCategory.SYSTEM, Severity.ERROR, 'LRSPostFailed', e);
            if (!(e instanceof Error)) {
              let errJson;
              try {
                errJson = JSON.parse(e.message);
                if (errJson.message) {
                  let chunks = errJson.message.split(" ");
                  for (let chunk of chunks) {
                    if (chunk.length >= 36) {
                      let stmt = vals[3][chunk]
                      if (stmt) {
                        auditLogger.report(LogCategory.SYSTEM, Severity.NOTICE, "LRSDelStmt", stmt);
                        this.sessionDataManager.removeBadLRSStatement(stmt);
                      }
                    }
                  }
                } else if (errJson.warnings) {
                  for (let warning of errJson.warnings) {
                    let chunks = warning.split(" ");
                    let found = false
                    for (let chunk of chunks) {
                      if (chunk.length >= 36) {
                        if (chunk.startsWith("\'\"") && chunk.endsWith("\"\'")) {
                          let slimChunk = chunk.substring(2, chunk.length - 2);
                          let stmt = vals[3][slimChunk];
                          if (stmt) {
                            found = true;
                            // auditLogger.report(LogCategory.SYSTEM, Severity.NOTICE, "", stmt);
                            // this.sessionDataManager.removeBadLRSStatement(stmt);
                          }
                        }
                      }
                    }
                    if (!found) {
                      auditLogger.report(LogCategory.SYSTEM, Severity.NOTICE, "LRSUnknownWarningMsg", warning);
                    }
                  }
                } else {
                  auditLogger.report(LogCategory.SYSTEM, Severity.ERROR, "LRSUnknownError", e);
                }
              } catch (e) {
                auditLogger.report(LogCategory.SYSTEM, Severity.CRITICAL, "LRSBadJsonParse", e);
              }
            }
            this.clearActiveJob(message);
          });
        } else {
          this.clearActiveJob(message);
        }
        if (vals[1].length > 0)
          for (let activity of vals[1])
            this.lrsManager.storeActivity(activity, (success) => { });
        if (vals[2].length > 0)
          for (let profile of vals[2])
            this.lrsManager.storeProfile(profile, (success) => { });
      } else {
        this.clearActiveJob(message);
      }
    });
  }

  dispatchToCache(message: ServiceMessage): void {
    let dispatchCallback = (data: any) => {
      let o;
      if ((data != null) && (typeof (data) === "object") && (data.length === undefined)) {
        if (!data["requestType"]) {
          data["requestType"] = message.getRequestType();
        }
        o = data;
      } else {
        o = {
          requestType: message.getRequestType(),
          data: data
        }
      }
      let sm = new ServiceMessage(message.identity,
        o,
        message.sessionId,
        message.messageId);
      this.dispatchToClient(sm);
    }
    let messageTemplate = this.pluginManager.getMessageTemplate(message.getRequestType());
    if (messageTemplate) {
      messageTemplate.action(message.payload, dispatchCallback);
    } else {
      auditLogger.report(LogCategory.SYSTEM, Severity.CRITICAL, "CacheBadMsgTemplate", message);
    }
  }

  dispatchToClient(message: ServiceMessage): void {
    this.enqueueOutgoingMessage(message, (success) => {
      if (message.messageId) {
        if (!success) {
          auditLogger.report(LogCategory.SYSTEM, Severity.ERROR, "DroppingOutgoingMsg", message.messageId, message.sessionId, message.getRequestType());
        }
        this.rsmq.deleteMessage({ qname: MESSAGE_QUEUE_INCOMING_MESSAGES, id: message.messageId }, (err, resp) => {
          if (err) {
            auditLogger.report(LogCategory.SYSTEM, Severity.ERROR, "DelMsgInQueueFail", err);
          }
        });
      }
    });
  }

  receiveIncomingMessages(): void {
    this.rsmq.receiveMessage({ qname: MESSAGE_QUEUE_INCOMING_MESSAGES }, (err, resp: RedisSMQ.QueueMessage | {}) => {
      if (this.isQueueMessage(resp)) {
        let serviceMessage = ServiceMessage.parse(resp.message);
        serviceMessage.messageId = resp.id;
        this.dispatchToCache(serviceMessage);
        //Call function again until no messages are received
        this.receiveIncomingMessages();
      }
    });
  }

  receiveOutgoingMessages(sessionId: string, socket: WebSocket) {
    this.rsmq.receiveMessage({ qname: sessionId }, (err, resp) => {
      if (this.isQueueMessage(resp)) {
        if (socket.readyState === 1) {
          socket.send(JSON.stringify(ServiceMessage.parse(resp.message).payload));
        }
        this.rsmq.deleteMessage({ qname: sessionId, id: resp.id }, function(err, resp) {
          //TODO
        });

        //Call function again until no messages are received
        this.receiveOutgoingMessages(sessionId, socket);
      }
    });
  }

  // private archiveUserId(userId: string): void {
  //   this.archiveManager.setUserArchived(userId, true);
  // }

  // private restoreUserId(userId: string): void {
  //   this.archiveManager.setUserArchived(userId, false);
  // }

  archiveUsers(): void {
    this.archiveManager.isUserArchived("s", () => { });
    // let scanAll = (cursor: string, pattern: string, accumulator: string[], callback: ((result: string[]) => void)) => {
    //   this.redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', '10', function(err: Error | null, result: [string, string[]]) {
    //     cursor = result[0];
    //     accumulator.push(...result[1]);
    //     if (cursor !== '0') {
    //       scanAll(cursor, pattern, accumulator, callback);
    //     } else {
    //       callback(accumulator);
    //     }
    //   });
    // }

    // scanAll('0',
    //   'sess:*',
    //   [],
    //   (sessions: string[]) => {
    //     let filtered = queues.filter((queue: string) => {
    //       if (queue === MESSAGE_QUEUE_INCOMING_MESSAGES)
    //         return false;
    //       return !(sessions.includes('sess:' + queue));
    //     });

    //     for (let queue of filtered) {
    //       this.removeOutgoingQueue(queue);
    //     }

    //     this.clearActiveJob(message);
    //   });
  }

  private dispatchCleanup(message: JobMessage): void {
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
        auditLogger.report(LogCategory.SYSTEM, Severity.CRITICAL, "SessionCleanupFail", message);
        this.clearActiveJob(message);
      } else {
        scanAll('0', 'sess:*', [], (sessions: string[]) => {
          let filtered = queues.filter((queue: string) => {
            if (queue === MESSAGE_QUEUE_INCOMING_MESSAGES)
              return false;
            return !(sessions.includes('sess:' + queue));
          });

          for (let queue of filtered) {
            this.removeOutgoingQueue(queue);
          }

          this.clearActiveJob(message);
        });
      }
    });
  }
}
