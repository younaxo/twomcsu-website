import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommentPolicy,
  CommentReportReason,
  CommentReportStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import {
  COMMENT_EDIT_WINDOW_MS,
  COMMENT_EMOJIS,
  CommentEmoji,
  CommentReport,
  CommentSort,
  MAX_COMMENT_LENGTH,
  MAX_COMMENT_PAGE_SIZE,
  MAX_PINNED_COMMENTS,
  ProfileComment,
  ProfileCommentsResponse,
  RoleGroup,
  SuccessResponse,
  hasRoleGroup,
} from '@twomc/shared';
import { buildPaginatedResult } from '../../common/pagination';
import { selectMinimalUser } from '../../common/prisma/user-selects';
import { findUserByIdentifier } from '../../common/user-identifier';
import { toUserBadge } from '../users/profile.mapper';
import { toPublicPosition } from '../positions/position.mapper';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { FriendsService } from '../friends/friends.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCommentDto,
  ForceDisableCommentsDto,
  ReportCommentDto,
  ReviewCommentReportDto,
  UpdateCommentDto,
} from './dto/comments.dto';
import { MarkdownService } from './markdown.service';
import { MentionsService } from './mentions.service';

const RATE_LIMIT_MINUTE = 1;
const RATE_LIMIT_HOUR = 10;

const commentAuthorSelect = {
  ...selectMinimalUser,
} satisfies Prisma.UserSelect;

type CommentRow = Prisma.ProfileCommentGetPayload<{
  include: {
    author: { select: typeof commentAuthorSelect };
    reactions: true;
    replies: {
      include: {
        author: { select: typeof commentAuthorSelect };
        reactions: true;
      };
    };
  };
}>;

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly friends: FriendsService,
    private readonly markdown: MarkdownService,
    private readonly mentions: MentionsService,
    private readonly notifications: NotificationsService,
  ) {}

  async getComments(
    profileUsername: string,
    viewerId: string | null,
    page = 1,
    limit = 20,
    sort: CommentSort = CommentSort.NEWEST,
  ): Promise<ProfileCommentsResponse> {
    const safeLimit = Math.min(Math.max(limit, 1), MAX_COMMENT_PAGE_SIZE);
    const safePage = Math.max(1, page);
    const profile = await this.requireProfileByUsername(profileUsername);

    const cacheKey = cacheKeys.profileComments(profileUsername, safePage, safeLimit, sort);
    const cached = await this.cache.get<ProfileCommentsResponse>(cacheKey);

    if (cached && !viewerId && (cached.data.length > 0 || cached.pinned.length > 0)) {
      return cached;
    }

    const canComment = viewerId
      ? await this.canUserComment(viewerId, profile).catch(() => false)
      : false;

    const orderBy = this.resolveOrderBy(sort);
    const skip = (safePage - 1) * safeLimit;

    const [pinnedRows, total, rows] = await Promise.all([
      this.prisma.profileComment.findMany({
        where: { profileId: profile.id, parentId: null, isPinned: true, isDeleted: false },
        include: this.commentInclude(),
        orderBy: { pinnedAt: 'desc' },
        take: MAX_PINNED_COMMENTS,
      }),
      this.prisma.profileComment.count({
        where: { profileId: profile.id, parentId: null, isPinned: false },
      }),
      this.prisma.profileComment.findMany({
        where: { profileId: profile.id, parentId: null, isPinned: false },
        include: this.commentInclude(),
        orderBy,
        skip,
        take: safeLimit,
      }),
    ]);

    const mentionIds = [
      ...new Set(
        [...pinnedRows, ...rows].flatMap((row) => [
          ...row.mentions,
          ...row.replies.flatMap((reply) => reply.mentions),
          ...row.reactions.map((reaction) => reaction.userId),
          ...row.replies.flatMap((reply) => reply.reactions.map((reaction) => reaction.userId)),
        ]),
      ),
    ];
    const mentionUsers = await this.loadMentionUsers(mentionIds);
    const reactionUsernames = new Map(
      [...mentionUsers.entries()].map(([id, user]) => [id, user.username]),
    );
    const isOwner = viewerId === profile.id;
    const isMod = viewerId
      ? await this.isModerator(viewerId)
      : false;

    const mapOpts = {
      viewerId,
      profileOwnerId: profile.id,
      isOwner,
      isMod,
      mentionUsers,
      reactionUsernames,
    };

    const result: ProfileCommentsResponse = {
      data: rows.map((row) => this.mapComment(row, mapOpts)),
      pinned: pinnedRows.map((row) => this.mapComment(row, mapOpts)),
      pagination: buildPaginatedResult([], total, safePage, safeLimit).pagination,
      commentsEnabled: profile.commentsEnabled,
      commentsForcedReason: profile.commentsEnabled ? null : profile.commentsForcedReason,
      commentPolicy: profile.commentPolicy as ProfileCommentsResponse['commentPolicy'],
      canComment,
    };

    if (!viewerId && (result.data.length > 0 || result.pinned.length > 0)) {
      await this.cache.set(cacheKey, result, CACHE_TTL.PROFILE_COMMENTS);
    }

    return result;
  }

  async createComment(
    authorId: string,
    profileUsername: string,
    dto: CreateCommentDto,
  ): Promise<ProfileComment> {
    const content = dto.content.trim();
    this.assertContent(content);

    const profile = await this.requireProfileByUsername(profileUsername);
    await this.assertCanComment(authorId, profile);
    await this.assertRateLimit(authorId);

    if (dto.parentId) {
      const parent = await this.prisma.profileComment.findUnique({
        where: { id: dto.parentId },
        select: { id: true, profileId: true, parentId: true, isDeleted: true },
      });

      if (!parent || parent.profileId !== profile.id || parent.isDeleted) {
        throw new NotFoundException('Родительский комментарий не найден');
      }

      if (parent.parentId) {
        throw new BadRequestException('Ответы поддерживаются только на один уровень');
      }
    }

    const contentHtml = this.markdown.render(content);
    const mentionIds = await this.mentions.resolveMentionIds(content);

    const created = await this.prisma.profileComment.create({
      data: {
        profileId: profile.id,
        authorId,
        content,
        contentHtml,
        parentId: dto.parentId ?? null,
        mentions: mentionIds,
      },
      include: this.commentInclude(),
    });

    await this.notifyCommentCreated(profile, authorId, created.id, dto.parentId, mentionIds);
    await this.invalidateCommentsCache(profile.username);

    const mentionUsers = await this.loadMentionUsers(mentionIds);
    return this.mapComment(created, {
      viewerId: authorId,
      profileOwnerId: profile.id,
      isOwner: authorId === profile.id,
      isMod: false,
      mentionUsers,
      reactionUsernames: new Map(
        [...mentionUsers.entries()].map(([id, user]) => [id, user.username]),
      ),
    });
  }

  async updateComment(
    userId: string,
    profileUsername: string,
    commentId: string,
    dto: UpdateCommentDto,
  ): Promise<ProfileComment> {
    const content = dto.content.trim();
    this.assertContent(content);

    const profile = await this.requireProfileByUsername(profileUsername);
    const comment = await this.requireCommentOnProfile(commentId, profile.id);

    if (comment.authorId !== userId) {
      throw new ForbiddenException('Редактировать можно только свой комментарий');
    }

    if (comment.isDeleted) {
      throw new BadRequestException('Удалённый комментарий нельзя редактировать');
    }

    const age = Date.now() - comment.createdAt.getTime();
    if (age > COMMENT_EDIT_WINDOW_MS) {
      throw new ForbiddenException('Редактирование доступно только 15 минут после публикации');
    }

    const contentHtml = this.markdown.render(content);
    const mentionIds = await this.mentions.resolveMentionIds(content);

    const updated = await this.prisma.profileComment.update({
      where: { id: commentId },
      data: {
        content,
        contentHtml,
        mentions: mentionIds,
        isEdited: true,
        editedAt: new Date(),
      },
      include: this.commentInclude(),
    });

    await this.invalidateCommentsCache(profile.username);

    const mentionUsers = await this.loadMentionUsers([
      ...mentionIds,
      ...updated.replies.flatMap((r) => r.mentions),
    ]);

    return this.mapComment(updated, {
      viewerId: userId,
      profileOwnerId: profile.id,
      isOwner: userId === profile.id,
      isMod: await this.isModerator(userId),
      mentionUsers,
      reactionUsernames: new Map(
        [...mentionUsers.entries()].map(([id, user]) => [id, user.username]),
      ),
    });
  }

  async deleteComment(
    userId: string,
    roleGroup: RoleGroup,
    profileUsername: string,
    commentId: string,
    reason?: string,
  ): Promise<SuccessResponse> {
    const profile = await this.requireProfileByUsername(profileUsername);
    const comment = await this.requireCommentOnProfile(commentId, profile.id);

    const isAuthor = comment.authorId === userId;
    const isMod = hasRoleGroup(roleGroup, RoleGroup.MODERATOR);

    if (!isAuthor && !isMod) {
      throw new ForbiddenException('Недостаточно прав для удаления');
    }

    if (comment.isDeleted) {
      return { success: true };
    }

    await this.prisma.profileComment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        deletedReason: isMod ? reason?.trim() || null : null,
        content: '',
        contentHtml: '',
      },
    });

    await this.invalidateCommentsCache(profile.username);
    return { success: true };
  }

  async pinComment(
    userId: string,
    profileUsername: string,
    commentId: string,
  ): Promise<ProfileComment> {
    const profile = await this.requireProfileByUsername(profileUsername);

    if (profile.id !== userId) {
      throw new ForbiddenException('Закреплять комментарии может только владелец профиля');
    }

    const comment = await this.requireCommentOnProfile(commentId, profile.id);

    if (comment.parentId) {
      throw new BadRequestException('Ответы нельзя закреплять');
    }

    if (comment.isDeleted) {
      throw new BadRequestException('Удалённый комментарий нельзя закрепить');
    }

    if (!comment.isPinned) {
      const pinnedCount = await this.prisma.profileComment.count({
        where: { profileId: profile.id, isPinned: true, isDeleted: false },
      });

      if (pinnedCount >= MAX_PINNED_COMMENTS) {
        throw new BadRequestException(`Можно закрепить не больше ${MAX_PINNED_COMMENTS} комментариев`);
      }
    }

    const updated = await this.prisma.profileComment.update({
      where: { id: commentId },
      data: {
        isPinned: true,
        pinnedAt: new Date(),
        pinnedBy: userId,
      },
      include: this.commentInclude(),
    });

    await this.invalidateCommentsCache(profile.username);

    const mentionUsers = await this.loadMentionUsers([
      ...updated.mentions,
      ...updated.replies.flatMap((r) => r.mentions),
    ]);

    return this.mapComment(updated, {
      viewerId: userId,
      profileOwnerId: profile.id,
      isOwner: true,
      isMod: false,
      mentionUsers,
      reactionUsernames: new Map(
        [...mentionUsers.entries()].map(([id, user]) => [id, user.username]),
      ),
    });
  }

  async unpinComment(
    userId: string,
    profileUsername: string,
    commentId: string,
  ): Promise<ProfileComment> {
    const profile = await this.requireProfileByUsername(profileUsername);

    if (profile.id !== userId) {
      throw new ForbiddenException('Откреплять комментарии может только владелец профиля');
    }

    await this.requireCommentOnProfile(commentId, profile.id);

    const updated = await this.prisma.profileComment.update({
      where: { id: commentId },
      data: {
        isPinned: false,
        pinnedAt: null,
        pinnedBy: null,
      },
      include: this.commentInclude(),
    });

    await this.invalidateCommentsCache(profile.username);

    const mentionUsers = await this.loadMentionUsers([
      ...updated.mentions,
      ...updated.replies.flatMap((r) => r.mentions),
    ]);

    return this.mapComment(updated, {
      viewerId: userId,
      profileOwnerId: profile.id,
      isOwner: true,
      isMod: false,
      mentionUsers,
      reactionUsernames: new Map(
        [...mentionUsers.entries()].map(([id, user]) => [id, user.username]),
      ),
    });
  }

  async addReaction(
    userId: string,
    profileUsername: string,
    commentId: string,
    emoji: CommentEmoji,
  ): Promise<ProfileComment> {
    this.assertEmoji(emoji);
    const profile = await this.requireProfileByUsername(profileUsername);
    await this.requireCommentOnProfile(commentId, profile.id);

    const existing = await this.prisma.commentReaction.findFirst({
      where: { commentId, userId },
    });

    if (existing && existing.emoji === emoji) {
      await this.prisma.commentReaction.delete({ where: { id: existing.id } });
    } else if (existing) {
      await this.prisma.commentReaction.update({
        where: { id: existing.id },
        data: { emoji },
      });
    } else {
      await this.prisma.commentReaction.create({
        data: { commentId, userId, emoji },
      });
    }

    await this.invalidateCommentsCache(profile.username);
    return this.getMappedComment(commentId, profile, userId);
  }

  async removeReaction(
    userId: string,
    profileUsername: string,
    commentId: string,
    emoji: string,
  ): Promise<ProfileComment> {
    this.assertEmoji(emoji);
    const profile = await this.requireProfileByUsername(profileUsername);
    await this.requireCommentOnProfile(commentId, profile.id);

    await this.prisma.commentReaction.deleteMany({
      where: { commentId, userId, emoji },
    });

    await this.invalidateCommentsCache(profile.username);
    return this.getMappedComment(commentId, profile, userId);
  }

  async reportComment(
    userId: string,
    profileUsername: string,
    commentId: string,
    dto: ReportCommentDto,
  ): Promise<SuccessResponse> {
    const profile = await this.requireProfileByUsername(profileUsername);
    const comment = await this.requireCommentOnProfile(commentId, profile.id);

    if (comment.authorId === userId) {
      throw new BadRequestException('Нельзя пожаловаться на свой комментарий');
    }

    const existing = await this.prisma.commentReport.findUnique({
      where: { commentId_reporterId: { commentId, reporterId: userId } },
    });

    if (existing?.status === CommentReportStatus.PENDING) {
      throw new BadRequestException('Вы уже отправили жалобу на этот комментарий');
    }

    if (existing) {
      await this.prisma.commentReport.update({
        where: { id: existing.id },
        data: {
          reason: dto.reason as CommentReportReason,
          description: dto.description?.trim() || null,
          status: CommentReportStatus.PENDING,
          reviewedBy: null,
          reviewedAt: null,
          reviewNote: null,
        },
      });
    } else {
      await this.prisma.commentReport.create({
        data: {
          commentId,
          reporterId: userId,
          reason: dto.reason as CommentReportReason,
          description: dto.description?.trim() || null,
        },
      });
    }

    return { success: true };
  }

  async forceDisableComments(
    adminId: string,
    targetUserId: string,
    dto: ForceDisableCommentsDto,
  ): Promise<SuccessResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        commentsEnabled: false,
        commentsForcedDisabledBy: adminId,
        commentsForcedReason: dto.reason.trim(),
      },
    });

    await this.invalidateCommentsCache(user.username);
    await this.cache.del([cacheKeys.userProfile(user.username), cacheKeys.userById(user.id)]);

    return { success: true };
  }

  async forceEnableComments(adminId: string, targetUserId: string): Promise<SuccessResponse> {
    void adminId;
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        commentsEnabled: true,
        commentsForcedDisabledBy: null,
        commentsForcedReason: null,
      },
    });

    await this.invalidateCommentsCache(user.username);
    await this.cache.del([cacheKeys.userProfile(user.username), cacheKeys.userById(user.id)]);

    return { success: true };
  }

  async listCommentReports(
    status?: CommentReportStatus,
    page = 1,
    limit = 20,
  ): Promise<{ data: CommentReport[]; pagination: ReturnType<typeof buildPaginatedResult>['pagination'] }> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(1, page);
    const where = status ? { status } : {};

    const [total, rows] = await Promise.all([
      this.prisma.commentReport.count({ where }),
      this.prisma.commentReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        include: {
          comment: {
            select: {
              id: true,
              content: true,
              isDeleted: true,
              author: { select: { id: true, username: true } },
              profile: { select: { id: true, username: true } },
            },
          },
        },
      }),
    ]);

    const reporterIds = [...new Set(rows.map((r) => r.reporterId))];
    const reporters = await this.prisma.user.findMany({
      where: { id: { in: reporterIds } },
      select: selectMinimalUser,
    });
    const reporterMap = new Map(reporters.map((r) => [r.id, r]));

    const data: CommentReport[] = rows.map((row) => {
      const reporter = reporterMap.get(row.reporterId);
      return {
        id: row.id,
        reason: row.reason as CommentReport['reason'],
        description: row.description,
        status: row.status as CommentReport['status'],
        reviewNote: row.reviewNote,
        createdAt: row.createdAt.toISOString(),
        comment: {
          id: row.comment.id,
          content: row.comment.isDeleted ? 'Комментарий удалён' : row.comment.content,
          isDeleted: row.comment.isDeleted,
          author: row.comment.author,
          profile: row.comment.profile,
        },
        reporter: {
          id: row.reporterId,
          username: reporter?.username ?? 'unknown',
          position: reporter
            ? toPublicPosition(reporter.position)
            : {
                id: '',
                name: 'Игрок',
                slug: 'default',
                displayName: 'Игрок',
                group: 'PLAYER',
                color: '#94a3b8',
                backgroundColor: null,
                icon: null,
                priority: 0,
              },
        },
      };
    });

    return buildPaginatedResult(data, total, safePage, safeLimit);
  }

  async reviewCommentReport(
    reportId: string,
    reviewerId: string,
    dto: ReviewCommentReportDto,
  ): Promise<CommentReport> {
    const report = await this.prisma.commentReport.findUnique({
      where: { id: reportId },
      include: {
        comment: {
          select: {
            id: true,
            content: true,
            isDeleted: true,
            profileId: true,
            author: { select: { id: true, username: true } },
            profile: { select: { id: true, username: true } },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Жалоба не найдена');
    }

    const updated = await this.prisma.commentReport.update({
      where: { id: reportId },
      data: {
        status: dto.status as CommentReportStatus,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNote: dto.reviewNote?.trim() || null,
      },
    });

    if (dto.status === 'RESOLVED' && !report.comment.isDeleted) {
      await this.prisma.profileComment.update({
        where: { id: report.comment.id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: reviewerId,
          deletedReason: 'Жалоба одобрена модерацией',
          content: '',
          contentHtml: '',
        },
      });
      await this.invalidateCommentsCache(report.comment.profile.username);
    }

    const [mapped] = (
      await this.listCommentReports(undefined, 1, 100)
    ).data.filter((item) => item.id === updated.id);

    if (!mapped) {
      throw new NotFoundException('Жалоба не найдена');
    }

    return mapped;
  }

  async hardDeleteComment(commentId: string): Promise<SuccessResponse> {
    const comment = await this.prisma.profileComment.findUnique({
      where: { id: commentId },
      include: { profile: { select: { username: true } } },
    });

    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    await this.prisma.profileComment.delete({ where: { id: commentId } });
    await this.invalidateCommentsCache(comment.profile.username);
    return { success: true };
  }

  private commentInclude() {
    return {
      author: { select: commentAuthorSelect },
      reactions: true,
      replies: {
        where: {},
        include: {
          author: { select: commentAuthorSelect },
          reactions: true,
        },
        orderBy: { createdAt: 'asc' as const },
        take: 50,
      },
    };
  }

  private resolveOrderBy(sort: CommentSort): Prisma.ProfileCommentOrderByWithRelationInput {
    if (sort === CommentSort.OLDEST) {
      return { createdAt: 'asc' };
    }

    if (sort === CommentSort.POPULAR) {
      return { reactions: { _count: 'desc' } };
    }

    return { createdAt: 'desc' };
  }

  private assertContent(content: string) {
    if (!content) {
      throw new BadRequestException('Комментарий не может быть пустым');
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      throw new BadRequestException(`Максимум ${MAX_COMMENT_LENGTH} символов`);
    }
  }

  private assertEmoji(emoji: string): asserts emoji is CommentEmoji {
    if (!(COMMENT_EMOJIS as readonly string[]).includes(emoji)) {
      throw new BadRequestException('Недопустимая реакция');
    }
  }

  private async requireProfileByUsername(username: string) {
    const profile = await findUserByIdentifier(this.prisma, username, {
      select: {
        id: true,
        username: true,
        commentPolicy: true,
        commentsEnabled: true,
        commentsForcedReason: true,
        notifyOnComment: true,
        notifyOnMention: true,
        notifyOnReply: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Пользователь не найден');
    }

    return profile;
  }

  private async requireCommentOnProfile(commentId: string, profileId: string) {
    const comment = await this.prisma.profileComment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.profileId !== profileId) {
      throw new NotFoundException('Комментарий не найден');
    }

    return comment;
  }

  private async canUserComment(
    authorId: string,
    profile: {
      id: string;
      commentsEnabled: boolean;
      commentPolicy: CommentPolicy;
    },
  ): Promise<boolean> {
    try {
      await this.assertCanComment(authorId, profile);
      return true;
    } catch {
      return false;
    }
  }

  private async assertCanComment(
    authorId: string,
    profile: {
      id: string;
      commentsEnabled: boolean;
      commentPolicy: CommentPolicy;
    },
  ) {
    if (!profile.commentsEnabled) {
      throw new ForbiddenException('Комментарии отключены администратором');
    }

    if (authorId === profile.id) {
      return;
    }

    switch (profile.commentPolicy) {
      case CommentPolicy.NOBODY:
        throw new ForbiddenException('Владелец профиля отключил комментарии');
      case CommentPolicy.FRIENDS: {
        if (!(await this.friends.areFriends(authorId, profile.id))) {
          throw new ForbiddenException('Комментарии доступны только друзьям');
        }
        break;
      }
      case CommentPolicy.FRIENDS_OF_FRIENDS: {
        if (!(await this.friends.areFriendsOfFriends(authorId, profile.id))) {
          throw new ForbiddenException('Комментарии доступны друзьям и друзьям друзей');
        }
        break;
      }
      case CommentPolicy.EVERYONE:
      default:
        break;
    }
  }

  private async assertRateLimit(authorId: string) {
    const minuteKey = `comments:rl:minute:${authorId}`;
    const hourKey = `comments:rl:hour:${authorId}`;

    const minuteCount = (await this.cache.get<number>(minuteKey)) ?? 0;
    if (minuteCount >= RATE_LIMIT_MINUTE) {
      throw new BadRequestException('Слишком часто. Подождите минуту перед следующим комментарием');
    }

    const hourCount = (await this.cache.get<number>(hourKey)) ?? 0;
    if (hourCount >= RATE_LIMIT_HOUR) {
      throw new BadRequestException('Лимит: 10 комментариев в час');
    }

    await this.cache.set(minuteKey, minuteCount + 1, 60);
    await this.cache.set(hourKey, hourCount + 1, 3600);
  }

  private async notifyCommentCreated(
    profile: {
      id: string;
      username: string;
      notifyOnComment: boolean;
      notifyOnMention: boolean;
      notifyOnReply: boolean;
    },
    authorId: string,
    commentId: string,
    parentId: string | undefined,
    mentionIds: string[],
  ) {
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { username: true },
    });
    const authorName = author?.username ?? 'Пользователь';
    const profileLink = `/users/${profile.username}`;

    if (profile.notifyOnComment && profile.id !== authorId) {
      await this.notifications.createNotification({
        userId: profile.id,
        type: NotificationType.COMMENT_ON_PROFILE,
        title: 'Новый комментарий',
        message: `${authorName} оставил(а) комментарий на вашем профиле`,
        link: profileLink,
        fromUserId: authorId,
        groupKey: `profile_${profile.id}_comments`,
        metadata: { commentId, profileId: profile.id, actors: [authorName], count: 1 },
      });
    }

    if (parentId) {
      const parent = await this.prisma.profileComment.findUnique({
        where: { id: parentId },
        select: { authorId: true },
      });

      if (parent && parent.authorId !== authorId) {
        const parentAuthor = await this.prisma.user.findUnique({
          where: { id: parent.authorId },
          select: { notifyOnReply: true, username: true },
        });

        if (parentAuthor?.notifyOnReply) {
          await this.notifications.createNotification({
            userId: parent.authorId,
            type: NotificationType.COMMENT_REPLY,
            title: 'Ответ на комментарий',
            message: `${authorName} ответил(а) на ваш комментарий`,
            link: profileLink,
            fromUserId: authorId,
            metadata: { commentId, parentId, profileId: profile.id },
          });
        }
      }
    }

    if (mentionIds.length > 0) {
      const mentioned = await this.prisma.user.findMany({
        where: {
          id: { in: mentionIds.filter((id) => id !== authorId) },
          notifyOnMention: true,
        },
        select: { id: true, username: true },
      });

      await Promise.all(
        mentioned.map((user) =>
          this.notifications.createNotification({
            userId: user.id,
            type: NotificationType.COMMENT_MENTION,
            title: 'Вас упомянули',
            message: `${authorName} упомянул(а) вас в комментарии`,
            link: profileLink,
            fromUserId: authorId,
            metadata: { commentId, profileId: profile.id },
          }),
        ),
      );
    }
  }

  private async invalidateCommentsCache(username: string) {
    await this.cache.delPattern(cacheKeys.profileCommentsPattern(username));
    await this.cache.del(cacheKeys.userProfile(username));
  }

  private async isModerator(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roleGroup: true },
    });

    return user ? hasRoleGroup(user.roleGroup, RoleGroup.MODERATOR) : false;
  }

  private async loadMentionUsers(ids: string[]) {
    if (ids.length === 0) {
      return new Map<string, { id: string; username: string; position: ReturnType<typeof toPublicPosition> }>();
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: [...new Set(ids)] } },
      select: {
        id: true,
        username: true,
        position: { select: selectMinimalUser.position.select },
      },
    });

    return new Map(
      users.map((user) => [
        user.id,
        {
          id: user.id,
          username: user.username,
          position: toPublicPosition(user.position),
        },
      ]),
    );
  }

  private async getMappedComment(
    commentId: string,
    profile: { id: string; username: string },
    viewerId: string,
  ): Promise<ProfileComment> {
    const row = await this.prisma.profileComment.findUnique({
      where: { id: commentId },
      include: this.commentInclude(),
    });

    if (!row) {
      throw new NotFoundException('Комментарий не найден');
    }

    const mentionUsers = await this.loadMentionUsers([
      ...row.mentions,
      ...row.replies.flatMap((r) => r.mentions),
      ...row.reactions.map((r) => r.userId),
      ...row.replies.flatMap((r) => r.reactions.map((reaction) => reaction.userId)),
    ]);

    return this.mapComment(row, {
      viewerId,
      profileOwnerId: profile.id,
      isOwner: viewerId === profile.id,
      isMod: await this.isModerator(viewerId),
      mentionUsers,
      reactionUsernames: new Map(
        [...mentionUsers.entries()].map(([id, user]) => [id, user.username]),
      ),
    });
  }

  private mapComment(
    row: CommentRow | (Omit<CommentRow, 'replies'> & { replies?: CommentRow['replies'] }),
    opts: {
      viewerId: string | null;
      profileOwnerId: string;
      isOwner: boolean;
      isMod: boolean;
      mentionUsers: Map<
        string,
        { id: string; username: string; position: ReturnType<typeof toPublicPosition> }
      >;
      reactionUsernames: Map<string, string>;
    },
  ): ProfileComment {
    const isDeleted = row.isDeleted;
    const replies = ('replies' in row && row.replies ? row.replies : []).map((reply) =>
      this.mapComment({ ...reply, replies: [] }, opts),
    );

    return {
      id: row.id,
      profileId: row.profileId,
      author: {
        id: row.author.id,
        username: row.author.username,
        avatar: row.author.avatar,
        position: toPublicPosition(row.author.position),
        badges: row.author.badges.filter((b) => b.isActive).map(toUserBadge),
      },
      content: isDeleted ? '' : row.content,
      contentHtml: isDeleted ? '<p>Комментарий удалён</p>' : row.contentHtml,
      parentId: row.parentId,
      isPinned: row.isPinned,
      pinnedAt: row.pinnedAt?.toISOString() ?? null,
      pinnedBy: row.pinnedBy,
      isEdited: row.isEdited,
      editedAt: row.editedAt?.toISOString() ?? null,
      isDeleted,
      mentions: row.mentions
        .map((id) => opts.mentionUsers.get(id))
        .filter((m): m is NonNullable<typeof m> => Boolean(m)),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      reactions: this.mapReactions(row.reactions, opts.viewerId, opts.reactionUsernames),
      replies,
      canEdit:
        Boolean(opts.viewerId) &&
        opts.viewerId === row.authorId &&
        !isDeleted &&
        Date.now() - row.createdAt.getTime() <= COMMENT_EDIT_WINDOW_MS,
      canDelete:
        Boolean(opts.viewerId) &&
        (opts.viewerId === row.authorId || opts.isMod) &&
        !isDeleted,
      canPin: opts.isOwner && !row.parentId && !isDeleted,
    };
  }

  private mapReactions(
    reactions: Array<{ userId: string; emoji: string }>,
    viewerId: string | null,
    usernames: Map<string, string>,
  ): ProfileComment['reactions'] {
    const grouped = new Map<string, { count: number; reacted: boolean; users: string[] }>();

    for (const reaction of reactions) {
      if (!(COMMENT_EMOJIS as readonly string[]).includes(reaction.emoji)) {
        continue;
      }

      const entry = grouped.get(reaction.emoji) ?? { count: 0, reacted: false, users: [] };
      entry.count += 1;
      if (entry.users.length < 5) {
        entry.users.push(reaction.userId);
      }
      if (viewerId && reaction.userId === viewerId) {
        entry.reacted = true;
      }
      grouped.set(reaction.emoji, entry);
    }

    return [...grouped.entries()].map(([emoji, entry]) => ({
      emoji: emoji as CommentEmoji,
      count: entry.count,
      reacted: entry.reacted,
      users: entry.users.map((id) => ({
        id,
        username: usernames.get(id) ?? 'игрок',
      })),
    }));
  }
}
