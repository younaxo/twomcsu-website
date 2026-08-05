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
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ActivityDetail,
  ActivityFeedSettings,
  ActivityItem,
  PaginatedResponse,
} from '@twomc/shared';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ActivityService } from './activity.service';
import {
  ActivityHighlightsQueryDto,
  ActivityReactionDto,
  CreateActivityCommentDto,
  ListActivityFeedQueryDto,
  UpdateActivitySettingsDto,
} from './dto/activity.dto';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get('feed')
  @UseGuards(OptionalJwtAuthGuard)
  feed(
    @Query() query: ListActivityFeedQueryDto,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<PaginatedResponse<ActivityItem>> {
    return this.activity.getFeed(viewer?.id ?? null, query);
  }

  @Get('feed/user/:username')
  @UseGuards(OptionalJwtAuthGuard)
  userFeed(
    @Param('username') username: string,
    @Query() query: ListActivityFeedQueryDto,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<PaginatedResponse<ActivityItem>> {
    return this.activity.getUserFeed(username, viewer?.id ?? null, query);
  }

  @Get('feed/global-highlights')
  @UseGuards(OptionalJwtAuthGuard)
  highlights(
    @Query() query: ActivityHighlightsQueryDto,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<ActivityItem[]> {
    return this.activity.getHighlights(
      viewer?.id ?? null,
      query.period ?? 'week',
      query.limit ?? 10,
    );
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  settings(
    @CurrentUser('id') userId: string,
  ): Promise<ActivityFeedSettings> {
    return this.activity.getSettings(userId);
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard)
  updateSettings(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateActivitySettingsDto,
  ): Promise<ActivityFeedSettings> {
    return this.activity.updateSettings(userId, dto);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  byId(
    @Param('id') id: string,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
  ): Promise<ActivityDetail> {
    return this.activity.getById(id, viewer?.id ?? null);
  }

  @Post(':id/reactions')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  react(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ActivityReactionDto,
  ): Promise<ActivityItem> {
    return this.activity.toggleReaction(id, userId, dto.emoji);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  addComment(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateActivityCommentDto,
  ): Promise<ActivityDetail> {
    return this.activity.addComment(id, userId, dto.content);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteComment(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.activity.deleteComment(id, userId, false);
  }
}
