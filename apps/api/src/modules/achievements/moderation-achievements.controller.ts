import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleGroup } from '@twomc/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AchievementsService } from './achievements.service';

@Controller('moderation/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.MODERATOR)
export class ModerationAchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  @Post(':userId/achievements/:achievementId/grant')
  @HttpCode(HttpStatus.NO_CONTENT)
  grant(
    @Param('userId') userId: string,
    @Param('achievementId') achievementId: string,
  ): Promise<void> {
    return this.achievements.grantAchievement(userId, achievementId).then(() => undefined);
  }

  @Delete(':userId/achievements/:achievementId')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(
    @Param('userId') userId: string,
    @Param('achievementId') achievementId: string,
  ): Promise<void> {
    return this.achievements.revokeAchievement(userId, achievementId);
  }
}
