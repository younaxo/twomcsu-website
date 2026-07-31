import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AppNotification,
  NotificationSettings,
  NotificationType,
  NotificationsResponse,
  PushSubscriptionView,
  UnreadNotificationsCount,
} from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  DiscordPersonalWebhookDto,
  PushSubscribeDto,
  UpdateDigestDto,
  UpdateNotificationSettingsDto,
  UpdateTypeSettingDto,
} from './dto/notifications.dto';
import { DiscordNotificationService } from './discord.service';
import { NotificationSettingsService } from './notification-settings.service';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly settings: NotificationSettingsService,
    private readonly push: PushService,
    private readonly discord: DiscordNotificationService,
  ) {}

  @Get()
  list(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('unreadOnly', new DefaultValuePipe(false), ParseBoolPipe) unreadOnly: boolean,
  ): Promise<NotificationsResponse> {
    return this.notifications.list(userId, page, limit, unreadOnly);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser('id') userId: string): Promise<UnreadNotificationsCount> {
    return this.notifications.unreadCount(userId);
  }

  @Get('settings')
  getSettings(@CurrentUser('id') userId: string): Promise<NotificationSettings> {
    return this.settings.getOrCreate(userId);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettings> {
    return this.settings.update(userId, dto);
  }

  @Patch('settings/type/:type')
  updateTypeSettings(
    @CurrentUser('id') userId: string,
    @Param('type') type: NotificationType,
    @Body() dto: UpdateTypeSettingDto,
  ): Promise<NotificationSettings> {
    return this.settings.updateType(userId, type, dto);
  }

  @Post('settings/reset')
  @HttpCode(HttpStatus.OK)
  resetSettings(@CurrentUser('id') userId: string): Promise<NotificationSettings> {
    return this.settings.reset(userId);
  }

  @Get('push/vapid-key')
  vapidKey() {
    return this.push.getVapidPublicKey();
  }

  @Post('push/subscribe')
  @HttpCode(HttpStatus.CREATED)
  subscribePush(
    @CurrentUser('id') userId: string,
    @Body() dto: PushSubscribeDto,
  ): Promise<PushSubscriptionView> {
    return this.push.subscribe(userId, dto);
  }

  @Delete('push/subscribe/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  unsubscribePush(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.push.unsubscribe(userId, id);
  }

  @Post('discord/webhook')
  @HttpCode(HttpStatus.OK)
  saveDiscordWebhook(
    @CurrentUser('id') userId: string,
    @Body() dto: DiscordPersonalWebhookDto,
  ): Promise<NotificationSettings> {
    return this.settings.update(userId, {
      discordEnabled: true,
      discordWebhookUrl: dto.url,
    });
  }

  @Delete('discord/webhook')
  @HttpCode(HttpStatus.OK)
  deleteDiscordWebhook(@CurrentUser('id') userId: string): Promise<NotificationSettings> {
    return this.settings.update(userId, {
      discordEnabled: false,
      discordWebhookUrl: null,
    });
  }

  @Post('discord/webhook/test')
  @HttpCode(HttpStatus.OK)
  async testDiscordWebhook(@CurrentUser('id') userId: string) {
    const settings = await this.settings.getOrCreate(userId);
    if (!settings.discordWebhookUrl) {
      return { ok: false, message: 'Webhook не настроен' };
    }
    const ok = await this.discord.sendToWebhook(settings.discordWebhookUrl, {
      title: 'Тест уведомления TwoMC',
      description: 'Персональный Discord webhook работает',
      color: 0xf57c00,
    });
    return { ok, message: ok ? 'Тестовое сообщение отправлено' : 'Не удалось отправить' };
  }

  @Patch('digest')
  updateDigest(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateDigestDto,
  ): Promise<NotificationSettings> {
    return this.settings.update(userId, {
      digestMode: dto.digestMode,
      digestTime: dto.digestTime,
    });
  }

  @Post('digest/test')
  @HttpCode(HttpStatus.OK)
  async testDigest(@CurrentUser('id') userId: string) {
    const count = await this.notifications.sendDigestForUser(userId);
    return { count, message: count > 0 ? 'Дайджест отправлен' : 'Нет непрочитанных для дайджеста' };
  }

  @Patch('read-all')
  markAllRead(@CurrentUser('id') userId: string): Promise<{ count: number }> {
    return this.notifications.markAllRead(userId);
  }

  @Patch(':id/read')
  markRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<AppNotification> {
    return this.notifications.markRead(userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<void> {
    return this.notifications.remove(userId, id);
  }
}
