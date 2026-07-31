import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  DiscordWebhookView,
  NotificationStats,
  RoleGroup,
} from '@twomc/shared';
import { NotificationType as PrismaNotificationType, NotificationPriority as PrismaPriority } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  AdminWebhookDto,
  BroadcastNotificationDto,
  UpdateAdminWebhookDto,
} from './dto/notifications.dto';
import { DiscordNotificationService } from './discord.service';
import { NotificationsService } from './notifications.service';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminNotificationsController {
  constructor(
    private readonly discord: DiscordNotificationService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get('webhooks')
  listWebhooks(): Promise<DiscordWebhookView[]> {
    return this.discord.listWebhooks();
  }

  @Post('webhooks')
  @HttpCode(HttpStatus.CREATED)
  createWebhook(
    @CurrentUser('id') userId: string,
    @Body() dto: AdminWebhookDto,
  ): Promise<DiscordWebhookView> {
    return this.discord.createWebhook(userId, dto);
  }

  @Patch('webhooks/:id')
  updateWebhook(
    @Param('id') id: string,
    @Body() dto: UpdateAdminWebhookDto,
  ): Promise<DiscordWebhookView> {
    return this.discord.updateWebhook(id, dto);
  }

  @Delete('webhooks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteWebhook(@Param('id') id: string): Promise<void> {
    return this.discord.deleteWebhook(id);
  }

  @Post('broadcast')
  @HttpCode(HttpStatus.OK)
  broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.notifications.broadcast({
      type: dto.type as PrismaNotificationType,
      title: dto.title,
      message: dto.message,
      link: dto.link,
      priority: dto.priority as PrismaPriority | undefined,
      userIds: dto.userIds,
    });
  }

  @Get('stats')
  stats(): Promise<NotificationStats> {
    return this.notifications.stats();
  }
}
