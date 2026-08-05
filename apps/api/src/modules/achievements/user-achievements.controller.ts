import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserAchievementsResponse } from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AchievementsService } from './achievements.service';
import { SetShowcaseDto } from './dto/set-showcase.dto';

@Controller()
export class UserAchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  @Get('users/me/achievements')
  @UseGuards(JwtAuthGuard)
  myAchievements(@CurrentUser('id') userId: string): Promise<UserAchievementsResponse> {
    return this.achievements.getUserAchievements(userId, userId);
  }

  @Get('users/:username/achievements')
  @UseGuards(OptionalJwtAuthGuard)
  byUsername(
    @Param('username') username: string,
    @CurrentUser('id') viewerId: string | undefined,
  ): Promise<UserAchievementsResponse> {
    return this.achievements.getUserAchievementsByUsername(username, viewerId);
  }

  @Post('users/me/achievements/showcase')
  @UseGuards(JwtAuthGuard)
  setShowcase(
    @CurrentUser('id') userId: string,
    @Body() dto: SetShowcaseDto,
  ): Promise<UserAchievementsResponse> {
    return this.achievements.setShowcase(userId, dto.achievementIds);
  }

  @Delete('users/me/achievements/showcase/:achievementId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeShowcase(
    @CurrentUser('id') userId: string,
    @Param('achievementId') achievementId: string,
  ): Promise<void> {
    return this.achievements.removeFromShowcase(userId, achievementId);
  }
}
