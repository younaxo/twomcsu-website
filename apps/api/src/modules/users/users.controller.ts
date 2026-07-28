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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  PlayerStatistics,
  ProfileReactionSummary,
  RoleGroup,
  SuccessResponse,
  UserBadge,
  UserProfile,
  UserSearchResult,
} from '@twomc/shared';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateProfileReportDto } from './dto/create-profile-report.dto';
import { GrantBadgeDto } from './dto/grant-badge.dto';
import { ReviewMediaRequestDto } from './dto/review-media-request.dto';
import { ReviewProfileReportDto } from './dto/review-profile-report.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { SetReactionDto } from './dto/set-reaction.dto';
import { UpdateStatisticsDto } from './dto/update-statistics.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('search')
  @UseGuards(JwtAuthGuard)
  search(@Query() query: SearchUsersDto): Promise<UserSearchResult[]> {
    return this.users.search(query.q, query.limit ?? 10);
  }

  @Get(':username/public')
  @UseGuards(OptionalJwtAuthGuard)
  findPublic(
    @Param('username') username: string,
    @CurrentUser() viewer?: AuthenticatedUser,
  ): Promise<UserProfile> {
    return this.users.findPublicProfile(username, viewer ?? null);
  }

  @Get(':username/statistics')
  @UseGuards(OptionalJwtAuthGuard)
  getStatistics(
    @Param('username') username: string,
    @CurrentUser() viewer?: AuthenticatedUser,
  ): Promise<PlayerStatistics> {
    return this.users.getStatistics(username, viewer ?? null);
  }

  @Post(':username/view')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  recordView(
    @Param('username') username: string,
    @CurrentUser('id') viewerId: string,
  ): Promise<SuccessResponse> {
    return this.users.recordView(username, viewerId);
  }

  @Put(':username/reaction')
  @UseGuards(JwtAuthGuard)
  setReaction(
    @Param('username') username: string,
    @CurrentUser('id') viewerId: string,
    @Body() dto: SetReactionDto,
  ): Promise<ProfileReactionSummary> {
    return this.users.setReaction(username, viewerId, dto.type);
  }

  @Post(':username/report')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  report(
    @Param('username') username: string,
    @CurrentUser('id') reporterId: string,
    @Body() dto: CreateProfileReportDto,
  ): Promise<SuccessResponse> {
    return this.users.createReport(username, reporterId, dto);
  }
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.ADMIN)
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @Get('users/:userId/badges')
  listBadges(@Param('userId') userId: string): Promise<UserBadge[]> {
    return this.users.listUserBadges(userId);
  }

  @Post('users/:userId/badges')
  @HttpCode(HttpStatus.CREATED)
  grantBadge(
    @Param('userId') userId: string,
    @Body() dto: GrantBadgeDto,
    @CurrentUser('id') actorId: string,
  ): Promise<UserBadge> {
    return this.users.grantBadge(userId, dto, actorId);
  }

  @Delete('users/:userId/badges/:type')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeBadge(@Param('userId') userId: string, @Param('type') type: string): Promise<void> {
    return this.users.revokeBadge(userId, type);
  }

  @Patch('users/:userId/statistics')
  updateStatistics(
    @Param('userId') userId: string,
    @Body() dto: UpdateStatisticsDto,
  ): Promise<PlayerStatistics> {
    return this.users.updateStatistics(userId, dto);
  }

  @Get('media-requests')
  listMediaRequests() {
    return this.users.listAdminMediaRequests();
  }

  @Patch('media-requests/:id')
  reviewMediaRequest(
    @Param('id') id: string,
    @Body() dto: ReviewMediaRequestDto,
    @CurrentUser('id') reviewerId: string,
  ) {
    return this.users.reviewMediaRequest(id, dto, reviewerId);
  }

  @Get('profile-reports')
  listReports() {
    return this.users.listProfileReports();
  }

  @Patch('profile-reports/:id')
  reviewReport(
    @Param('id') id: string,
    @Body() dto: ReviewProfileReportDto,
    @CurrentUser('id') reviewerId: string,
  ) {
    return this.users.reviewProfileReport(id, dto, reviewerId);
  }
}
