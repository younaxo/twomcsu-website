import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AdminStoreStatsBreakdown,
  AdminStoreStatsOverview,
  AdminStoreStatsPoint,
  AdminStoreStatsResponse,
  RoleGroup,
} from '@twomc/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { StatsService } from './stats.service';

@Controller('admin/store/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminStoreStatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  getAll(): Promise<AdminStoreStatsResponse> {
    return this.stats.getAll();
  }

  @Get('overview')
  overview(): Promise<AdminStoreStatsOverview> {
    return this.stats.overview();
  }

  @Get('sales-by-day')
  salesByDay(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ): Promise<AdminStoreStatsPoint[]> {
    return this.stats.salesByDay(days);
  }

  @Get('sales-by-category')
  salesByCategory(): Promise<AdminStoreStatsBreakdown[]> {
    return this.stats.salesByCategory();
  }

  @Get('top-products')
  topProducts(
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<AdminStoreStatsBreakdown[]> {
    return this.stats.topProducts(limit);
  }

  @Get('revenue-by-week')
  revenueByWeek(
    @Query('weeks', new DefaultValuePipe(12), ParseIntPipe) weeks: number,
  ): Promise<AdminStoreStatsPoint[]> {
    return this.stats.revenueByWeek(weeks);
  }
}
