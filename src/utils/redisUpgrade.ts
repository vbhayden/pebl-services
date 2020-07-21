import { SessionDataManager } from "../interfaces/sessionDataManager";
import { SET_ALL_NOTIFICATIONS, SET_ALL_NOTIFICATIONS_REFS, SET_ALL_PEBL_CONFIG, DB_VERSION, LogCategory, Severity, generateUserClearedNotificationsKey, generateUserClearedTimestamps, generateThreadKey } from "./constants";
import { auditLogger } from "../main";
import { Voided, XApiStatement } from "../models/xapiStatement";
import { SharedAnnotation } from "../models/sharedAnnotation";
import { Message } from "../models/message";
import { Reference } from "../models/reference";

let upgrades = [
  { //Refactor to single notification representation
    "version": 5,
    "fn": (redis: SessionDataManager, completedUpgrade: () => void) => {
      redis.deleteValue(SET_ALL_NOTIFICATIONS_REFS, () => {
        redis.keys("user:*:notifications",
          (ids: string[]) => {
            let delIds = ids.slice(0);
            let p = () => {
              let id = ids.pop();
              if (id) {
                redis.getAllHashPairs(id, (notificationSet: { [key: string]: string }) => {
                  let pairs: string[] = [];
                  let incPairs = [];
                  for (let notification in notificationSet) {
                    let notificationId = notification.substring("notification:".length);
                    pairs.push(notificationId);
                    pairs.push(notificationSet[notification]);
                    incPairs.push(notificationId);
                  }
                  redis.incHashKeys(SET_ALL_NOTIFICATIONS_REFS,
                    incPairs,
                    1,
                    () => {
                      redis.setHashValues(SET_ALL_NOTIFICATIONS,
                        pairs,
                        () => {
                          p();
                        });
                    });
                });
              } else {
                redis.deleteValues(delIds, () => {
                  completedUpgrade();
                });
              }
            }
            p();
          });
      });
    }
  },

  { //Refactor notifications to time with void pool
    "version": 6,
    "fn": (redis: SessionDataManager, completedUpgrade: () => void) => {
      let prefixForUsernameLength = "timestamp:notifications:".length
      redis.getAllHashPairs(SET_ALL_NOTIFICATIONS,
        (allNotificationSet) => {
          redis.keys("timestamp:notifications:*",
            (userNotificationSets: string[]) => {
              let p = () => {
                let userNotificationSet = userNotificationSets.pop();
                if (userNotificationSet) {
                  let username = userNotificationSet.substring(prefixForUsernameLength);
                  redis.getValuesGreaterThanTimestamp(userNotificationSet,
                    1,
                    (userNotifications: string[]) => {
                      let voided: string[] = [];
                      let earliestVoids: { [key: string]: number } = {};
                      let voidLimit: { [key: string]: boolean } = {};
                      for (let notificationId of userNotifications) {
                        let notification = JSON.parse(allNotificationSet[notificationId]);
                        if (Voided.is(notification)) {
                          let v = new Voided(notification);
                          let vt = allNotificationSet[v.target];
                          if (vt) {
                            let t = new XApiStatement(JSON.parse(vt));
                            let voidLimited = false;
                            if (Message.is(t)) {
                              let m = new Message(t);
                              if (!voidLimit[m.thread]) {
                                earliestVoids[m.thread] = new Date(v.stored).getTime();
                              } else {
                                voidLimited = true;
                              }
                            } else if (SharedAnnotation.is(t)) {
                              let sa = new SharedAnnotation(t);
                              if (!voidLimit["sa" + sa.book]) {
                                earliestVoids["sa" + sa.book] = new Date(v.stored).getTime();
                              } else {
                                voidLimited = true;
                              }
                            } else if (Reference.is(t)) {
                              let r = new Reference(t);
                              if (!voidLimit["r" + r.book]) {
                                earliestVoids["r" + r.book] = new Date(v.stored).getTime();
                              } else {
                                voidLimited = true;
                              }
                            }
                            if (voidLimited)
                              voided.push(v.target);
                          }
                        } else {
                          if (Message.is(notification)) {
                            let m = new Message(notification);
                            voidLimit[m.thread] = true
                            if (m.getActorId() === username)
                              voided.push(m.id);
                          } else if (SharedAnnotation.is(notification)) {
                            let sa = new SharedAnnotation(notification);
                            voidLimit["sa" + sa.book] = true
                            if (sa.getActorId() === username)
                              voided.push(sa.id);
                          } else if (Reference.is(notification)) {
                            let r = new Reference(notification);
                            voidLimit["r" + r.book] = true
                            if (r.getActorId() === username)
                              voided.push(r.id);
                          }
                        }
                      }
                      let earlyVoidKeys = Object.keys(earliestVoids);
                      let voidKeysStore = [];
                      for (let key of earlyVoidKeys) {
                        voidKeysStore.push(key);
                        voidKeysStore.push(earliestVoids[key] + "");
                      }
                      let fnI = () => {
                        if (userNotificationSet) {
                          redis.deleteValue(userNotificationSet,
                            () => {
                              p();
                            });
                        }
                      };
                      let fn = () => {
                        if (voided.length > 0) {
                          redis.addSetValue(generateUserClearedNotificationsKey(username),
                            voided,
                            fnI);
                        } else {
                          fnI();
                        }
                      };

                      if (voidKeysStore.length > 0) {
                        redis.setHashValues(generateUserClearedTimestamps(username), voidKeysStore, fn);
                      } else {
                        fn();
                      }
                    });
                } else {
                  redis.deleteValue(SET_ALL_NOTIFICATIONS,
                    () => {
                      redis.deleteValue(SET_ALL_NOTIFICATIONS_REFS,
                        () => {
                          completedUpgrade();
                        });
                    });
                }
              }
              p();
            });
        });
    }
  },

  { // fix void pool for previous messages sent
    "version": 7,
    "fn": (redis: SessionDataManager, completedUpgrade: () => void) => {
      redis.keys("user:*:threads",
        (userThreadsSet: string[]) => {
          let p = () => {
            let userThreads = userThreadsSet.pop();
            if (userThreads) {
              let username = userThreads.substring("user:".length, userThreads.length - ":threads".length);
              let toVoidIds: string[] = [];
              redis.getHashValues(userThreads, (threads: string[]) => {
                let p1 = () => {
                  let thread = threads.pop();
                  if (thread) {
                    redis.getHashValue(generateUserClearedTimestamps(username),
                      thread,
                      (timestampString) => {
                        let timestamp = 0;
                        if (timestampString) {
                          timestamp = parseInt(timestampString);
                        }
                        if (thread) {
                          redis.getHashValues(generateThreadKey(thread),
                            (messages) => {
                              for (let message of messages) {
                                let o = new XApiStatement(JSON.parse(message));
                                if ((username === o.getActorId()) && (timestamp < new Date(o.stored).getTime())) {
                                  toVoidIds.push(o.id);
                                }
                              }
                              if (toVoidIds.length > 0)
                                redis.addSetValue(generateUserClearedNotificationsKey(username), toVoidIds, p1);
                              else
                                p1();
                            });
                        }
                      });
                  } else {
                    p();
                  }
                }
                p1();
              });
            } else {
              completedUpgrade();
            }
          }
          p();
        });
    }
  },

  { // clear incoming queue
    "version": 8,
    "fn": (redis: SessionDataManager, completedUpgrade: () => void) => {
      redis.deleteValue("rsmq:incomingMessages",
        () => {
          redis.deleteValue("rsmq:incomingMessages:Q", () => {
            redis.deleteSetValue("rsmq:QUEUES", "incomingMessages", completedUpgrade);
          });
        })
    }
  },


  { // remove xAPI with bad description field
    "version": 9,
    "fn": (redis: SessionDataManager, completedUpgrade: () => void) => {
      redis.deleteValue("outgoingXapi", completedUpgrade);
    }
  }


];

function setVersion(redis: SessionDataManager, version: number, callback: () => void): void {
  redis.setHashValue(SET_ALL_PEBL_CONFIG,
    DB_VERSION,
    version + "",
    () => {
      auditLogger.report(LogCategory.SYSTEM, Severity.INFO, "RedisUpgradeFinished", version);
      callback();
    });
}

export function currentRedisVersion(): number {
  let high = 0;
  for (let upgrade of upgrades) {
    if (upgrade.version > high) {
      high = upgrade.version;
    }
  }
  return high;
}

export function upgradeRedis(sessionCache: SessionDataManager, version: number, callback: () => void): void {
  let upgradesToApply = upgrades.filter((x) => {
    return x.version > version;
  }).sort((a, b): number => {
    return b.version - a.version;
  });

  let fn = () => {
    let upgrade = upgradesToApply.pop();
    if (upgrade) {
      auditLogger.report(LogCategory.SYSTEM, Severity.INFO, "RedisUpgradeStarted", upgrade.version);
      upgrade.fn(sessionCache,
        () => {
          if (upgrade) {
            setVersion(sessionCache, upgrade.version, fn);
          }
        });
    } else {
      callback();
    }
  }

  fn();
}
