import { SessionDataManager } from '../interfaces/sessionDataManager';
import { RedisClient } from 'redis';
import { XApiStatement } from '../models/xapiStatement';
import { auditLogger } from '../main';
import { LogCategory, Severity } from '../utils/constants';

export class RedisSessionDataCache implements SessionDataManager {
  private redis: RedisClient;

  constructor(redisClient: RedisClient) {
    this.redis = redisClient;
  }

  broadcast(channel: string, message: string): void {
    this.redis.publish(channel, message);
  }

  setHashValues(key: string, values: string[], callback?: (worked: "OK") => void): void {
    this.redis.hmset(key, values, (err, result) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisSetHashVals", err);
      }
      if (callback)
        callback(result);
    });
  }

  setHashValue(key: string, field: string, value: string, callback?: (fields: number) => void): void {
    this.redis.hset(key, field, value, (err, result) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisSetHashValue", err);
      }
      if (callback)
        callback(result);
    });
  }

  setHashValueIfNotExisting(key: string, field: string, value: string, callback?: (didSet: boolean) => void): void {
    this.redis.hsetnx(key, field, value, (err, result) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisSetHashValIfNotExist", err);
      }
      if (callback)
        callback(result == 1);
    });
  }

  getHashValues(key: string, callback: (data: string[]) => void): void {
    this.redis.hvals(key, (err, result) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisGetHashVals", err);
        callback([]);
      } else {
        callback(result);
      }
    });
  }

  getAllHashPairs(key: string, callback: (data: { [key: string]: string }) => void): void {
    this.redis.hgetall(key, (err, result) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisHashGetAll", err);
        callback({});
      } else {
        callback(result ? result : {});
      }
    });
  }

  getHashKeys(key: string, callback: (data: string[]) => void): void {
    this.redis.hvals(key, (err, result) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisGetHashKeys", err);
        callback([]);
      } else {
        callback(result);
      }
    });
  }

  getHashMultiField(key: string, field: string[], callback: (data: string[]) => void): void {
    if (field.length != 0) {
      this.redis.hmget(key, ...field, (err, result) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisGetHashMultiField", err);
        }
        callback(result);
      });
    } else {
      callback([]);
    }
  }

  getHashMultiKeys(keys: string[], callback: (data: { [key: string]: string[] }) => void): void {
    if (keys.length != 0) {
      let obj = {} as { [key: string]: any };
      let batch = this.redis.batch();
      for (let key of keys) {
        batch.hvals(key, (err, resp) => {
          if (err) {
            auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisGetHashMultiKeys", err);
            obj[key] = [];
          } else {
            obj[key] = resp;
          }
        });
      }
      batch.exec((err, resp) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisGetHashMultiKeysBatch", err);
          callback({});
        } else {
          callback(obj);
        }
      });
    } else {
      callback({});
    }
  }

  getHashValue(key: string, field: string, callback: (data?: string) => void): void {
    this.redis.hget(key, field, (err, result) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisGetHashValue", err);
        callback(undefined);
      } else {
        callback(result);
      }
    });
  }

  deleteValue(key: string, callback: (deleted: boolean) => void): void {
    this.redis.del(key, (err) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisDeleteValue", err);
        if (callback !== undefined) {
          callback(false);
        }
      } else {
        if (callback !== undefined) {
          callback(true);
        }
      }
    });
  }

  deleteValues(keys: string[], callback: (deleted: boolean) => void): void {
    if (keys.length != 0) {
      let obj = {} as { [key: string]: any };
      let batch = this.redis.batch();
      for (let key of keys) {
        batch.del(key, (err, resp) => {
          if (err) {
            auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisDeleteValues", err);
            obj[key] = [];
          } else {
            obj[key] = resp;
          }
        });
      }
      batch.exec((err, resp) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisDelValsBatch", err);
          if (callback) {
            callback(false);
          }
        } else {
          if (callback) {
            callback(true);
          }
        }
      });
    } else {
      if (callback) {
        callback(true);
      }
    }
  }

  addSetValue(key: string, value: (string[] | string), callback?: (added: number) => void): void {
    //this splices the value string[] into sadd(key, value[0], value[1], value[2]...)
    if (value instanceof Array) {
      this.redis.sadd(key, ...value, (err, result) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisAddSetValue", err);
          if (callback)
            callback(-1);
        } else {
          if (callback)
            callback(result);
        }
      });
    } else {
      this.redis.sadd(key, value, (err, result) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisAddSetValueSingle", err);
          if (callback)
            callback(-1);
        } else {
          if (callback)
            callback(result);
        }
      });
    }
  }

  isMemberSetValue(key: string, id: string, callback: (exists: boolean) => void): void {
    this.redis.sismember(key, id, (err, result) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisIsMemberSetVal", err);
        callback(false);
      } else {
        callback(1 == result);
      }
    })
  }

  incHashKey(key: string, id: string, increment: number, callback?: (num: number) => void): void {
    this.redis.hincrby(key, id, increment, (err, resp) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisGetHashMultiKeys", err);
        if (callback) {
          callback(resp);
        }
      } else {
        if (callback) {
          callback(resp);
        }
      }
    });
  }

  incHashKeys(key: string, ids: string[], increment: number, callback?: (nums: { [key: string]: number }) => void): void {
    if (ids.length != 0) {
      let obj = {} as { [key: string]: any };
      let batch = this.redis.batch();
      for (let id of ids) {
        batch.hincrby(key, id, increment, (err, resp) => {
          if (err) {
            auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisIncKeys", err);
            obj[key] = [];
          } else {
            obj[key] = resp;
          }
        });
      }
      batch.exec((err, resp) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisIncKeysBatch", err);
          if (callback) {
            callback({});
          }
        } else {
          if (callback) {
            callback(obj);
          }
        }
      });
    } else {
      if (callback) {
        callback({});
      }
    }
  }

  getSetValues(key: string, callback: (data: string[]) => void): void {
    this.redis.smembers(key, (err, result) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisGetSetVals", err);
        callback([]);
      } else {
        callback(result);
      }
    })
  }

  unionSetValues(key: string | string[], callback: (data: string[]) => void): void {
    this.redis.sunion(key, (err, result) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisUnionSetVals", err);
        callback([]);
      } else {
        callback(result);
      }
    })
  }

  deleteSetValue(key: string, value: (string | string[]), callback?: (deleted: boolean) => void): void {
    if (value instanceof Array) {
      //this splices the value string[] into sadd(key, value[0], value[1], value[2]...)          
      this.redis.srem(key, ...value, (err) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisDeleteSetValue", err);
          if (callback !== undefined) {
            callback(false);
          }
        } else {
          if (callback !== undefined) {
            callback(true);
          }
        }
      });
    } else {
      this.redis.srem(key, value, (err) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisDeleteSetValueSingle", err);
          if (callback !== undefined) {
            callback(false);
          }
        } else {
          if (callback !== undefined) {
            callback(true);
          }
        }
      });
    }
  }

  deleteHashValue(key: string, field: string, callback: (deleted: boolean) => void): void {
    this.redis.hdel(key, field, (err, result) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisDeleteHashValue", err);
        if (callback !== undefined) {
          callback(false);
        }
      } else {
        if (callback !== undefined) {
          callback(result > 0);
        }
      }
    });
  }

  scan10(cursor: string, pattern: string, callback: (data: [string, string[]]) => void): void {
    this.redis.scan(cursor,
      'MATCH',
      pattern,
      'COUNT',
      '10',
      (err: Error | null, result: [string, string[]]) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisScan", err);
          callback(["0", []]);
        } else {
          callback(result);
        }
      });
  }

  keys(pattern: string, callback: (data: string[]) => void): void {
    this.redis.keys(pattern,
      (err, result) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisKeys", err);
          callback([]);
        } else {
          callback(result);
        }
      });
  }

  getHashValuesForFields(key: string, fields: string[], callback: ((data: string[]) => void)): void {
    this.redis.hmget(key, fields, (err, result) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisGetHashValsForFields", err);
        callback([]);
      } else {
        callback(result);
      }
    });
  }

  addTimestampValue(key: string, timestamp: number, value: string) {
    this.redis.zadd(key, timestamp, value);
  }

  addTimestampValues(key: string, timestampPairs: (number | string)[]) {
    this.redis.zadd(key, ...timestampPairs);
  }

  getValuesGreaterThanTimestamp(key: string, timestamp: number, callback: ((data: string[]) => void)) {
    this.redis.zrangebyscore(key, timestamp, '+inf', (err, resp) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisGetValsMoreThanTime", err);
        callback([]);
      } else
        callback(resp);
    });
  }

  rankSortedSetMember(key: string, id: string, callback: (rank: (number | null)) => void): void {
    this.redis.zrank(key,
      id,
      (err, resp) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisRankSortedFail", err);
          callback(resp);
        } else {
          callback(resp);
        }
      });
  }

  deleteSortedTimestampMember(key: string, memberId: (string | string[]), callback: (deleted: number) => void): void {
    if (memberId instanceof Array) {
      this.redis.zrem(key, ...memberId, (err, result) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "DelSortedTimeMem", err);
          callback(-1);
        } else {
          callback(result);
        }
      });
    } else {
      this.redis.zrem(key, memberId, (err, result) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "DelSortedTimeMem", err);
          callback(-1);
        } else {
          callback(result);
        }
      });
    }
  }

  removeBadLRSStatement(id: string): void {
    this.redis.lrem('outgoingXapi', -1, id, (err, result) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "DelBadLRSStmt", err);
      }
    });
  }

  queueForLrs(value: string): void {
    this.redis.rpush('outgoingXapi', value);
  }

  queueForLrsVoid(value: string): void {
    let stmt = new XApiStatement(JSON.parse(value));
    let voided = stmt.toVoidRecord();
    delete voided.id;
    this.redis.rpush('outgoingXapi', JSON.stringify(voided));
  }

  retrieveForLrs(count: number, callback: ((value?: string[]) => void)): void {
    this.redis.lrange('outgoingXapi', 0, count, (err, resp) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisGetForLrs", err);
        callback(undefined);
      } else {
        callback(resp);
      }
    });
  }

  trimForLrs(count: number): void {
    this.redis.ltrim('outgoingXapi', count + 1, -1);
  }

  dumpKey(key: string, callback: (data?: string) => void): void {
    this.redis.dump(key, (err, data) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisDumpKey", err);
        callback(undefined);
      } else {
        callback(data);
      }
    });
  }

  dumpKeys(keys: string[], callback: (data?: { [key: string]: string }) => void): void {
    if (keys.length != 0) {
      let obj = {} as { [key: string]: string };
      let multi = this.redis.multi();
      for (let key of keys) {
        multi.dump(key, (err, resp) => {
          if (err) {
            auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisDumpKeys", err);
          } else {
            obj[key] = resp;
          }
        });
      }
      multi.exec((err, resp) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisGetHashMultiKeysBatch", err);
          callback({});
        } else {
          callback(obj);
        }
      });
    } else {
      callback({});
    }
  }

  restoreKey(key: string, ttl: number, data: string, callback?: (restored: boolean) => void): void {
    this.redis.restore(key, ttl, data, (err, data) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisDumpKey", err);
        if (callback) {
          callback(false);
        }
      } else {
        if (callback) {
          callback(true);
        }
      }
    });
  }

  scoreSortedSet(key: string, id: string, callback: (score: number | null) => void): void {
    this.redis.zscore(key, id, (err, data) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisScoreSortedSet", err);
        callback(null);
      } else {
        let d = parseFloat(data);
        callback(Number.isNaN(d) ? null : d);
      }
    })
  };

  rangeSortedSet(key: string, min: number, max: number, withScore: boolean, callback: ((data: string[]) => void)): void {
    if (withScore)
      this.redis.zrangebyscore(key, min, max, "WITHSCORES", (err, resp) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisRangeSortedSScore", err);
          callback([]);
        } else
          callback(resp);
      });
    else
      this.redis.zrangebyscore(key, min, max, (err, resp) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisRangeSortedSet", err);
          callback([]);
        } else
          callback(resp);
      });
  }

  rangeRevSortedSet(key: string, min: number, max: number, withScore: boolean, callback: ((data: string[]) => void)): void {
    if (withScore)
      this.redis.zrevrangebyscore(key, max, min, "WITHSCORES", (err, resp) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisRRangeSortedSScore", err);
          callback([]);
        } else
          callback(resp);
      });
    else
      this.redis.zrevrangebyscore(key, max, min, (err, resp) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisRRangeSortedSet", err);
          callback([]);
        } else
          callback(resp);
      });
  }

  countSortedSet(key: string, min: number, max: number, callback: (count: number | null) => void): void {
    this.redis.zcount(key,
      min,
      max,
      (err, count) => {
        if (err) {
          auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisCountSortedSet", err);
          callback(null);
        } else {
          callback(count);
        }
      });
  }

  setString(key: string, data: string, callback?: (worked: boolean) => void): void {
    this.redis.set(key, data, (err, resp) => {
      if (err) {
        auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisSet", err);
        if (callback) {
          callback(false);
        }
      } else {
        if (callback) {
          callback(true);
        }
      }
    });
  }

  // restoreKeys(keys: string[], callback: (data?: { [key: string]: string }) => void): void {
  //   if (keys.length != 0) {
  //     let obj = {} as { [key: string]: string };
  //     let multi = this.redis.multi();
  //     for (let key of keys) {
  //       multi.dump(key, (err, resp) => {
  //         if (err) {
  //           auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisDumpKeys", err);
  //         } else {
  //           obj[key] = resp;
  //         }
  //       });
  //     }
  //     multi.exec((err, resp) => {
  //       if (err) {
  //         auditLogger.report(LogCategory.STORAGE, Severity.CRITICAL, "RedisGetHashMultiKeysBatch", err);
  //         callback({});
  //       } else {
  //         callback(obj);
  //       }
  //     });
  //   } else {
  //     callback({});
  //   }
  // }
}
