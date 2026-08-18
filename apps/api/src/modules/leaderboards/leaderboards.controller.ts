import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { LeaderboardMetric } from '@twomc/shared';
import { LeaderboardsService } from './leaderboards.service';

@Controller('leaderboards')
export class LeaderboardsController {
  constructor(private readonly leaderboards: LeaderboardsService) {}

  @Get()
  list(
    @Query('metric', new DefaultValuePipe(LeaderboardMetric.PLAY_TIME), new ParseEnumPipe(LeaderboardMetric))
    metric: LeaderboardMetric,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.leaderboards.list(metric, limit);
  }
}
