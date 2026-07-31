import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import { PushSubscriptionView } from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';

export type PushPayload = {
  title: string;
  body?: string;
  url?: string;
  imageUrl?: string;
  tag?: string;
};

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@twomc.su';

    this.enabled = Boolean(publicKey && privateKey);
    if (this.enabled) {
      webpush.setVapidDetails(subject, publicKey!, privateKey!);
    } else {
      this.logger.warn('VAPID keys are not configured; push notifications disabled');
    }
  }

  getVapidPublicKey(): { publicKey: string | null } {
    return { publicKey: this.config.get<string>('VAPID_PUBLIC_KEY') ?? null };
  }

  async subscribe(
    userId: string,
    input: {
      endpoint: string;
      keys: { p256dh: string; auth: string };
      userAgent?: string;
      deviceName?: string;
    },
  ): Promise<PushSubscriptionView> {
    const row = await this.prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      create: {
        userId,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent ?? null,
        deviceName: input.deviceName ?? null,
      },
      update: {
        userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent ?? null,
        deviceName: input.deviceName ?? null,
        lastUsedAt: new Date(),
      },
    });

    return this.map(row);
  }

  async unsubscribe(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.pushSubscription.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Подписка не найдена');
    }
    await this.prisma.pushSubscription.delete({ where: { id } });
  }

  async list(userId: string): Promise<PushSubscriptionView[]> {
    const rows = await this.prisma.pushSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.map(row));
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<boolean> {
    if (!this.enabled) return false;

    const subscriptions = await this.prisma.pushSubscription.findMany({ where: { userId } });
    if (subscriptions.length === 0) return false;

    let sent = false;
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            JSON.stringify(payload),
          );
          await this.prisma.pushSubscription.update({
            where: { id: subscription.id },
            data: { lastUsedAt: new Date() },
          });
          sent = true;
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.pushSubscription.delete({ where: { id: subscription.id } });
          } else {
            this.logger.warn(`Push failed for ${subscription.id}: ${String(error)}`);
          }
        }
      }),
    );

    return sent;
  }

  private map(row: {
    id: string;
    endpoint: string;
    userAgent: string | null;
    deviceName: string | null;
    createdAt: Date;
    lastUsedAt: Date;
  }): PushSubscriptionView {
    return {
      id: row.id,
      endpoint: row.endpoint,
      userAgent: row.userAgent,
      deviceName: row.deviceName,
      createdAt: row.createdAt.toISOString(),
      lastUsedAt: row.lastUsedAt.toISOString(),
    };
  }
}
