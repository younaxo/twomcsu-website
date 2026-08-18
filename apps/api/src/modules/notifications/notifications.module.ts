import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminNotificationsController } from './admin-notifications.controller';
import { DiscordNotificationService } from './discord.service';
import { NotificationDigestCron } from './digest.cron';
import { NotificationEmailService } from './email.service';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.accessSecret'),
      }),
    }),
  ],
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [
    NotificationsService,
    NotificationSettingsService,
    PushService,
    NotificationEmailService,
    DiscordNotificationService,
    NotificationsGateway,
    NotificationDigestCron,
  ],
  exports: [NotificationsService, NotificationSettingsService],
})
export class NotificationsModule {}
