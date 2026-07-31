import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  forwardRef,
} from '@nestjs/common';
import {
  ActivityType,
  ActivityVisibility,
  NotificationType,
  Prisma,
} from '@prisma/client';
import {
  ActivityDetail,
  ActivityFeedFilter,
  ActivityFeedSettings as SharedActivityFeedSettings,
  ActivityItem,
  ActivityStats,
  MAX_ACTIVITY_PAGE_SIZE,
  PaginatedResponse,
} from '@twomc/shared';
import {
  buildPaginatedResult,
  normalizePagination,
} from '../../common/pagination';
import { selectMinimalUser } from '../../common/prisma/user-selects';
import { findUserByIdentifier } from '../../common/user-identifier';
import { ChatGateway } from '../chat/chat.gateway';
import { FriendsService } from '../friends/friends.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ActivityWithRelations,
  CreateActivityInput,
  toActivityDetail,
  toActivityItem,
  toActivitySettings,
} from './activity.mapper';
import { UpdateActivitySettingsDto } from './dto/activity.dto';

const activityInclude = {
  user: { select: selectMinimalUser },
  reactions: {
    include: {
      user: { select: { username: true, avatar: true } },
    },
  },
  _count: {
    select: {
      comments: { where: { isDeleted: false } },
      reactions: true,
    },
  },
} satisfies Prisma.ActivityInclude;

type VisibilityKey =
  | 'purchasesVisibility'
  | 'achievementsVisibility'
  | 'badgesVisibility'
  | 'giftsVisibility'
  | 'friendshipsVisibility'
  | 'profileUpdatesVisibility';

type ShowKey =
  | 'showPurchases'
  | 'showAchievements'
  | 'showBadges'
  | 'showAwards'
  | 'showGifts'
  | 'showFriendships'
  | 'showProfileUpdates'
  | 'showMilestones'
  | 'showServerActivity';

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => FriendsService))
    private readonly friends: FriendsService,
    private readonly notifications: NotificationsService,
    @Optional()
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway?: ChatGateway,
  ) {}

  async createActivity(dto: CreateActivityInput): Promise<ActivityItem | null> {
    const settings = await this.getOrCreateSettings(dto.userId);

    if (!this.shouldShowType(settings, dto.type)) {
      return null;
    }

    const visibilityKey = this.getVisibilityKey(dto.type);
    const visibility =
      dto.visibility ??
      (visibilityKey ? settings[visibilityKey] : ActivityVisibility.PUBLIC);

    const row = await this.prisma.activity.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
        actionUrl: dto.actionUrl ?? null,
        metadata: dto.metadata ?? undefined,
        visibility,
        isPinned: dto.isPinned ?? false,
      },
      include: activityInclude,
    });

    const item = toActivityItem(row as ActivityWithRelations, null);
    this.chatGateway?.emitActivity('activity:new', item);
    return item;
  }

  async getFeed(
    viewerId: string | null,
    options: {
      page?: number;
      limit?: number;
      userId?: string;
      type?: ActivityType;
      filter?: ActivityFeedFilter;
    } = {},
  ): Promise<PaginatedResponse<ActivityItem>> {
    const { page, limit, skip } = normalizePagination({
      page: options.page,
      limit: Math.min(options.limit ?? 20, MAX_ACTIVITY_PAGE_SIZE),
    });

    const where = await this.buildVisibilityWhere(viewerId, {
      userId: options.userId,
      type: options.type,
      filter: options.filter,
    });

    const [total, rows] = await Promise.all([
      this.prisma.activity.count({ where }),
      this.prisma.activity.findMany({
        where,
        include: activityInclude,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return buildPaginatedResult(
      rows.map((row) => toActivityItem(row as ActivityWithRelations, viewerId)),
      total,
      page,
      limit,
    );
  }

  async getUserFeed(
    username: string,
    viewerId: string | null,
    options: { page?: number; limit?: number; type?: ActivityType } = {},
  ): Promise<PaginatedResponse<ActivityItem>> {
    const user = await findUserByIdentifier(this.prisma, username, {
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return this.getFeed(viewerId, {
      ...options,
      userId: user.id,
    });
  }

  async getHighlights(
    viewerId: string | null,
    period: 'day' | 'week' = 'week',
    limit = 10,
  ): Promise<ActivityItem[]> {
    const since = new Date();
    since.setDate(since.getDate() - (period === 'day' ? 1 : 7));

    const visibilityWhere = await this.buildVisibilityWhere(viewerId, {});
    const where: Prisma.ActivityWhereInput = {
      AND: [
        visibilityWhere,
        { createdAt: { gte: since } },
        { isHidden: false },
      ],
    };

    const rows = await this.prisma.activity.findMany({
      where,
      include: activityInclude,
      orderBy: [{ reactions: { _count: 'desc' } }, { createdAt: 'desc' }],
      take: Math.min(50, Math.max(1, limit)),
    });

    return rows.map((row) =>
      toActivityItem(row as ActivityWithRelations, viewerId),
    );
  }

  async getById(
    id: string,
    viewerId: string | null,
  ): Promise<ActivityDetail> {
    const row = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        ...activityInclude,
        comments: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
          include: { author: { select: selectMinimalUser } },
        },
      },
    });

    if (!row || (row.isHidden && !viewerId)) {
      throw new NotFoundException('Активность не найдена');
    }

    if (row.isHidden) {
      throw new NotFoundException('Активность не найдена');
    }

    const allowed = await this.canViewActivity(row, viewerId);
    if (!allowed) {
      throw new ForbiddenException('Нет доступа к этой активности');
    }

    return toActivityDetail(row as ActivityWithRelations, viewerId);
  }

  async toggleReaction(
    activityId: string,
    userId: string,
    emoji: string,
  ): Promise<ActivityItem> {
    const activity = await this.requireVisibleActivity(activityId, userId);

    const existing = await this.prisma.activityReaction.findUnique({
      where: {
        activityId_userId: { activityId, userId },
      },
    });

    if (existing) {
      if (existing.emoji === emoji) {
        await this.prisma.activityReaction.delete({ where: { id: existing.id } });
      } else {
        await this.prisma.activityReaction.update({
          where: { id: existing.id },
          data: { emoji },
        });
      }
    } else {
      await this.prisma.activityReaction.create({
        data: { activityId, userId, emoji },
      });

      const settings = await this.getOrCreateSettings(activity.userId);
      if (settings.notifyOnReaction && activity.userId !== userId) {
        const reactor = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { username: true },
        });
        await this.notifications.createNotification({
          userId: activity.userId,
          type: NotificationType.SYSTEM,
          title: 'Реакция на активность',
          message: `${reactor?.username ?? 'Игрок'} отреагировал на вашу активность`,
          link: `/feed/${activityId}`,
          fromUserId: userId,
        });
      }
    }

    const item = await this.reloadItem(activityId, userId);
    this.chatGateway?.emitActivity('activity:updated', item);
    return item;
  }

  async addComment(
    activityId: string,
    authorId: string,
    content: string,
  ): Promise<ActivityDetail> {
    await this.requireVisibleActivity(activityId, authorId);

    const trimmed = content.trim();
    if (!trimmed) {
      throw new ForbiddenException('Комментарий не может быть пустым');
    }

    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { userId: true },
    });

    await this.prisma.activityComment.create({
      data: {
        activityId,
        authorId,
        content: trimmed,
      },
    });

    if (activity && activity.userId !== authorId) {
      const settings = await this.getOrCreateSettings(activity.userId);
      if (settings.notifyOnComment) {
        const author = await this.prisma.user.findUnique({
          where: { id: authorId },
          select: { username: true },
        });
        await this.notifications.createNotification({
          userId: activity.userId,
          type: NotificationType.SYSTEM,
          title: 'Комментарий к активности',
          message: `${author?.username ?? 'Игрок'} прокомментировал вашу активность`,
          link: `/feed/${activityId}`,
          fromUserId: authorId,
        });
      }
    }

    const detail = await this.getById(activityId, authorId);
    this.chatGateway?.emitActivity('activity:updated', detail);
    return detail;
  }

  async deleteComment(
    commentId: string,
    actorId: string,
    asModerator = false,
  ): Promise<void> {
    const comment = await this.prisma.activityComment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.isDeleted) {
      throw new NotFoundException('Комментарий не найден');
    }

    if (!asModerator && comment.authorId !== actorId) {
      throw new ForbiddenException('Нельзя удалить чужой комментарий');
    }

    await this.prisma.activityComment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: actorId,
        content: '',
        contentHtml: null,
      },
    });

    this.chatGateway?.emitActivity('activity:updated', {
      id: comment.activityId,
    });
  }

  async getSettings(userId: string): Promise<SharedActivityFeedSettings> {
    const settings = await this.getOrCreateSettings(userId);
    return toActivitySettings(settings);
  }

  async updateSettings(
    userId: string,
    dto: UpdateActivitySettingsDto,
  ): Promise<SharedActivityFeedSettings> {
    await this.getOrCreateSettings(userId);

    const updated = await this.prisma.activityFeedSettings.update({
      where: { userId },
      data: {
        ...dto,
      },
    });

    return toActivitySettings(updated);
  }

  async hideActivity(
    id: string,
    moderatorId: string,
    reason?: string,
  ): Promise<void> {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) {
      throw new NotFoundException('Активность не найдена');
    }

    await this.prisma.activity.update({
      where: { id },
      data: {
        isHidden: true,
        hiddenBy: moderatorId,
        hiddenReason: reason?.trim() || null,
      },
    });

    this.chatGateway?.emitActivity('activity:deleted', { id });
  }

  async pinActivity(id: string, pinned: boolean): Promise<ActivityItem> {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) {
      throw new NotFoundException('Активность не найдена');
    }

    await this.prisma.activity.update({
      where: { id },
      data: { isPinned: pinned },
    });

    const item = await this.reloadItem(id, null);
    this.chatGateway?.emitActivity('activity:updated', item);
    return item;
  }

  async getStats(): Promise<ActivityStats> {
    const [
      total,
      hiddenCount,
      pinnedCount,
      reactionsCount,
      commentsCount,
      byType,
      topGrouped,
    ] = await Promise.all([
      this.prisma.activity.count(),
      this.prisma.activity.count({ where: { isHidden: true } }),
      this.prisma.activity.count({ where: { isPinned: true } }),
      this.prisma.activityReaction.count(),
      this.prisma.activityComment.count({ where: { isDeleted: false } }),
      this.prisma.activity.groupBy({
        by: ['type'],
        _count: { _all: true },
        orderBy: { _count: { type: 'desc' } },
      }),
      this.prisma.activity.groupBy({
        by: ['userId'],
        _count: { _all: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    const users = await this.prisma.user.findMany({
      where: { id: { in: topGrouped.map((r) => r.userId) } },
      select: { id: true, username: true },
    });
    const usernameById = new Map(users.map((u) => [u.id, u.username]));

    return {
      total,
      hiddenCount,
      pinnedCount,
      reactionsCount,
      commentsCount,
      byType: byType.map((row) => ({
        type: row.type as ActivityStats['byType'][number]['type'],
        count: row._count._all,
      })),
      topUsers: topGrouped.map((row) => ({
        userId: row.userId,
        username: usernameById.get(row.userId) ?? row.userId,
        count: row._count._all,
      })),
    };
  }

  async createCustom(
    actorId: string,
    data: {
      title: string;
      description?: string;
      imageUrl?: string;
      actionUrl?: string;
      type?: ActivityType;
      isPinned?: boolean;
    },
  ): Promise<ActivityItem | null> {
    return this.createActivity({
      userId: actorId,
      type: data.type ?? ActivityType.CUSTOM,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      imageUrl: data.imageUrl?.trim() || null,
      actionUrl: data.actionUrl?.trim() || null,
      visibility: ActivityVisibility.PUBLIC,
      isPinned: data.isPinned ?? false,
    });
  }

  async adminList(options: {
    page?: number;
    limit?: number;
    type?: ActivityType;
    isHidden?: boolean;
    username?: string;
  }): Promise<PaginatedResponse<ActivityItem>> {
    const { page, limit, skip } = normalizePagination({
      page: options.page,
      limit: options.limit,
    });

    let userId: string | undefined;
    if (options.username) {
      const user = await findUserByIdentifier(this.prisma, options.username, {
        select: { id: true },
      });
      userId = user?.id;
    }

    const where: Prisma.ActivityWhereInput = {
      ...(options.type ? { type: options.type } : {}),
      ...(options.isHidden !== undefined ? { isHidden: options.isHidden } : {}),
      ...(userId ? { userId } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.activity.count({ where }),
      this.prisma.activity.findMany({
        where,
        include: activityInclude,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return buildPaginatedResult(
      rows.map((row) => toActivityItem(row as ActivityWithRelations, null)),
      total,
      page,
      limit,
    );
  }

  // --- Record helpers ---

  async recordPurchase(
    userId: string,
    order: {
      id: string;
      total: number | Prisma.Decimal;
      items: Array<{
        productId: string;
        product: { name: string; slug: string; image?: string | null };
      }>;
    },
  ): Promise<void> {
    const first = order.items[0];
    if (!first) return;

    const extra =
      order.items.length > 1 ? ` и ещё ${order.items.length - 1}` : '';

    await this.createActivity({
      userId,
      type: ActivityType.PURCHASE_MADE,
      title: `купил ${first.product.name}${extra}`,
      imageUrl: first.product.image ?? null,
      actionUrl: `/store/product/${first.product.slug}`,
      metadata: {
        orderId: order.id,
        productId: first.productId,
        productName: first.product.name,
        totalItems: order.items.length,
        total: Number(order.total),
      },
    });
  }

  async recordRank(
    userId: string,
    position: { id: string; name: string; slug: string },
  ): Promise<void> {
    await this.createActivity({
      userId,
      type: ActivityType.RANK_ACHIEVED,
      title: `получил ранг ${position.name}`,
      actionUrl: `/users`,
      metadata: {
        positionId: position.id,
        positionSlug: position.slug,
        positionName: position.name,
      },
    });
  }

  async recordBadge(
    userId: string,
    badge: { type: string },
  ): Promise<void> {
    await this.createActivity({
      userId,
      type: ActivityType.BADGE_GRANTED,
      title: `получил бейдж «${badge.type}»`,
      metadata: { badgeType: badge.type },
    });
  }

  async recordAward(
    userId: string,
    award: { id: string; name: string; iconUrl?: string | null },
  ): Promise<void> {
    await this.createActivity({
      userId,
      type: ActivityType.AWARD_GRANTED,
      title: `получил награду «${award.name}»`,
      imageUrl: award.iconUrl ?? null,
      metadata: { awardId: award.id, awardName: award.name },
    });
  }

  async recordGift(input: {
    fromUserId: string;
    toUserId: string;
    productName: string;
    productSlug?: string;
    imageUrl?: string | null;
    isAnonymous?: boolean;
    senderUsername?: string;
    recipientUsername?: string;
  }): Promise<void> {
    await this.createActivity({
      userId: input.fromUserId,
      type: ActivityType.GIFT_SENT,
      title: `подарил ${input.productName} игроку @${input.recipientUsername ?? 'игроку'}`,
      imageUrl: input.imageUrl ?? null,
      actionUrl: input.productSlug
        ? `/store/product/${input.productSlug}`
        : undefined,
      metadata: {
        toUserId: input.toUserId,
        productName: input.productName,
      },
    });

    await this.createActivity({
      userId: input.toUserId,
      type: ActivityType.GIFT_RECEIVED,
      title: input.isAnonymous
        ? `получил анонимный подарок ${input.productName}`
        : `получил ${input.productName} от @${input.senderUsername ?? 'игрока'}`,
      imageUrl: input.imageUrl ?? null,
      actionUrl: input.productSlug
        ? `/store/product/${input.productSlug}`
        : undefined,
      metadata: {
        fromUserId: input.isAnonymous ? null : input.fromUserId,
        productName: input.productName,
        isAnonymous: Boolean(input.isAnonymous),
      },
    });
  }

  async recordFriendship(user1Id: string, user2Id: string): Promise<void> {
    const friend = await this.prisma.user.findUnique({
      where: { id: user2Id },
      select: { username: true },
    });
    if (!friend) return;

    await this.createActivity({
      userId: user1Id,
      type: ActivityType.FRIENDSHIP_STARTED,
      title: `подружился с @${friend.username}`,
      actionUrl: `/users/${friend.username}`,
      metadata: { friendUserId: user2Id, friendUsername: friend.username },
    });
  }

  async recordProfileUpdate(
    userId: string,
    kind: 'avatar' | 'banner',
  ): Promise<void> {
    await this.createActivity({
      userId,
      type: ActivityType.PROFILE_UPDATED,
      title: kind === 'avatar' ? 'обновил аватар' : 'обновил баннер',
      metadata: { kind },
    });
  }

  async recordNewsPost(
    authorId: string,
    news: { id: string; title: string; slug: string; coverImage?: string | null },
  ): Promise<void> {
    await this.createActivity({
      userId: authorId,
      type: ActivityType.NEWS_POSTED,
      title: `опубликовал новость «${news.title}»`,
      imageUrl: news.coverImage ?? null,
      actionUrl: `/news/${news.slug}`,
      metadata: { newsId: news.id, slug: news.slug },
      visibility: ActivityVisibility.PUBLIC,
    });
  }

  async checkMilestones(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { statistics: true },
    });
    if (!user) return;

    const milestones: Array<{
      key: string;
      title: string;
      condition: () => Promise<boolean> | boolean;
    }> = [
      {
        key: '100_hours',
        title: 'провёл 100 часов на сервере',
        condition: () => (user.statistics?.playTime ?? 0) >= 100 * 60,
      },
      {
        key: '1000_comments',
        title: 'написал 1000 комментариев',
        condition: async () => {
          const count = await this.prisma.profileComment.count({
            where: { authorId: userId, isDeleted: false },
          });
          return count >= 1000;
        },
      },
      {
        key: 'first_year',
        title: 'играет уже год!',
        condition: () =>
          Date.now() - user.createdAt.getTime() >= 365 * 24 * 3600 * 1000,
      },
    ];

    for (const milestone of milestones) {
      if (await this.hasReachedMilestone(userId, milestone.key)) continue;
      if (await milestone.condition()) {
        await this.createActivity({
          userId,
          type: ActivityType.MILESTONE_REACHED,
          title: milestone.title,
          metadata: { milestone: milestone.key },
        });
      }
    }
  }

  // --- Internals ---

  private async hasReachedMilestone(
    userId: string,
    key: string,
  ): Promise<boolean> {
    const existing = await this.prisma.activity.findFirst({
      where: {
        userId,
        type: ActivityType.MILESTONE_REACHED,
        metadata: { path: ['milestone'], equals: key },
      },
      select: { id: true },
    });
    return Boolean(existing);
  }

  private async getOrCreateSettings(userId: string) {
    const existing = await this.prisma.activityFeedSettings.findUnique({
      where: { userId },
    });
    if (existing) return existing;

    return this.prisma.activityFeedSettings.create({
      data: { userId },
    });
  }

  private getVisibilityKey(type: ActivityType): VisibilityKey | null {
    switch (type) {
      case ActivityType.PURCHASE_MADE:
      case ActivityType.DONATOR_UPGRADED:
        return 'purchasesVisibility';
      case ActivityType.ACHIEVEMENT_UNLOCKED:
      case ActivityType.MILESTONE_REACHED:
      case ActivityType.TOP_ACHIEVED:
      case ActivityType.RANK_ACHIEVED:
        return 'achievementsVisibility';
      case ActivityType.BADGE_GRANTED:
      case ActivityType.AWARD_GRANTED:
      case ActivityType.MEDIA_APPROVED:
        return 'badgesVisibility';
      case ActivityType.GIFT_SENT:
      case ActivityType.GIFT_RECEIVED:
        return 'giftsVisibility';
      case ActivityType.FRIENDSHIP_STARTED:
        return 'friendshipsVisibility';
      case ActivityType.PROFILE_UPDATED:
        return 'profileUpdatesVisibility';
      default:
        return null;
    }
  }

  private getShowKey(type: ActivityType): ShowKey | null {
    switch (type) {
      case ActivityType.PURCHASE_MADE:
      case ActivityType.DONATOR_UPGRADED:
        return 'showPurchases';
      case ActivityType.ACHIEVEMENT_UNLOCKED:
        return 'showAchievements';
      case ActivityType.BADGE_GRANTED:
        return 'showBadges';
      case ActivityType.AWARD_GRANTED:
        return 'showAwards';
      case ActivityType.GIFT_SENT:
      case ActivityType.GIFT_RECEIVED:
        return 'showGifts';
      case ActivityType.FRIENDSHIP_STARTED:
        return 'showFriendships';
      case ActivityType.PROFILE_UPDATED:
        return 'showProfileUpdates';
      case ActivityType.MILESTONE_REACHED:
      case ActivityType.TOP_ACHIEVED:
        return 'showMilestones';
      case ActivityType.JOINED_SERVER:
        return 'showServerActivity';
      case ActivityType.NEWS_POSTED:
      case ActivityType.EVENT_ANNOUNCED:
      case ActivityType.CUSTOM:
      case ActivityType.BIRTHDAY:
      case ActivityType.RANK_ACHIEVED:
      case ActivityType.MEDIA_APPROVED:
        return null;
      default:
        return null;
    }
  }

  private shouldShowType(
    settings: Awaited<ReturnType<ActivityService['getOrCreateSettings']>>,
    type: ActivityType,
  ): boolean {
    const key = this.getShowKey(type);
    if (!key) return true;
    return Boolean(settings[key]);
  }

  private async buildVisibilityWhere(
    viewerId: string | null,
    options: {
      userId?: string;
      type?: ActivityType;
      filter?: ActivityFeedFilter;
    },
  ): Promise<Prisma.ActivityWhereInput> {
    const base: Prisma.ActivityWhereInput = { isHidden: false };

    if (!viewerId) {
      base.visibility = ActivityVisibility.PUBLIC;
    } else {
      const friendIds = await this.friends.getFriendIds(viewerId);
      base.OR = [
        { visibility: ActivityVisibility.PUBLIC },
        {
          AND: [
            { visibility: ActivityVisibility.FRIENDS },
            {
              OR: [
                { userId: viewerId },
                { userId: { in: friendIds } },
              ],
            },
          ],
        },
        {
          AND: [
            { visibility: ActivityVisibility.PRIVATE },
            { userId: viewerId },
          ],
        },
      ];
    }

    if (options.userId) {
      base.userId = options.userId;
    }

    if (options.type) {
      base.type = options.type;
    }

    if (options.filter === ActivityFeedFilter.FRIENDS && viewerId) {
      const friendIds = await this.friends.getFriendIds(viewerId);
      base.userId = { in: [...friendIds, viewerId] };
    }

    if (options.filter === ActivityFeedFilter.ME && viewerId) {
      base.userId = viewerId;
    }

    return base;
  }

  private async canViewActivity(
    activity: { userId: string; visibility: ActivityVisibility; isHidden: boolean },
    viewerId: string | null,
  ): Promise<boolean> {
    if (activity.isHidden) return false;
    if (activity.visibility === ActivityVisibility.PUBLIC) return true;
    if (!viewerId) return false;
    if (activity.userId === viewerId) return true;
    if (activity.visibility === ActivityVisibility.PRIVATE) return false;

    const friendIds = await this.friends.getFriendIds(viewerId);
    return friendIds.includes(activity.userId);
  }

  private async requireVisibleActivity(activityId: string, viewerId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });
    if (!activity || activity.isHidden) {
      throw new NotFoundException('Активность не найдена');
    }
    const allowed = await this.canViewActivity(activity, viewerId);
    if (!allowed) {
      throw new ForbiddenException('Нет доступа к этой активности');
    }
    return activity;
  }

  private async reloadItem(
    id: string,
    viewerId: string | null,
  ): Promise<ActivityItem> {
    const row = await this.prisma.activity.findUnique({
      where: { id },
      include: activityInclude,
    });
    if (!row) {
      throw new NotFoundException('Активность не найдена');
    }
    return toActivityItem(row as ActivityWithRelations, viewerId);
  }
}
