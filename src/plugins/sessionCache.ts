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

  setHashValues(key: string, values: string[]): void {
    this.redis.hmset(key, values);
  }

  setHashValue(key: string, field: string, value: string): void {
    this.redis.hset(key, field, value);
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
    this.redis.hmget(key, ...field, (err, result) => {
      if (err) {
        console.log(err);
      }
      callback(result);
    });
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

  deleteHashValue(key: string, field: string, callback?: (deleted: boolean) => void): void {
    this.redis.hdel(key, field, (err) => {
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

  deleteValue(key: string, callback?: (deleted: boolean) => void): void {
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
