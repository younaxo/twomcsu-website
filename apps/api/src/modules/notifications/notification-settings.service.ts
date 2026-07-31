import { Injectable } from '@nestjs/common';
import { DigestMode, NotificationSettings as PrismaSettings, Prisma } from '@prisma/client';
import {
  DigestMode as SharedDigestMode,
  NotificationSettings,
  NotificationType,
  NotificationTypeSetting,
} from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_TYPE_SETTING: NotificationTypeSetting = {
  site: true,
  email: true,
  push: true,
  discord: false,
  sound: true,
};

@Injectable()
export class NotificationSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(userId: string): Promise<NotificationSettings> {
    const row =
      (await this.prisma.notificationSettings.findUnique({ where: { userId } })) ??
      (await this.prisma.notificationSettings.create({
        data: { userId },
      }));

    return this.map(row);
  }

  async update(
    userId: string,
    data: Partial<{
      emailEnabled: boolean;
      pushEnabled: boolean;
      discordEnabled: boolean;
      discordWebhookUrl: string | null;
      soundEnabled: boolean;
      digestMode: SharedDigestMode;
      digestTime: string | null;
      quietHoursEnabled: boolean;
      quietHoursStart: string | null;
      quietHoursEnd: string | null;
      typeSettings: Partial<Record<NotificationType, NotificationTypeSetting>>;
    }>,
  ): Promise<NotificationSettings> {
    await this.getOrCreate(userId);

    const row = await this.prisma.notificationSettings.update({
      where: { userId },
      data: {
        emailEnabled: data.emailEnabled,
        pushEnabled: data.pushEnabled,
        discordEnabled: data.discordEnabled,
        discordWebhookUrl: data.discordWebhookUrl,
        soundEnabled: data.soundEnabled,
        digestMode: data.digestMode as DigestMode | undefined,
        digestTime: data.digestTime,
        quietHoursEnabled: data.quietHoursEnabled,
        quietHoursStart: data.quietHoursStart,
        quietHoursEnd: data.quietHoursEnd,
        typeSettings:
          data.typeSettings === undefined
            ? undefined
            : (data.typeSettings as Prisma.InputJsonValue),
      },
    });

    return this.map(row);
  }

  async updateType(
    userId: string,
    type: NotificationType,
    setting: NotificationTypeSetting,
  ): Promise<NotificationSettings> {
    const current = await this.getOrCreate(userId);
    return this.update(userId, {
      typeSettings: {
        ...current.typeSettings,
        [type]: { ...DEFAULT_TYPE_SETTING, ...current.typeSettings[type], ...setting },
      },
    });
  }

  async reset(userId: string): Promise<NotificationSettings> {
    await this.getOrCreate(userId);
    const row = await this.prisma.notificationSettings.update({
      where: { userId },
      data: {
        emailEnabled: true,
        pushEnabled: true,
        discordEnabled: false,
        discordWebhookUrl: null,
        soundEnabled: true,
        digestMode: DigestMode.INSTANT,
        digestTime: '09:00',
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        typeSettings: {},
      },
    });
    return this.map(row);
  }

  isChannelEnabled(
    settings: NotificationSettings,
    type: NotificationType,
    channel: keyof NotificationTypeSetting,
  ): boolean {
    const typeSetting = settings.typeSettings[type] ?? DEFAULT_TYPE_SETTING;
    if (typeSetting[channel] === false) {
      return false;
    }

    if (channel === 'email') return settings.emailEnabled;
    if (channel === 'push') return settings.pushEnabled;
    if (channel === 'discord') return settings.discordEnabled;
    if (channel === 'sound') return settings.soundEnabled;
    return true;
  }

  isQuietHours(settings: NotificationSettings, now = new Date()): boolean {
    if (!settings.quietHoursEnabled || !settings.quietHoursStart || !settings.quietHoursEnd) {
      return false;
    }

    const current = now.getHours() * 60 + now.getMinutes();
    const start = this.parseTime(settings.quietHoursStart);
    const end = this.parseTime(settings.quietHoursEnd);
    if (start === null || end === null) return false;

    if (start === end) return true;
    if (start < end) return current >= start && current < end;
    return current >= start || current < end;
  }

  private parseTime(value: string): number | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  private map(row: PrismaSettings): NotificationSettings {
    return {
      id: row.id,
      emailEnabled: row.emailEnabled,
      pushEnabled: row.pushEnabled,
      discordEnabled: row.discordEnabled,
      discordWebhookUrl: row.discordWebhookUrl,
      soundEnabled: row.soundEnabled,
      digestMode: row.digestMode as SharedDigestMode,
      digestTime: row.digestTime,
      quietHoursEnabled: row.quietHoursEnabled,
      quietHoursStart: row.quietHoursStart,
      quietHoursEnd: row.quietHoursEnd,
      typeSettings:
        (row.typeSettings as Partial<Record<NotificationType, NotificationTypeSetting>>) ?? {},
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
