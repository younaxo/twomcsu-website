import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RoleGroup } from '@twomc/shared';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { QuickModerationService } from './quick-moderation.service';

class MuteDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number | null;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  reason!: string;

  @IsOptional()
  @IsString()
  channelId?: string;
}

class WarnDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  reason!: string;
}

class KickDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  reason!: string;
}

class BanDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number | null;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  reason!: string;

  @IsEnum(['ACCOUNT', 'IP'] as const)
  banType!: 'ACCOUNT' | 'IP';
}

class ChangeRoleDto {
  @IsString()
  positionId!: string;
}

class HardDeleteDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  reason!: string;
}

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuickModerationController {
  constructor(private readonly moderation: QuickModerationService) {}

  @Post('moderation/users/:userId/mute')
  @Roles(RoleGroup.HELPER)
  mute(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: MuteDto,
  ) {
    return this.moderation.mute(actor, userId, dto);
  }

  @Post('moderation/users/:userId/warn')
  @Roles(RoleGroup.HELPER)
  warn(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: WarnDto,
  ) {
    return this.moderation.warn(actor, userId, dto.reason);
  }

  @Post('moderation/messages/:messageId/hard-delete')
  @Roles(RoleGroup.MODERATOR)
  hardDeleteMessage(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('messageId') messageId: string,
    @Body() dto: HardDeleteDto,
  ) {
    return this.moderation.hardDeleteMessage(actor, messageId, dto.reason);
  }

  @Post('moderation/comments/:commentId/hard-delete')
  @Roles(RoleGroup.MODERATOR)
  hardDeleteComment(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('commentId') commentId: string,
    @Body() dto: HardDeleteDto,
  ) {
    return this.moderation.hardDeleteComment(actor, commentId, dto.reason);
  }

  @Post('moderation/users/:userId/kick')
  @Roles(RoleGroup.MODERATOR)
  kick(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: KickDto,
  ) {
    return this.moderation.kick(actor, userId, dto.reason);
  }

  @Post('moderation/users/:userId/ban')
  @Roles(RoleGroup.MODERATOR)
  ban(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: BanDto,
  ) {
    return this.moderation.ban(actor, userId, dto);
  }

  @Post('admin/users/:userId/change-role')
  @Roles(RoleGroup.OWNER)
  changeRole(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
    @Body() dto: ChangeRoleDto,
  ) {
    return this.moderation.changeRole(actor, userId, dto.positionId);
  }

  @Delete('admin/users/:userId')
  @Roles(RoleGroup.OWNER)
  deleteAccount(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId') userId: string,
  ) {
    return this.moderation.deleteAccount(actor, userId);
  }
}
