import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleGroup } from '@twomc/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { StatisticsService } from './statistics.service';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class StatisticsController {
  constructor(private readonly statistics: StatisticsService) {}

  @Get('overview')
  getOverview() {
    return this.statistics.getDashboardOverview();
  }

  @Get('charts/users')
  usersChart(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.statistics.getUsersChartData(days);
  }

  @Get('charts/revenue')
  revenueChart(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.statistics.getRevenueChartData(days);
  }

  @Get('charts/reports')
  reportsChart(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.statistics.getReportsChartData(days);
  }

  @Get('charts/servers')
  serversChart(@Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours: number) {
    return this.statistics.getServerOnlineChartData(hours);
  }

  @Get('top-products')
  topProducts(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return this.statistics.getTopProducts(limit);
  }

  @Get('top-buyers')
  topBuyers(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return this.statistics.getTopBuyers(limit);
  }

  @Get('moderator-activity')
  moderatorActivity(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    return this.statistics.getModeratorActivity(days);
  }
}
