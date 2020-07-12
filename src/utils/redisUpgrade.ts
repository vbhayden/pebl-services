import { SessionDataManager } from "../interfaces/sessionDataManager";
import { SET_ALL_NOTIFICATIONS, SET_ALL_NOTIFICATIONS_REFS, SET_ALL_PEBL_CONFIG, DB_VERSION, LogCategory, Severity } from "./constants";
import { auditLogger } from "../main";

let upgrades = [
  {
    "version": 5,
    "fn": (redis: SessionDataManager,
      version: number,
      callback: () => void) => {
      auditLogger.report(LogCategory.SYSTEM, Severity.INFO, "RedisUpgradeStarted", version);

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
                  redis.setHashValue(SET_ALL_PEBL_CONFIG,
                    DB_VERSION,
                    version + "",
                    () => {
                      auditLogger.report(LogCategory.SYSTEM, Severity.INFO, "RedisUpgradeFinished", version);
                      callback();
                    });
                });
              }
            }
            p();
          });
      });
    }
  }
];

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
  });

  let fn = () => {
    let upgrade = upgradesToApply.pop();
    if (upgrade) {
      upgrade.fn(sessionCache, upgrade.version, fn);
    } else {
      callback();
    }
  }

  fn();
}

