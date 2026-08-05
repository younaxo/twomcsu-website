import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ActivityItem, RoleGroup } from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActivityService } from './activity.service';
import { HideActivityDto } from './dto/activity.dto';

@Controller('moderation/activity')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.MODERATOR)
export class ActivityModerationController {
  constructor(private readonly activity: ActivityService) {}

  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteComment(
    @Param('id') id: string,
    @CurrentUser('id') moderatorId: string,
  ): Promise<void> {
    return this.activity.deleteComment(id, moderatorId, true);
  }

  @Post(':id/pin')
  @Roles(RoleGroup.ADMIN)
  pin(@Param('id') id: string): Promise<ActivityItem> {
    return this.activity.pinActivity(id, true);
  }

  @Delete(':id/pin')
  @Roles(RoleGroup.ADMIN)
  @HttpCode(HttpStatus.OK)
  unpin(@Param('id') id: string): Promise<ActivityItem> {
    return this.activity.pinActivity(id, false);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  hide(
    @Param('id') id: string,
    @CurrentUser('id') moderatorId: string,
    @Body() dto: HideActivityDto,
  ): Promise<void> {
    return this.activity.hideActivity(id, moderatorId, dto.reason);
  }
}
