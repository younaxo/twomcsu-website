import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentReportStatus } from '@prisma/client';
import {
  CommentEmoji,
  CommentReport,
  CommentSort,
  ProfileComment,
  ProfileCommentsResponse,
  RoleGroup,
  SuccessResponse,
} from '@twomc/shared';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CommentsService } from './comments.service';
import {
  AddCommentReactionDto,
  CreateCommentDto,
  DeleteCommentDto,
  ForceDisableCommentsDto,
  ReportCommentDto,
  ReviewCommentReportDto,
  UpdateCommentDto,
} from './dto/comments.dto';

@Controller('users/:username/comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Param('username') username: string,
    @CurrentUser() viewer: AuthenticatedUser | undefined,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('sort') sort?: string,
  ): Promise<ProfileCommentsResponse> {
    const resolvedSort =
      sort === 'oldest'
        ? CommentSort.OLDEST
        : sort === 'popular'
          ? CommentSort.POPULAR
          : CommentSort.NEWEST;

    return this.comments.getComments(username, viewer?.id ?? null, page, limit, resolvedSort);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('username') username: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<ProfileComment> {
    return this.comments.createComment(userId, username, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('username') username: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCommentDto,
  ): Promise<ProfileComment> {
    return this.comments.updateComment(userId, username, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('username') username: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteCommentDto,
  ): Promise<SuccessResponse> {
    return this.comments.deleteComment(user.id, user.roleGroup, username, id, dto.reason);
  }

  @Post(':id/pin')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  pin(
    @Param('username') username: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ProfileComment> {
    return this.comments.pinComment(userId, username, id);
  }

  @Post(':id/unpin')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  unpin(
    @Param('username') username: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ProfileComment> {
    return this.comments.unpinComment(userId, username, id);
  }

  @Post(':id/reactions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  addReaction(
    @Param('username') username: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddCommentReactionDto,
  ): Promise<ProfileComment> {
    return this.comments.addReaction(userId, username, id, dto.emoji);
  }

  @Delete(':id/reactions/:emoji')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  removeReaction(
    @Param('username') username: string,
    @Param('id') id: string,
    @Param('emoji') emoji: string,
    @CurrentUser('id') userId: string,
  ): Promise<ProfileComment> {
    return this.comments.removeReaction(userId, username, id, emoji as CommentEmoji);
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  report(
    @Param('username') username: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ReportCommentDto,
  ): Promise<SuccessResponse> {
    return this.comments.reportComment(userId, username, id, dto);
  }
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleGroup.MODERATOR)
export class AdminCommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Post('users/:userId/comments/disable')
  @HttpCode(HttpStatus.OK)
  disable(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ForceDisableCommentsDto,
  ): Promise<SuccessResponse> {
    return this.comments.forceDisableComments(adminId, userId, dto);
  }

  @Post('users/:userId/comments/enable')
  @HttpCode(HttpStatus.OK)
  enable(
    @Param('userId') userId: string,
    @CurrentUser('id') adminId: string,
  ): Promise<SuccessResponse> {
    return this.comments.forceEnableComments(adminId, userId);
  }

  @Get('comment-reports')
  listReports(
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const resolved =
      status === 'PENDING' || status === 'RESOLVED' || status === 'REJECTED'
        ? (status as CommentReportStatus)
        : undefined;

    return this.comments.listCommentReports(resolved, page, limit);
  }

  @Patch('comment-reports/:id')
  reviewReport(
    @Param('id') id: string,
    @CurrentUser('id') reviewerId: string,
    @Body() dto: ReviewCommentReportDto,
  ): Promise<CommentReport> {
    return this.comments.reviewCommentReport(id, reviewerId, dto);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.OK)
  hardDelete(@Param('id') id: string): Promise<SuccessResponse> {
    return this.comments.hardDeleteComment(id);
  }
}
