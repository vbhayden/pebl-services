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

  getHashValue(key: string, field: string, callback: ((data?: string) => void)): void {
    this.redis.hget(key, field, (err, result) => {
      if (err) {
        console.log(err);
        callback(undefined);
      } else {
        callback(result);
      }
    });
  }

  deleteHashValue(key: string, field: string, callback: (deleted: boolean) => void): void {
    this.redis.hdel(key, field, (err, result) => {
      if (err) {
        console.log(err);
        callback(false);
      } else {
        callback(true);
      }
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
