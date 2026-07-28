import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);

    if (raw === null) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      this.logger.warn(`Failed to parse cache key ${key}`);
      await this.redis.delete(key);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), ttlSeconds);
  }

  async del(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key : [key];
    await this.redis.delete(...keys);
  }

  /** Delete keys matching a Redis SCAN pattern (e.g. user:id:abc*) */
  async delPattern(pattern: string): Promise<void> {
    const client = this.redis.client;
    let cursor = '0';

    do {
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        await this.redis.delete(...keys);
      }
    } while (cursor !== '0');
  }

  /** Return cached value or compute, store and return */
  async wrap<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}
