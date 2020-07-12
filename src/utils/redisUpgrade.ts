import { SessionDataManager } from "../interfaces/sessionDataManager";
import { SET_ALL_NOTIFICATIONS, SET_ALL_NOTIFICATIONS_REFS, SET_ALL_PEBL_CONFIG, DB_VERSION, LogCategory, Severity } from "./constants";
import { auditLogger } from "../main";
import { pakoDeflate } from "./zip";

let upgrades = [
  {
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

  {
    "version": 6,
    "fn": (redis: SessionDataManager, completedUpgrade: () => void) => {
      redis.getAllHashPairs(SET_ALL_NOTIFICATIONS,
        (entries) => {
          let keys = Object.keys(entries);
          let p = () => {
            let key = keys.pop();
            if (key) {
              redis.setHashValue(SET_ALL_NOTIFICATIONS,
                key,
                pakoDeflate(entries[key]),
                () => {
                  p();
                });
            } else {
              completedUpgrade();
            }
          };
          p();
        });
    }
  },

  {
    "version": 7,
    "fn": (redis: SessionDataManager, completedUpgrade: () => void) => {

      redis.keys("timestamp:notifications:*",
        (notificationSets: string[]) => {

          let p = () => {
            let notificationSet = notificationSets.pop();
            if (notificationSet) {
              redis.getValuesGreaterThanTimestamp(notificationSet,
                1,
                (keys) => {

                });
            } else {
              completedUpgrade();
            }
          };
          p();
        });
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
