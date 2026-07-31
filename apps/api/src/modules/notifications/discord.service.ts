import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  AppNotification,
  DiscordWebhookView,
  NotificationType,
} from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';

const TYPE_COLORS: Partial<Record<NotificationType, number>> = {
  REPORT_ASSIGNED: 0xf57c00,
  REPORT_VERDICT: 0x34d399,
  REPORT_TARGET: 0xef4444,
  NEWS_PUBLISHED: 0x60a5fa,
  MAINTENANCE: 0xfbbf24,
  ANNOUNCEMENT: 0xa78bfa,
  FRIEND_REQUEST: 0x34d399,
  SYSTEM: 0x9ca3af,
};

@Injectable()
export class DiscordNotificationService {
  private readonly logger = new Logger(DiscordNotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendToWebhook(
    webhookUrl: string,
    embed: {
      title: string;
      description?: string | null;
      url?: string | null;
      color?: number;
      thumbnail?: string | null;
      fields?: Array<{ name: string; value: string; inline?: boolean }>;
    },
  ): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: embed.title,
              description: embed.description ?? undefined,
              url: embed.url ?? undefined,
              color: embed.color ?? 0xf57c00,
              thumbnail: embed.thumbnail ? { url: embed.thumbnail } : undefined,
              fields: embed.fields,
              footer: { text: 'TwoMC' },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
      return response.ok;
    } catch (error) {
      this.logger.warn(`Discord webhook failed: ${String(error)}`);
      return false;
    }
  }

  async sendToUserPersonalWebhook(
    userId: string,
    notification: AppNotification,
    webhookUrl: string | null,
  ): Promise<boolean> {
    if (!webhookUrl) return false;
    const frontendUrl = process.env.FRONTEND_URL ?? 'https://twomc.su';
    return this.sendToWebhook(webhookUrl, {
      title: notification.title,
      description: notification.message,
      url: notification.link ? `${frontendUrl}${notification.link}` : undefined,
      color: TYPE_COLORS[notification.type] ?? 0xf57c00,
      thumbnail: notification.imageUrl,
    });
  }

  async sendToGlobalWebhooks(notification: AppNotification): Promise<boolean> {
    const webhooks = await this.prisma.discordWebhook.findMany({
      where: {
        isActive: true,
        eventTypes: { has: notification.type },
      },
    });

    if (webhooks.length === 0) return false;

    const frontendUrl = process.env.FRONTEND_URL ?? 'https://twomc.su';
    const results = await Promise.all(
      webhooks.map((webhook) =>
        this.sendToWebhook(webhook.url, {
          title: notification.title,
          description: notification.message,
          url: notification.link ? `${frontendUrl}${notification.link}` : undefined,
          color: TYPE_COLORS[notification.type] ?? 0xf57c00,
          thumbnail: notification.imageUrl,
          fields: [{ name: 'Тип', value: notification.type, inline: true }],
        }),
      ),
    );

    return results.some(Boolean);
  }

  async listWebhooks(): Promise<DiscordWebhookView[]> {
    const rows = await this.prisma.discordWebhook.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((row) => this.mapWebhook(row));
  }

  async createWebhook(
    createdBy: string,
    data: { name: string; url: string; eventTypes: string[]; isActive?: boolean },
  ): Promise<DiscordWebhookView> {
    this.assertDiscordUrl(data.url);
    const row = await this.prisma.discordWebhook.create({
      data: {
        name: data.name,
        url: data.url,
        eventTypes: data.eventTypes,
        isActive: data.isActive ?? true,
        createdBy,
      },
    });
    return this.mapWebhook(row);
  }

  async updateWebhook(
    id: string,
    data: Partial<{ name: string; url: string; eventTypes: string[]; isActive: boolean }>,
  ): Promise<DiscordWebhookView> {
    if (data.url) this.assertDiscordUrl(data.url);
    const existing = await this.prisma.discordWebhook.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Webhook не найден');

    const row = await this.prisma.discordWebhook.update({
      where: { id },
      data,
    });
    return this.mapWebhook(row);
  }

  async deleteWebhook(id: string): Promise<void> {
    const existing = await this.prisma.discordWebhook.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Webhook не найден');
    await this.prisma.discordWebhook.delete({ where: { id } });
  }

  private assertDiscordUrl(url: string) {
    if (!/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//i.test(url)) {
      throw new BadRequestException('Укажите корректный Discord webhook URL');
    }
  }

  private mapWebhook(row: {
    id: string;
    name: string;
    url: string;
    eventTypes: string[];
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }): DiscordWebhookView {
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      eventTypes: row.eventTypes,
      isActive: row.isActive,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
