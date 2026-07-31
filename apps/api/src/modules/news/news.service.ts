import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NewsCategory, NewsStatus, NotificationType, Prisma } from '@prisma/client';
import {
  NewsAdminItem,
  NewsCategoryCount,
  NewsDetails,
  NewsSort,
  NewsStats,
  NewsSummary,
  NewsTagCount,
} from '@twomc/shared';
import { Feed } from 'feed';
import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  assertSearchLength,
  buildPaginatedResult,
  normalizePagination,
  PaginatedResult,
} from '../../common/pagination';
import { selectMinimalUser } from '../../common/prisma/user-selects';
import { ActivityService } from '../activity/activity.service';
import { MarkdownService } from '../comments/markdown.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ALLOWED_IMAGE_MIME_TYPES, UPLOADS_ROUTE } from '../uploads/upload.constants';
import { UploadsService } from '../uploads/uploads.service';
import {
  AdminListNewsQueryDto,
  CreateNewsDto,
  ListNewsQueryDto,
  UpdateNewsDto,
} from './dto/news.dto';
import { toNewsAdminItem, toNewsDetails, toNewsSummary } from './news.mapper';
import { slugifyTitle } from './news-slug.util';

const newsAuthorInclude = {
  author: { select: selectMinimalUser },
  tags: true,
} satisfies Prisma.NewsInclude;

const NEWS_IMAGE_MAX = 5 * 1024 * 1024;
const NEWS_IMAGE_WIDTH = 1920;

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private publishing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly markdown: MarkdownService,
    private readonly uploads: UploadsService,
    private readonly notifications: NotificationsService,
    @Optional()
    @Inject(forwardRef(() => ActivityService))
    private readonly activity?: ActivityService,
  ) {}

  async listPublic(query: ListNewsQueryDto, viewerId?: string | null): Promise<PaginatedResult<NewsSummary>> {
    const { page, limit, skip } = normalizePagination(query);
    const search = assertSearchLength(query.search);
    const sort = query.sort ?? NewsSort.NEWEST;

    const where: Prisma.NewsWhereInput = {
      status: NewsStatus.PUBLISHED,
      ...(query.category ? { category: query.category as NewsCategory } : {}),
      ...(query.featured ? { isFeatured: true } : {}),
      ...(query.tag
        ? { tags: { some: { tag: { equals: query.tag, mode: 'insensitive' } } } }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { excerpt: { contains: search, mode: 'insensitive' } },
              { content: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy = this.sortOrder(sort);

    const [rows, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        include: newsAuthorInclude,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.news.count({ where }),
    ]);

    const likedSet = await this.likedNewsIds(
      viewerId ?? null,
      rows.map((r) => r.id),
    );

    return buildPaginatedResult(
      rows.map((row) => toNewsSummary(row, likedSet.has(row.id))),
      total,
      page,
      limit,
    );
  }

  async featured(limit = 5, viewerId?: string | null): Promise<NewsSummary[]> {
    const rows = await this.prisma.news.findMany({
      where: { status: NewsStatus.PUBLISHED, isFeatured: true },
      include: newsAuthorInclude,
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      take: Math.min(5, Math.max(1, limit)),
    });

    const likedSet = await this.likedNewsIds(
      viewerId ?? null,
      rows.map((r) => r.id),
    );

    return rows.map((row) => toNewsSummary(row, likedSet.has(row.id)));
  }

  async latest(limit = 5, viewerId?: string | null): Promise<NewsSummary[]> {
    const take = Math.min(20, Math.max(1, limit));
    const rows = await this.prisma.news.findMany({
      where: { status: NewsStatus.PUBLISHED },
      include: newsAuthorInclude,
      orderBy: [{ publishedAt: 'desc' }],
      take,
    });

    const likedSet = await this.likedNewsIds(
      viewerId ?? null,
      rows.map((r) => r.id),
    );

    return rows.map((row) => toNewsSummary(row, likedSet.has(row.id)));
  }

  async popular(viewerId?: string | null): Promise<NewsSummary[]> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.news.findMany({
      where: {
        status: NewsStatus.PUBLISHED,
        publishedAt: { gte: since },
      },
      include: newsAuthorInclude,
      orderBy: [{ viewsCount: 'desc' }, { publishedAt: 'desc' }],
      take: 10,
    });

    const likedSet = await this.likedNewsIds(
      viewerId ?? null,
      rows.map((r) => r.id),
    );

    return rows.map((row) => toNewsSummary(row, likedSet.has(row.id)));
  }

  async categories(): Promise<NewsCategoryCount[]> {
    const groups = await this.prisma.news.groupBy({
      by: ['category'],
      where: { status: NewsStatus.PUBLISHED },
      _count: { _all: true },
    });

    return groups.map((g) => ({
      category: g.category as NewsCategoryCount['category'],
      count: g._count._all,
    }));
  }

  async tags(limit = 20): Promise<NewsTagCount[]> {
    const take = Math.min(50, Math.max(1, limit));
    const rows = await this.prisma.newsTag.groupBy({
      by: ['tag'],
      _count: { _all: true },
      orderBy: { _count: { tag: 'desc' } },
      take,
      where: { news: { status: NewsStatus.PUBLISHED } },
    });

    return rows.map((r) => ({ tag: r.tag, count: r._count._all }));
  }

  async getBySlug(
    slug: string,
    viewerId: string | null,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<NewsDetails> {
    const row = await this.prisma.news.findUnique({
      where: { slug },
      include: newsAuthorInclude,
    });

    if (!row || row.status !== NewsStatus.PUBLISHED) {
      throw new NotFoundException('Новость не найдена');
    }

    await this.recordView(row.id, viewerId, ipAddress, userAgent);

    const refreshed = await this.prisma.news.findUniqueOrThrow({
      where: { id: row.id },
      include: newsAuthorInclude,
    });

    const liked =
      viewerId != null
        ? Boolean(
            await this.prisma.newsLike.findUnique({
              where: { newsId_userId: { newsId: row.id, userId: viewerId } },
            }),
          )
        : false;

    return toNewsDetails(refreshed, liked);
  }

  async toggleLike(newsId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const news = await this.prisma.news.findFirst({
      where: { id: newsId, status: NewsStatus.PUBLISHED },
    });

    if (!news) {
      throw new NotFoundException('Новость не найдена');
    }

    const existing = await this.prisma.newsLike.findUnique({
      where: { newsId_userId: { newsId, userId } },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.newsLike.delete({ where: { id: existing.id } }),
        this.prisma.news.update({
          where: { id: newsId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);

      const updated = await this.prisma.news.findUniqueOrThrow({ where: { id: newsId } });
      return { liked: false, likesCount: Math.max(0, updated.likesCount) };
    }

    await this.prisma.$transaction([
      this.prisma.newsLike.create({ data: { newsId, userId } }),
      this.prisma.news.update({
        where: { id: newsId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    const updated = await this.prisma.news.findUniqueOrThrow({ where: { id: newsId } });
    return { liked: true, likesCount: updated.likesCount };
  }

  async listAdmin(query: AdminListNewsQueryDto): Promise<PaginatedResult<NewsAdminItem>> {
    const { page, limit, skip } = normalizePagination(query);
    const search = assertSearchLength(query.search);

    const where: Prisma.NewsWhereInput = {
      ...(query.status ? { status: query.status as NewsStatus } : {}),
      ...(query.category ? { category: query.category as NewsCategory } : {}),
      ...(query.author
        ? { author: { username: { equals: query.author, mode: 'insensitive' } } }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.news.findMany({
        where,
        include: newsAuthorInclude,
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.news.count({ where }),
    ]);

    return buildPaginatedResult(rows.map(toNewsAdminItem), total, page, limit);
  }

  async getAdminById(id: string): Promise<NewsAdminItem> {
    const row = await this.prisma.news.findUnique({
      where: { id },
      include: newsAuthorInclude,
    });

    if (!row) {
      throw new NotFoundException('Новость не найдена');
    }

    return toNewsAdminItem(row);
  }

  async create(dto: CreateNewsDto, authorId: string): Promise<NewsAdminItem> {
    const status = (dto.status as NewsStatus) ?? NewsStatus.DRAFT;
    this.assertSchedule(status, dto.scheduledFor);

    const slug = await this.ensureUniqueSlug(dto.slug?.trim() || slugifyTitle(dto.title));
    const contentHtml = this.markdown.render(dto.content);
    const { publishedAt, scheduledFor } = this.resolvePublishDates(status, dto.scheduledFor);

    try {
      const row = await this.prisma.news.create({
        data: {
          title: dto.title.trim(),
          slug,
          excerpt: dto.excerpt?.trim() || null,
          content: dto.content,
          contentHtml,
          coverImage: dto.coverImage?.trim() || null,
          category: dto.category as NewsCategory,
          status,
          authorId,
          metaTitle: dto.metaTitle?.trim() || null,
          metaDescription: dto.metaDescription?.trim() || null,
          metaKeywords: dto.metaKeywords ?? [],
          ogImage: dto.ogImage?.trim() || null,
          allowComments: dto.allowComments ?? true,
          isPinned: dto.isPinned ?? false,
          isFeatured: dto.isFeatured ?? false,
          publishedAt,
          scheduledFor,
          tags: dto.tags?.length
            ? {
                create: [...new Set(dto.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))].map(
                  (tag) => ({ tag }),
                ),
              }
            : undefined,
        },
        include: newsAuthorInclude,
      });

      if (status === NewsStatus.PUBLISHED) {
        await this.notifyPublished(row.id, row.title, row.slug, authorId);
        void this.activity
          ?.recordNewsPost(authorId, {
            id: row.id,
            title: row.title,
            slug: row.slug,
            coverImage: row.coverImage,
          })
          .catch(() => undefined);
      }

      return toNewsAdminItem(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Новость с таким slug уже существует');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateNewsDto, actorId: string): Promise<NewsAdminItem> {
    const existing = await this.requireNews(id);

    const nextStatus = (dto.status as NewsStatus | undefined) ?? existing.status;
    if (dto.status !== undefined || dto.scheduledFor !== undefined) {
      this.assertSchedule(
        nextStatus,
        dto.scheduledFor !== undefined ? dto.scheduledFor : existing.scheduledFor?.toISOString(),
      );
    }

    const contentHtml =
      dto.content !== undefined ? this.markdown.render(dto.content) : undefined;

    let publishedAt = existing.publishedAt;
    let scheduledFor = existing.scheduledFor;

    if (dto.status !== undefined || dto.scheduledFor !== undefined) {
      const dates = this.resolvePublishDates(
        nextStatus,
        dto.scheduledFor !== undefined
          ? dto.scheduledFor
          : existing.scheduledFor?.toISOString() ?? null,
        existing.publishedAt,
      );
      publishedAt = dates.publishedAt;
      scheduledFor = dates.scheduledFor;
    }

    const becomingPublished =
      existing.status !== NewsStatus.PUBLISHED && nextStatus === NewsStatus.PUBLISHED;

    try {
      const row = await this.prisma.$transaction(async (tx) => {
        if (dto.tags) {
          await tx.newsTag.deleteMany({ where: { newsId: id } });
          const unique = [
            ...new Set(dto.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)),
          ];
          if (unique.length) {
            await tx.newsTag.createMany({
              data: unique.map((tag) => ({ newsId: id, tag })),
            });
          }
        }

        return tx.news.update({
          where: { id },
          data: {
            ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
            ...(dto.slug !== undefined ? { slug: dto.slug.trim() } : {}),
            ...(dto.excerpt !== undefined ? { excerpt: dto.excerpt.trim() || null } : {}),
            ...(dto.content !== undefined ? { content: dto.content, contentHtml } : {}),
            ...(dto.coverImage !== undefined
              ? { coverImage: dto.coverImage.trim() || null }
              : {}),
            ...(dto.category !== undefined ? { category: dto.category as NewsCategory } : {}),
            ...(dto.status !== undefined ? { status: nextStatus } : {}),
            ...(dto.metaTitle !== undefined ? { metaTitle: dto.metaTitle.trim() || null } : {}),
            ...(dto.metaDescription !== undefined
              ? { metaDescription: dto.metaDescription.trim() || null }
              : {}),
            ...(dto.metaKeywords !== undefined ? { metaKeywords: dto.metaKeywords } : {}),
            ...(dto.ogImage !== undefined ? { ogImage: dto.ogImage.trim() || null } : {}),
            ...(dto.allowComments !== undefined ? { allowComments: dto.allowComments } : {}),
            ...(dto.isPinned !== undefined ? { isPinned: dto.isPinned } : {}),
            ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
            publishedAt,
            scheduledFor,
          },
          include: newsAuthorInclude,
        });
      });

      if (becomingPublished) {
        await this.notifyPublished(row.id, row.title, row.slug, actorId);
        void this.activity
          ?.recordNewsPost(actorId, {
            id: row.id,
            title: row.title,
            slug: row.slug,
            coverImage: row.coverImage,
          })
          .catch(() => undefined);
      }

      return toNewsAdminItem(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Новость с таким slug уже существует');
      }
      throw error;
    }
  }

  async archive(id: string): Promise<void> {
    await this.requireNews(id);
    await this.prisma.news.update({
      where: { id },
      data: { status: NewsStatus.ARCHIVED },
    });
  }

  async setPinned(id: string, isPinned: boolean): Promise<NewsAdminItem> {
    await this.requireNews(id);
    const row = await this.prisma.news.update({
      where: { id },
      data: { isPinned },
      include: newsAuthorInclude,
    });
    return toNewsAdminItem(row);
  }

  async setFeatured(id: string, isFeatured: boolean): Promise<NewsAdminItem> {
    await this.requireNews(id);
    const row = await this.prisma.news.update({
      where: { id },
      data: { isFeatured },
      include: newsAuthorInclude,
    });
    return toNewsAdminItem(row);
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Файл не выбран');
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      throw new BadRequestException('Поддерживаются только JPEG, PNG, WEBP и GIF');
    }

    if (file.size > NEWS_IMAGE_MAX) {
      throw new BadRequestException('Файл больше 5 МБ');
    }

    const directory = join(this.uploads.rootDir, 'news');
    await mkdir(directory, { recursive: true });
    const name = `news-${randomBytes(8).toString('hex')}.webp`;

    try {
      await sharp(file.buffer)
        .resize({ width: NEWS_IMAGE_WIDTH, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(join(directory, name));
    } catch {
      throw new BadRequestException('Не удалось обработать изображение');
    }

    return { url: `${UPLOADS_ROUTE}/news/${name}` };
  }

  async stats(): Promise<NewsStats> {
    const [total, published, drafts, scheduled, archived] = await Promise.all([
      this.prisma.news.count(),
      this.prisma.news.count({ where: { status: NewsStatus.PUBLISHED } }),
      this.prisma.news.count({ where: { status: NewsStatus.DRAFT } }),
      this.prisma.news.count({ where: { status: NewsStatus.SCHEDULED } }),
      this.prisma.news.count({ where: { status: NewsStatus.ARCHIVED } }),
    ]);

    const [topByViews, topByLikes, topByComments] = await Promise.all([
      this.prisma.news.findMany({
        where: { status: NewsStatus.PUBLISHED },
        include: newsAuthorInclude,
        orderBy: { viewsCount: 'desc' },
        take: 5,
      }),
      this.prisma.news.findMany({
        where: { status: NewsStatus.PUBLISHED },
        include: newsAuthorInclude,
        orderBy: { likesCount: 'desc' },
        take: 5,
      }),
      this.prisma.news.findMany({
        where: { status: NewsStatus.PUBLISHED },
        include: newsAuthorInclude,
        orderBy: { commentsCount: 'desc' },
        take: 5,
      }),
    ]);

    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recent = await this.prisma.news.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const byDay = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      byDay.set(d.toISOString().slice(0, 10), 0);
    }
    for (const row of recent) {
      const key = row.createdAt.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }

    return {
      total,
      published,
      drafts,
      scheduled,
      archived,
      topByViews: topByViews.map((r) => toNewsSummary(r)),
      topByLikes: topByLikes.map((r) => toNewsSummary(r)),
      topByComments: topByComments.map((r) => toNewsSummary(r)),
      activityByDay: Array.from(byDay.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async buildRssFeed(siteUrl: string): Promise<string> {
    const rows = await this.prisma.news.findMany({
      where: { status: NewsStatus.PUBLISHED },
      include: newsAuthorInclude,
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    const feed = new Feed({
      title: 'TWOMC — Новости',
      description: 'Обновления, события и объявления сервера TWOMC',
      id: siteUrl,
      link: `${siteUrl}/news`,
      language: 'ru',
      favicon: `${siteUrl}/favicon.ico`,
      copyright: `© ${new Date().getFullYear()} TWOMC`,
      updated: rows[0]?.publishedAt ?? new Date(),
    });

    for (const row of rows) {
      feed.addItem({
        title: row.title,
        id: `${siteUrl}/news/${row.slug}`,
        link: `${siteUrl}/news/${row.slug}`,
        description: row.excerpt ?? undefined,
        content: row.contentHtml ?? row.content,
        author: [{ name: row.author.username }],
        date: row.publishedAt ?? row.createdAt,
        image: row.coverImage ?? undefined,
      });
    }

    return feed.rss2();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async publishScheduled(): Promise<void> {
    if (this.publishing) {
      return;
    }

    this.publishing = true;
    try {
      const due = await this.prisma.news.findMany({
        where: {
          status: NewsStatus.SCHEDULED,
          scheduledFor: { lte: new Date() },
        },
        take: 20,
      });

      for (const item of due) {
        await this.prisma.news.update({
          where: { id: item.id },
          data: {
            status: NewsStatus.PUBLISHED,
            publishedAt: item.scheduledFor ?? new Date(),
          },
        });
        await this.notifyPublished(item.id, item.title, item.slug, item.authorId);
        this.logger.log(`Published scheduled news ${item.slug}`);
      }
    } catch (error) {
      this.logger.error(`Scheduled publish failed: ${String(error)}`);
    } finally {
      this.publishing = false;
    }
  }

  private async notifyPublished(
    newsId: string,
    title: string,
    slug: string,
    fromUserId: string,
  ): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { isBanned: false, id: { not: fromUserId } },
      select: { id: true },
      take: 500,
    });

    await Promise.allSettled(
      users.map((user) =>
        this.notifications.createNotification({
          userId: user.id,
          type: NotificationType.NEWS_PUBLISHED,
          title: 'Новая новость',
          message: title,
          link: `/news/${slug}`,
          fromUserId,
          metadata: { newsId, slug },
        }),
      ),
    );
  }

  private async recordView(
    newsId: string,
    userId: string | null,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<void> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const duplicate = await this.prisma.newsView.findFirst({
      where: {
        newsId,
        viewedAt: { gte: since },
        ...(userId
          ? { userId }
          : ipAddress
            ? { userId: null, ipAddress }
            : { id: '__never__' }),
      },
    });

    if (duplicate) {
      return;
    }

    if (!userId && !ipAddress) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.newsView.create({
        data: {
          newsId,
          userId: userId ?? null,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent?.slice(0, 500) ?? null,
        },
      }),
      this.prisma.news.update({
        where: { id: newsId },
        data: { viewsCount: { increment: 1 } },
      }),
    ]);
  }

  private async likedNewsIds(userId: string | null, newsIds: string[]): Promise<Set<string>> {
    if (!userId || !newsIds.length) {
      return new Set();
    }

    const likes = await this.prisma.newsLike.findMany({
      where: { userId, newsId: { in: newsIds } },
      select: { newsId: true },
    });

    return new Set(likes.map((l) => l.newsId));
  }

  private sortOrder(sort: NewsSort): Prisma.NewsOrderByWithRelationInput[] {
    switch (sort) {
      case NewsSort.POPULAR:
        return [{ isPinned: 'desc' }, { viewsCount: 'desc' }, { publishedAt: 'desc' }];
      case NewsSort.MOST_LIKED:
        return [{ isPinned: 'desc' }, { likesCount: 'desc' }, { publishedAt: 'desc' }];
      case NewsSort.MOST_COMMENTED:
        return [{ isPinned: 'desc' }, { commentsCount: 'desc' }, { publishedAt: 'desc' }];
      case NewsSort.NEWEST:
      default:
        return [{ isPinned: 'desc' }, { publishedAt: 'desc' }];
    }
  }

  private assertSchedule(status: NewsStatus, scheduledFor?: string | null): void {
    if (status === NewsStatus.SCHEDULED && !scheduledFor) {
      throw new BadRequestException('Укажите дату публикации для запланированной новости');
    }
  }

  private resolvePublishDates(
    status: NewsStatus,
    scheduledFor?: string | null,
    existingPublishedAt?: Date | null,
  ): { publishedAt: Date | null; scheduledFor: Date | null } {
    if (status === NewsStatus.PUBLISHED) {
      return {
        publishedAt: existingPublishedAt ?? new Date(),
        scheduledFor: null,
      };
    }

    if (status === NewsStatus.SCHEDULED) {
      const when = scheduledFor ? new Date(scheduledFor) : null;
      return {
        publishedAt: when,
        scheduledFor: when,
      };
    }

    return {
      publishedAt: null,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    };
  }

  private async ensureUniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 2;

    while (await this.prisma.news.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private async requireNews(id: string) {
    const row = await this.prisma.news.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Новость не найдена');
    }
    return row;
  }
}
