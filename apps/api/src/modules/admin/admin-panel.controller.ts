import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { OrderStatus, Prisma, RoleGroup as PrismaRoleGroup } from '@prisma/client';
import { RoleGroup } from '@twomc/shared';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ExportFormat, ExportService } from '../export/export.service';
import { AdminFinanceService } from './admin-finance.service';
import { AdminToolsService } from './admin-tools.service';
import { AdminUsersService, BulkUserAction } from './admin-users.service';

class BulkUsersDto {
  @IsArray()
  @IsString({ each: true })
  userIds!: string[];

  @IsEnum(['ban', 'unban', 'change_role', 'send_notification'] as const)
  action!: BulkUserAction;

  @IsOptional()
  @IsObject()
  data?: {
    roleGroup?: PrismaRoleGroup;
    banReason?: string;
    bannedUntil?: string | null;
    notificationTitle?: string;
    notificationMessage?: string;
  };
}

class SavedFilterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(1)
  page!: string;

  @IsObject()
  filters!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

class BookmarkDto {
  @IsString()
  @MinLength(1)
  url!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  order?: number;
}

class ScheduledExportDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  page!: string;

  @IsString()
  format!: string;

  @IsString()
  schedule!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  nextRunAt?: string;
}

class IpWhitelistDto {
  @IsArray()
  @IsString({ each: true })
  ips!: string[];
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminPanelController {
  constructor(
    private readonly users: AdminUsersService,
    private readonly tools: AdminToolsService,
    private readonly finance: AdminFinanceService,
    private readonly exportService: ExportService,
  ) {}

  // Users
  @Get('users')
  listUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isBanned') isBanned?: string,
    @Query('positionId') positionId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('lastLoginFrom') lastLoginFrom?: string,
    @Query('lastLoginTo') lastLoginTo?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.users.listUsers({
      page,
      limit,
      search,
      roleGroup: role as PrismaRoleGroup | undefined,
      isBanned: isBanned === undefined ? undefined : isBanned === 'true',
      positionId,
      departmentId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      lastLoginFrom: lastLoginFrom ? new Date(lastLoginFrom) : undefined,
      lastLoginTo: lastLoginTo ? new Date(lastLoginTo) : undefined,
      sort,
      order,
    });
  }

  @Patch('users/bulk')
  bulkUsers(@CurrentUser('id') actorId: string, @Body() dto: BulkUsersDto) {
    return this.users.bulkUpdate(actorId, dto);
  }

  @Get('users/:id/full')
  userFull(@Param('id') id: string) {
    return this.users.getUserFull(id);
  }

  // Audit extras handled in AdminController

  // Saved filters
  @Get('saved-filters')
  savedFilters(@CurrentUser('id') userId: string, @Query('page') page?: string) {
    return this.tools.listSavedFilters(userId, page);
  }

  @Post('saved-filters')
  createSavedFilter(@CurrentUser('id') userId: string, @Body() dto: SavedFilterDto) {
    return this.tools.createSavedFilter(userId, {
      ...dto,
      filters: dto.filters as Prisma.InputJsonValue,
    });
  }

  @Patch('saved-filters/:id')
  updateSavedFilter(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: Partial<SavedFilterDto>,
  ) {
    return this.tools.updateSavedFilter(userId, id, {
      name: dto.name,
      isDefault: dto.isDefault,
      filters: dto.filters as Prisma.InputJsonValue | undefined,
    });
  }

  @Delete('saved-filters/:id')
  deleteSavedFilter(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tools.deleteSavedFilter(userId, id);
  }

  // Bookmarks
  @Get('bookmarks')
  bookmarks(@CurrentUser('id') userId: string) {
    return this.tools.listBookmarks(userId);
  }

  @Post('bookmarks')
  createBookmark(@CurrentUser('id') userId: string, @Body() dto: BookmarkDto) {
    return this.tools.createBookmark(userId, dto);
  }

  @Patch('bookmarks/:id')
  updateBookmark(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: Partial<BookmarkDto>,
  ) {
    return this.tools.updateBookmark(userId, id, dto);
  }

  @Delete('bookmarks/:id')
  deleteBookmark(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tools.deleteBookmark(userId, id);
  }

  @Post('bookmarks/reorder')
  reorderBookmarks(
    @CurrentUser('id') userId: string,
    @Body() body: { orderedIds: string[] },
  ) {
    return this.tools.reorderBookmarks(userId, body.orderedIds ?? []);
  }

  // Scheduled exports
  @Get('exports/scheduled')
  scheduledExports(@CurrentUser('id') userId: string) {
    return this.tools.listScheduledExports(userId);
  }

  @Post('exports/scheduled')
  createScheduled(
    @CurrentUser('id') userId: string,
    @Body() dto: ScheduledExportDto,
  ) {
    return this.tools.createScheduledExport(userId, {
      ...dto,
      filters: dto.filters as Prisma.InputJsonValue | undefined,
    });
  }

  @Patch('exports/scheduled/:id')
  updateScheduled(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: Partial<ScheduledExportDto & { isActive: boolean }>,
  ) {
    return this.tools.updateScheduledExport(userId, id, {
      name: dto.name,
      format: dto.format,
      schedule: dto.schedule,
      email: dto.email,
      isActive: dto.isActive,
      filters: dto.filters as Prisma.InputJsonValue | undefined,
    });
  }

  @Delete('exports/scheduled/:id')
  deleteScheduled(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tools.deleteScheduledExport(userId, id);
  }

  // Site settings
  @Get('settings/site')
  siteSettings() {
    return this.tools.getSiteSettings();
  }

  @Patch('settings/site')
  updateSiteSettings(
    @CurrentUser('id') userId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.tools.updateSiteSettings(userId, body as Prisma.SiteSettingsUpdateInput);
  }

  // Security
  @Get('security/sessions')
  sessions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('userId') userId?: string,
  ) {
    return this.tools.listActiveSessions({ page, limit, userId });
  }

  @Get('security/suspicious')
  suspicious() {
    return this.tools.listSuspiciousActivity();
  }

  @Get('security/logins')
  logins(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('userId') userId?: string,
  ) {
    return this.tools.listLoginHistory({ page, limit, userId });
  }

  @Post('security/ip-whitelist')
  ipWhitelist(@CurrentUser('id') userId: string, @Body() dto: IpWhitelistDto) {
    return this.tools.updateIpWhitelist(dto.ips, userId);
  }

  // Content
  @Get('content/dashboard')
  contentDashboard() {
    return this.finance.getContentDashboard();
  }

  // Finance
  @Get('finance/overview')
  financeOverview() {
    return this.finance.getFinanceOverview();
  }

  @Get('finance/transactions')
  financeTransactions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.finance.listTransactions({
      page,
      limit,
      status,
      search,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('finance/refunds')
  financeRefunds(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit: number,
  ) {
    return this.finance.listRefunds({ page, limit });
  }

  @Post('finance/export')
  async financeExport(
    @Body() body: { format: ExportFormat; status?: OrderStatus; dateFrom?: string; dateTo?: string },
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportOrders(
      {
        status: body.status,
        dateFrom: body.dateFrom ? new Date(body.dateFrom) : undefined,
        dateTo: body.dateTo ? new Date(body.dateTo) : undefined,
      },
      body.format,
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(result.filename)}"`,
    );
    return res.send(result.buffer);
  }
}
