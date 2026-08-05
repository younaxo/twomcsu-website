import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RoleGroup } from '@twomc/shared';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SystemService } from './system.service';

class EnableMaintenanceDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;

  @IsOptional()
  @IsString()
  estimatedEnd?: string | null;
}

class UpdateModuleDto {
  @IsBoolean()
  @Type(() => Boolean)
  isEnabled!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;
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
  @IsBoolean()
  @Type(() => Boolean)
  isDismissible?: boolean;

  @IsOptional()
  @IsString()
  showFrom?: string | null;

  @IsOptional()
  @IsString()
  showUntil?: string | null;

  @IsOptional()
  @IsString()
  targetRole?: string | null;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  order?: number;
}

@Controller()
export class SystemController {
  constructor(private readonly system: SystemService) {}

  @Get('system/status')
  getStatus() {
    return this.system.getPublicStatus();
  }

  @Get('system/modules')
  getModules() {
    return this.system.listModules();
  }

  @Get('announcements/active')
  getActiveAnnouncements() {
    return this.system.listActiveAnnouncements();
  }

  @Post('admin/maintenance/enable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  enableMaintenance(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EnableMaintenanceDto,
  ) {
    return this.system.enableMaintenance(user.id, dto);
  }

  @Post('admin/maintenance/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  disableMaintenance() {
    return this.system.disableMaintenance();
  }

  @Get('admin/maintenance/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  maintenanceStatus() {
    return this.system.getMaintenanceStatus();
  }

  @Patch('admin/modules/:module')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  updateModule(
    @Param('module') module: string,
    @Body() dto: UpdateModuleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.system.updateModule(module, dto, user.id);
  }

  @Get('admin/announcements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  listAnnouncements() {
    return this.system.listAllAnnouncements();
  }

  @Post('admin/announcements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  createAnnouncement(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AnnouncementDto,
  ) {
    return this.system.createAnnouncement(dto, user.id);
  }

  @Patch('admin/announcements/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  updateAnnouncement(@Param('id') id: string, @Body() dto: Partial<AnnouncementDto>) {
    return this.system.updateAnnouncement(id, dto);
  }

  @Delete('admin/announcements/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleGroup.ADMIN)
  async deleteAnnouncement(@Param('id') id: string) {
    await this.system.deleteAnnouncement(id);
    return { ok: true };
  }
}
