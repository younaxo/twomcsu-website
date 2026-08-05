import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ActivityItem,
  ActivityStats,
  PaginatedResponse,
  RoleGroup,
} from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActivityService } from './activity.service';
import {
  AdminListActivityQueryDto,
  CreateCustomActivityDto,
} from './dto/activity.dto';

@Controller('admin/activity')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class ActivityAdminController {
  constructor(private readonly activity: ActivityService) {}

  @Get('stats')
  stats(): Promise<ActivityStats> {
    return this.activity.getStats();
  }

  @Get()
  list(
    @Query() query: AdminListActivityQueryDto,
  ): Promise<PaginatedResponse<ActivityItem>> {
    return this.activity.adminList(query);
  }

  @Post('custom')
  custom(
    @CurrentUser('id') actorId: string,
    @Body() dto: CreateCustomActivityDto,
  ): Promise<ActivityItem | null> {
    return this.activity.createCustom(actorId, dto);
  }
}
