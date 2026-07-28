import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleGroup } from '@twomc/shared';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { AuditService } from './audit.service';

class BroadcastDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  link?: string;

  @IsOptional()
  @IsEnum(RoleGroup)
  roleGroup?: RoleGroup;
}

class UpsertSettingsDto {
  @IsOptional()
  @IsString()
  siteName?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  discordInvite?: string;

  @IsOptional()
  @IsString()
  vkUrl?: string;

  @IsOptional()
  @IsString()
  telegramUrl?: string;

  @IsOptional()
  @IsString()
  registrationEnabled?: string;

  @IsOptional()
  @IsString()
  maintenanceMode?: string;

  @IsOptional()
  @IsString()
  maxUsers?: string;
}

class AnnouncementDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  link?: string | null;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @IsOptional()
  @IsString()
  startsAt?: string | null;

  @IsOptional()
  @IsString()
  endsAt?: string | null;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminController {
  constructor(
    private readonly dashboard: AdminDashboardService,
    private readonly audit: AuditService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.dashboard.getDashboard();
  }

  @Get('audit-log')
  auditLog(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('action') action?: string,
    @Query('actorId') actorId?: string,
    @Query('q') q?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.audit.list({
      page,
      limit,
      action,
      actorId,
      q,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Post('broadcast')
  async broadcast(
    @CurrentUser('id') actorId: string,
    @Body() dto: BroadcastDto,
  ) {
    const result = await this.dashboard.broadcast(dto);
    await this.audit.log({
      actorId,
      action: 'notification.broadcast',
      changes: { after: { ...dto, count: result.count } },
    });
    return result;
  }

  @Get('settings')
  getSettings() {
    return this.dashboard.getSettings();
  }

  @Patch('settings')
  async updateSettings(
    @CurrentUser('id') actorId: string,
    @Body() dto: UpsertSettingsDto,
  ) {
    const before = await this.dashboard.getSettings();
    const entries = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => typeof value === 'string'),
    ) as Record<string, string>;
    const after = await this.dashboard.upsertSettings(entries);
    await this.audit.log({
      actorId,
      action: 'settings.update',
      targetType: 'SiteSetting',
      changes: { before, after },
    });
    return after;
  }

  @Get('announcements')
  listAnnouncements() {
    return this.dashboard.listAnnouncements();
  }

  @Post('announcements')
  @HttpCode(HttpStatus.CREATED)
  async createAnnouncement(
    @CurrentUser('id') actorId: string,
    @Body() dto: AnnouncementDto,
  ) {
    const row = await this.dashboard.createAnnouncement(dto);
    await this.audit.log({
      actorId,
      action: 'announcement.create',
      targetType: 'Announcement',
      targetId: row.id,
      changes: { after: row },
    });
    return row;
  }

  @Patch('announcements/:id')
  async updateAnnouncement(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body() dto: Partial<AnnouncementDto>,
  ) {
    const row = await this.dashboard.updateAnnouncement(id, dto);
    await this.audit.log({
      actorId,
      action: 'announcement.update',
      targetType: 'Announcement',
      targetId: id,
      changes: { after: row },
    });
    return row;
  }

  @Delete('announcements/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAnnouncement(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
  ) {
    await this.dashboard.deleteAnnouncement(id);
    await this.audit.log({
      actorId,
      action: 'announcement.delete',
      targetType: 'Announcement',
      targetId: id,
    });
  }
}
