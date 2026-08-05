import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { NewsComment, RoleGroup } from '@twomc/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { NewsCommentsService } from './news-comments.service';

@Controller('moderation/news/comments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.MODERATOR)
export class NewsModerationController {
  constructor(private readonly comments: NewsCommentsService) {}

  @Patch(':commentId/pin')
  pin(@Param('commentId') commentId: string): Promise<NewsComment> {
    return this.comments.pin(commentId, true);
  }

  @Patch(':commentId/unpin')
  unpin(@Param('commentId') commentId: string): Promise<NewsComment> {
    return this.comments.pin(commentId, false);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('commentId') commentId: string,
    @CurrentUser('id') moderatorId: string,
  ): Promise<void> {
    return this.comments.moderateDelete(commentId, moderatorId);
  }
}
