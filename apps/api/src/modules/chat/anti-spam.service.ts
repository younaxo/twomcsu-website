import { BadRequestException, Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

export type AntiSpamResult =
  | { allowed: true }
  | { allowed: false; reason: string; waitSeconds?: number };

@Injectable()
export class AntiSpamService {
  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async canSendMessage(userId: string, channelId: string, content: string, slowMode?: number | null): Promise<AntiSpamResult> {
    const now = Date.now();
    const cooldownKey = `chat:cooldown:${userId}`;
    const cooldownRaw = await this.redis.get(cooldownKey);
    if (cooldownRaw) {
      const until = Number(cooldownRaw);
      if (until > now) {
        return {
          allowed: false,
          reason: 'Подождите перед следующим сообщением',
          waitSeconds: Math.ceil((until - now) / 1000),
        };
      }
    }

    if (slowMode && slowMode > 0) {
      const slowKey = `chat:slow:${userId}:${channelId}`;
      const slowRaw = await this.redis.get(slowKey);
      if (slowRaw) {
        const until = Number(slowRaw);
        if (until > now) {
          return {
            allowed: false,
            reason: 'Включён медленный режим',
            waitSeconds: Math.ceil((until - now) / 1000),
          };
        }
      }
    }

    const rateKey = `chat:ratelimit:${userId}:${channelId}`;
    const count = await this.redis.increment(rateKey, 10);
    if (count > 5) {
      return { allowed: false, reason: 'Слишком много сообщений. Подождите немного' };
    }

    if (content.length > 500) {
      const longKey = `chat:long:${userId}`;
      const longHit = await this.redis.get(longKey);
      if (longHit) {
        return { allowed: false, reason: 'Длинные сообщения можно отправлять раз в минуту' };
      }
    }

    const dup = await this.checkDuplicates(userId, content);
    if (!dup.allowed) return dup;

    const caps = this.checkCaps(content);
    if (!caps.allowed) return caps;

    const blacklist = await this.checkBlacklist(content);
    if (!blacklist.allowed) return blacklist;

    return { allowed: true };
  }

  async registerMessage(userId: string, channelId: string, content: string, slowMode?: number | null) {
    const now = Date.now();
    await this.redis.set(`chat:cooldown:${userId}`, String(now + 1000), 2);

    if (slowMode && slowMode > 0) {
      await this.redis.set(
        `chat:slow:${userId}:${channelId}`,
        String(now + slowMode * 1000),
        slowMode + 1,
      );
    }

    if (content.length > 500) {
      await this.redis.set(`chat:long:${userId}`, '1', 60);
    }

    const lastKey = `chat:lastmessages:${userId}`;
    const raw = await this.redis.get(lastKey);
    const list: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    list.unshift(content.trim().toLowerCase());
    await this.redis.set(lastKey, JSON.stringify(list.slice(0, 3)), 60);
  }

  async checkDuplicates(userId: string, content: string): Promise<AntiSpamResult> {
    const raw = await this.redis.get(`chat:lastmessages:${userId}`);
    if (!raw) return { allowed: true };
    const list = JSON.parse(raw) as string[];
    const normalized = content.trim().toLowerCase();
    if (list.includes(normalized)) {
      return { allowed: false, reason: 'Нельзя повторять одно и то же сообщение' };
    }
    return { allowed: true };
  }

  checkCaps(content: string): AntiSpamResult {
    const letters = content.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '');
    if (letters.length < 8) return { allowed: true };
    const upper = letters.replace(/[^A-ZА-ЯЁ]/g, '').length;
    if (upper / letters.length > 0.7) {
      return { allowed: false, reason: 'Слишком много заглавных букв' };
    }
    return { allowed: true };
  }

  async checkBlacklist(content: string): Promise<AntiSpamResult> {
    const setting = await this.prisma.siteSetting.findUnique({
      where: { key: 'chat.blacklist' },
    });
    if (!setting?.value?.trim()) return { allowed: true };

    const words = setting.value
      .split(',')
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);

    const lower = content.toLowerCase();
    for (const word of words) {
      if (word && lower.includes(word)) {
        throw new BadRequestException('Сообщение содержит запрещённые слова');
      }
    }
    return { allowed: true };
  }

  sanitizeBlacklist(content: string, blacklist: string[]): string {
    let result = content;
    for (const word of blacklist) {
      if (!word) continue;
      const re = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      result = result.replace(re, '***');
    }
    return result;
  }
}
