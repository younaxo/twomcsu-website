import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NewsStatus, NotificationType, Prisma } from '@prisma/client';
import {
  COMMENT_EMOJIS,
  CommentEmoji,
  NewsComment,
  NewsCommentSort,
  NEWS_COMMENT_EDIT_WINDOW_MS,
  RoleGroup,
  hasRoleGroup,
} from '@twomc/shared';
import {
  buildPaginatedResult,
  normalizePagination,
  PaginatedResult,
} from '../../common/pagination';
import { selectMinimalUser } from '../../common/prisma/user-selects';
import { MarkdownService } from '../comments/markdown.service';
import { MentionsService } from '../comments/mentions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateNewsCommentDto,
  ListNewsCommentsQueryDto,
  UpdateNewsCommentDto,
} from './dto/news.dto';
import { toNewsComment } from './news.mapper';

const commentAuthorInclude = {
  author: { select: selectMinimalUser },
  reactions: {
    include: { user: { select: { id: true, username: true } } },
  },
} satisfies Prisma.NewsCommentInclude;

@Injectable()
export class NewsCommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly markdown: MarkdownService,
    private readonly mentions: MentionsService,
    private readonly notifications: NotificationsService,
  ) {}

  async list(
    slug: string,
    query: ListNewsCommentsQueryDto,
    viewerId: string | null,
    viewerRole: RoleGroup | null,
  ): Promise<PaginatedResult<NewsComment>> {
    const news = await this.requirePublishedNews(slug);
    const { page, limit, skip } = normalizePagination(query);
    const sort = query.sort ?? NewsCommentSort.NEWEST;
    const canModerate =
      viewerRole != null && hasRoleGroup(viewerRole, RoleGroup.MODERATOR);

    const where: Prisma.NewsCommentWhereInput = {
      newsId: news.id,
      parentId: null,
    };

    const orderBy = this.sortOrder(sort);

    const [rows, total] = await Promise.all([
      this.prisma.newsComment.findMany({
        where,
        include: {
          ...commentAuthorInclude,
          replies: {
            where: { parentId: { not: null } },
            include: commentAuthorInclude,
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.newsComment.count({ where }),
    ]);

    // For most_liked, sort by reaction count in memory for top-level
    let ordered = rows;
    if (sort === NewsCommentSort.MOST_LIKED) {
      ordered = [...rows].sort((a, b) => b.reactions.length - a.reactions.length);
    }

    return buildPaginatedResult(
      ordered.map((row) => toNewsComment(row, viewerId, canModerate)),
      total,
      page,
      limit,
    );
  }

  async create(
    slug: string,
    dto: CreateNewsCommentDto,
    authorId: string,
  ): Promise<NewsComment> {
    const news = await this.requirePublishedNews(slug);

    if (!news.allowComments) {
      throw new ForbiddenException('Комментарии к этой новости отключены');
    }

    let parentId: string | null = null;
    let parentAuthorId: string | null = null;

    if (dto.parentId) {
      const parent = await this.prisma.newsComment.findFirst({
        where: { id: dto.parentId, newsId: news.id, isDeleted: false },
      });
      if (!parent) {
        throw new NotFoundException('Родительский комментарий не найден');
      }
      if (parent.parentId) {
        throw new BadRequestException('Ответы разрешены только на один уровень');
      }
      parentId = parent.id;
      parentAuthorId = parent.authorId;
    }

    const contentHtml = this.markdown.render(dto.content);

    const row = await this.prisma.$transaction(async (tx) => {
      const created = await tx.newsComment.create({
        data: {
          newsId: news.id,
          authorId,
          content: dto.content.trim(),
          contentHtml,
          parentId,
        },
        include: {
          ...commentAuthorInclude,
          replies: { include: commentAuthorInclude },
        },
      });

      await tx.news.update({
        where: { id: news.id },
        data: { commentsCount: { increment: 1 } },
      });

      return created;
    });

    if (parentAuthorId && parentAuthorId !== authorId) {
      await this.notifications.createNotification({
        userId: parentAuthorId,
        type: NotificationType.NEWS_COMMENT_REPLY,
        title: 'Ответ на комментарий',
        message: dto.content.trim().slice(0, 120),
        link: `/news/${slug}#comment-${row.id}`,
        fromUserId: authorId,
        metadata: { newsId: news.id, commentId: row.id },
      });
    }

    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
      select: { username: true },
    });

    await this.mentions.notifyMentions({
      content: dto.content,
      authorId,
      type: NotificationType.NEWS_COMMENT_MENTION,
      title: 'Вас упомянули',
      message: `${author?.username ?? 'Игрок'} упомянул(а) вас в комментарии к новости`,
      link: `/news/${slug}#comment-${row.id}`,
      metadata: { newsId: news.id, commentId: row.id },
      excludeUserIds: parentAuthorId ? [parentAuthorId] : [],
    });

    return toNewsComment(row, authorId, false);
  }

  async update(
    slug: string,
    commentId: string,
    dto: UpdateNewsCommentDto,
    userId: string,
  ): Promise<NewsComment> {
    const news = await this.requirePublishedNews(slug);
    const comment = await this.prisma.newsComment.findFirst({
      where: { id: commentId, newsId: news.id },
    });

    if (!comment || comment.isDeleted) {
      throw new NotFoundException('Комментарий не найден');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('Можно редактировать только свои комментарии');
    }

    if (Date.now() - comment.createdAt.getTime() > NEWS_COMMENT_EDIT_WINDOW_MS) {
      throw new ForbiddenException('Время редактирования истекло (15 минут)');
    }

    const contentHtml = this.markdown.render(dto.content);
    const row = await this.prisma.newsComment.update({
      where: { id: commentId },
      data: {
        content: dto.content.trim(),
        contentHtml,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        ...commentAuthorInclude,
        replies: { include: commentAuthorInclude },
      },
    });

    return toNewsComment(row, userId, false);
  }

  async remove(
    slug: string,
    commentId: string,
    userId: string,
    roleGroup: RoleGroup,
  ): Promise<void> {
    const news = await this.requirePublishedNews(slug);
    const comment = await this.prisma.newsComment.findFirst({
      where: { id: commentId, newsId: news.id },
    });

    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    const canModerate = hasRoleGroup(roleGroup, RoleGroup.MODERATOR);
    const isAuthor = comment.authorId === userId;

    if (!isAuthor && !canModerate) {
      throw new ForbiddenException('Недостаточно прав');
    }

    if (canModerate && !isAuthor) {
      await this.prisma.$transaction([
        this.prisma.newsCommentReaction.deleteMany({ where: { commentId } }),
        this.prisma.newsComment.deleteMany({ where: { parentId: commentId } }),
        this.prisma.newsComment.delete({ where: { id: commentId } }),
        this.prisma.news.update({
          where: { id: news.id },
          data: { commentsCount: { decrement: 1 } },
        }),
      ]);
      return;
    }

    if (comment.isDeleted) {
      return;
    }

    await this.prisma.newsComment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        content: '',
        contentHtml: '<p>Комментарий удалён</p>',
      },
    });
  }

  async toggleReaction(
    slug: string,
    commentId: string,
    userId: string,
    emoji: CommentEmoji,
  ): Promise<NewsComment> {
    if (!COMMENT_EMOJIS.includes(emoji)) {
      throw new BadRequestException('Недопустимая реакция');
    }

    const news = await this.requirePublishedNews(slug);
    const comment = await this.prisma.newsComment.findFirst({
      where: { id: commentId, newsId: news.id, isDeleted: false },
    });

    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    const existing = await this.prisma.newsCommentReaction.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      if (existing.emoji === emoji) {
        await this.prisma.newsCommentReaction.delete({ where: { id: existing.id } });
      } else {
        await this.prisma.newsCommentReaction.update({
          where: { id: existing.id },
          data: { emoji },
        });
      }
    } else {
      await this.prisma.newsCommentReaction.create({
        data: { commentId, userId, emoji },
      });
    }

    const row = await this.prisma.newsComment.findUniqueOrThrow({
      where: { id: commentId },
      include: {
        ...commentAuthorInclude,
        replies: { include: commentAuthorInclude },
      },
    });

    return toNewsComment(row, userId, false);
  }

  async pin(commentId: string, pinned: boolean): Promise<NewsComment> {
    const comment = await this.prisma.newsComment.findUnique({
      where: { id: commentId },
      include: {
        ...commentAuthorInclude,
        replies: { include: commentAuthorInclude },
      },
    });

    if (!comment || comment.parentId) {
      throw new NotFoundException('Комментарий не найден');
    }

    const row = await this.prisma.newsComment.update({
      where: { id: commentId },
      data: { isPinned: pinned },
      include: {
        ...commentAuthorInclude,
        replies: { include: commentAuthorInclude },
      },
    });

    return toNewsComment(row, null, true);
  }

  async moderateDelete(commentId: string, moderatorId: string): Promise<void> {
    const comment = await this.prisma.newsComment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    await this.prisma.$transaction([
      this.prisma.newsCommentReaction.deleteMany({ where: { commentId } }),
      this.prisma.newsComment.deleteMany({ where: { parentId: commentId } }),
      this.prisma.newsComment.delete({ where: { id: commentId } }),
      this.prisma.news.update({
        where: { id: comment.newsId },
        data: { commentsCount: { decrement: 1 } },
      }),
    ]);

    void moderatorId;
  }

  private async requirePublishedNews(slug: string) {
    const news = await this.prisma.news.findUnique({ where: { slug } });
    if (!news || news.status !== NewsStatus.PUBLISHED) {
      throw new NotFoundException('Новость не найдена');
    }
    return news;
  }

  private sortOrder(sort: NewsCommentSort): Prisma.NewsCommentOrderByWithRelationInput[] {
    switch (sort) {
      case NewsCommentSort.OLDEST:
        return [{ isPinned: 'desc' }, { createdAt: 'asc' }];
      case NewsCommentSort.MOST_LIKED:
        return [{ isPinned: 'desc' }, { createdAt: 'desc' }];
      case NewsCommentSort.NEWEST:
      default:
        return [{ isPinned: 'desc' }, { createdAt: 'desc' }];
    }
  }
}
