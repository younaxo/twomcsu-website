import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DigestMode } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationDigestCron {
  private readonly logger = new Logger(NotificationDigestCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async processHourly() {
    await this.processDigest(DigestMode.HOURLY);
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async processDailyFallback() {
    await this.processDigest(DigestMode.DAILY, true);
  }

  @Cron(CronExpression.EVERY_WEEK)
  async processWeekly() {
    await this.processDigest(DigestMode.WEEKLY);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processDailyByDigestTime() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const time = `${hh}:${mm}`;

    const settings = await this.prisma.notificationSettings.findMany({
      where: { digestMode: DigestMode.DAILY, digestTime: time },
      select: { userId: true },
    });

    for (const row of settings) {
      try {
        await this.notifications.sendDigestForUser(row.userId);
      } catch (error) {
        this.logger.warn(`Daily digest failed for ${row.userId}: ${String(error)}`);
      }
    }
  }

  private async processDigest(mode: DigestMode, skipTimedDaily = false) {
    if (mode === DigestMode.DAILY && !skipTimedDaily) {
      return;
    }

    const settings = await this.prisma.notificationSettings.findMany({
      where: { digestMode: mode },
      select: { userId: true },
    });

    for (const row of settings) {
      try {
        await this.notifications.sendDigestForUser(row.userId);
      } catch (error) {
        this.logger.warn(`Digest ${mode} failed for ${row.userId}: ${String(error)}`);
      }
    }
  }
}
