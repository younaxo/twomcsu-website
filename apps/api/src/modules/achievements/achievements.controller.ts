import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AchievementCategory,
  AchievementRarity,
} from '@prisma/client';
import {
  AchievementDetail,
  AchievementFilter,
  AchievementWithProgress,
  AchievementsStats,
} from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AchievementsService } from './achievements.service';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @CurrentUser('id') userId: string | undefined,
    @Query('category') category?: AchievementCategory,
    @Query('rarity') rarity?: AchievementRarity,
    @Query('filter') filter?: AchievementFilter,
    @Query('search') search?: string,
    @Query('sort') sort?: 'order' | 'rarity' | 'name' | 'unlocked',
  ): Promise<AchievementWithProgress[]> {
    return this.achievements.getAllAchievements(userId, {
      category,
      rarity,
      filter,
      search,
      sort,
    });
  }

  @Get('stats')
  stats(): Promise<AchievementsStats> {
    return this.achievements.getStats();
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  bySlug(
    @Param('slug') slug: string,
    @CurrentUser('id') userId: string | undefined,
  ): Promise<AchievementDetail> {
    return this.achievements.getAchievementBySlug(slug, userId);
  }
}
