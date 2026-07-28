import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) readonly client: Redis) {
    client.on('connect', () => this.logger.log('Redis connected'));
    client.on('error', (error: Error) => this.logger.error(`Redis error: ${error.message}`));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
      return;
    }

    await this.client.set(key, value);
  }

  /** Increments a counter and keeps the ttl of the very first hit */
  async increment(key: string, ttlSeconds: number): Promise<number> {
    const value = await this.client.incr(key);

    if (value === 1) {
      await this.client.expire(key, ttlSeconds);
    }

    return value;
  }

  async delete(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }
}
