import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { BRUTE_FORCE_WINDOW_SECONDS } from './auth.constants';

@Injectable()
export class BruteForceService {
  private readonly logger = new Logger(BruteForceService.name);

  constructor(private readonly redis: RedisService) {}

  async getFailedAttempts(ip: string): Promise<number> {
    const value = await this.redis.get(this.attemptsKey(ip));

    return value ? Number(value) : 0;
  }

  incrementFailedAttempts(ip: string): Promise<number> {
    return this.redis.increment(this.attemptsKey(ip), BRUTE_FORCE_WINDOW_SECONDS);
  }

  async resetFailedAttempts(ip: string): Promise<void> {
    await this.redis.delete(this.attemptsKey(ip), this.blockedKey(ip));
  }

  isBlocked(ip: string): Promise<boolean> {
    return this.redis.exists(this.blockedKey(ip));
  }

  async blockIp(ip: string): Promise<void> {
    await this.redis.set(this.blockedKey(ip), '1', BRUTE_FORCE_WINDOW_SECONDS);
    this.logger.warn(`Login attempts from ${ip} are blocked for the next 15 minutes`);
  }

  private attemptsKey(ip: string): string {
    return `bruteforce:login:${ip}`;
  }

  private blockedKey(ip: string): string {
    return `bruteforce:blocked:${ip}`;
  }
}
