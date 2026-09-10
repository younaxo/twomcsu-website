import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { COOKIE_CONSENT_VERSION, CookieConsentInput, CookieConsentRecord } from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Latest consent choice for a signed-in user, or null if never saved */
  async get(userId: string): Promise<CookieConsentRecord | null> {
    const row = await this.prisma.cookieConsent.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return row ? this.map(row) : null;
  }

  /** Each save appends a new row — keeps an auditable history instead of overwriting it */
  async save(userId: string, input: CookieConsentInput, ip?: string): Promise<CookieConsentRecord> {
    const row = await this.prisma.cookieConsent.create({
      data: {
        userId,
        necessary: true,
        ...input,
        version: COOKIE_CONSENT_VERSION,
        ipHash: ip ? this.hashIp(ip) : null,
      },
    });
    return this.map(row);
  }

  /** IP is never stored raw — only a one-way hash, matching the ipHash column's intent */
  private hashIp(ip: string): string {
    return createHash('sha256').update(ip).digest('hex');
  }

  private map(row: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
    version: string;
    updatedAt: Date;
  }): CookieConsentRecord {
    return {
      necessary: true,
      analytics: row.analytics,
      marketing: row.marketing,
      preferences: row.preferences,
      version: row.version,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
