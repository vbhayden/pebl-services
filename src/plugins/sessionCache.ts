import { SessionDataManager } from '../interfaces/sessionDataManager';
import { RedisClient } from 'redis';
import { XApiStatement } from '../models/xapiStatement';

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
        console.log(err);
      }
      if (callback)
        callback(result);
    });
  }

  setHashValue(key: string, field: string, value: string, callback?: (fields: number) => void): void {
    this.redis.hset(key, field, value, (err, result) => {
      if (err) {
        console.log(err);
      }
      if (callback)
        callback(result);
    });
  }

  setHashValueIfNotExisting(key: string, field: string, value: string, callback?: (didSet: boolean) => void): void {
    this.redis.hsetnx(key, field, value, (err, result) => {
      if (err) {
        console.log(err);
      }
      if (callback)
        callback(result == 1);
    });
  }

  getHashValues(key: string, callback: (data: string[]) => void): void {
    this.redis.hvals(key, (err, result) => {
      if (err) {
        console.log(err);
        callback([]);
      } else {
        callback(result);
      }
    });
  }

  getHashKeys(key: string, callback: (data: string[]) => void): void {
    this.redis.hvals(key, (err, result) => {
      if (err) {
        console.log(err);
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
          console.log(err);
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
            console.log(err);
            obj[key] = [];
          } else {
            obj[key] = resp;
          }
        });
      }
      batch.exec((err, resp) => {
        if (err) {
          console.log(err);
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
        console.log(err);
        callback(undefined);
      } else {
        callback(result);
      }
    });
  }

  deleteValue(key: string, callback: (deleted: boolean) => void): void {
    this.redis.del(key, (err) => {
      if (err) {
        console.log(err);
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

  addSetValue(key: string, value: (string[] | string)): void {
    //this splices the value string[] into sadd(key, value[0], value[1], value[2]...)
    if (value instanceof Array) {
      this.redis.sadd(key, ...value);
    } else {
      this.redis.sadd(key, value);
    }
  }

  getSetValues(key: string, callback: (data: string[]) => void): void {
    this.redis.smembers(key, (err, result) => {
      if (err) {
        console.log(err);
        if (callback !== undefined) {
          callback([]);
        }
      } else {
        if (callback !== undefined) {
          callback(result);
        }
      }
    })
  }

  deleteSetValue(key: string, value: (string | string[]), callback?: (deleted: boolean) => void): void {
    if (value instanceof Array) {
      //this splices the value string[] into sadd(key, value[0], value[1], value[2]...)          
      this.redis.srem(key, ...value, (err) => {
        if (err) {
          console.log(err);
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
          console.log(err);
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
        console.log(err);
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

  getHashValuesForFields(key: string, fields: string[], callback: ((data: string[]) => void)): void {
    this.redis.hmget(key, fields, (err, result) => {
      if (err) {
        console.log(err);
        callback([]);
      } else {
        callback(result);
      }
    });
  }

  addTimestampValue(key: string, timestamp: number, value: string) {
    this.redis.zadd(key, timestamp, value);
  }

  getValuesGreaterThanTimestamp(key: string, timestamp: number, callback: ((data: string[]) => void)) {
    this.redis.zrangebyscore(key, timestamp, '+inf', (err, resp) => {
      if (err) {
        console.log(err);
        callback([]);
      } else
        callback(resp);
    });
  }

  queueForLrs(value: string): void {
    this.redis.rpush('outgoingXapi', value);
  }

  queueForLrsVoid(value: string): void {
    let stmt = new XApiStatement(JSON.parse(value));
    this.redis.rpush('outgoingXapi', JSON.stringify(stmt.toVoidRecord()));
  }

  retrieveForLrs(count: number, callback: ((value?: string[]) => void)): void {
    let transaction = this.redis.multi();
    transaction.lrange('outgoingXapi', 0, count, (err, resp) => {
      if (err) {
        console.log(err);
        callback(undefined);
      } else {
        callback(resp);
      }
    });
    transaction.ltrim('outgoingXapi', count + 1, -1);
    transaction.exec();
  }
}
