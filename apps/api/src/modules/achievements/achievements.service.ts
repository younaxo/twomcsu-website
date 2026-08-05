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
import { Cron } from '@nestjs/schedule';
import {
  Achievement as AchievementRow,
  AchievementCategory,
  AchievementConditionType,
  AchievementRarity,
  FriendshipStatus,
  NotificationType,
  OrderStatus,
  Prisma,
  ReactionType,
  ReportStatus,
  ReportType,
  UserAchievement as UserAchievementRow,
  UserBadgeType,
  ActivityType,
} from '@prisma/client';
import {
  Achievement,
  AchievementDetail,
  AchievementFilter,
  AchievementUnlockedPayload,
  AchievementUnlockPreview,
  AchievementWithProgress,
  AchievementsStats,
  MAX_SHOWCASE_ACHIEVEMENTS,
  UserAchievementProgress,
  UserAchievementsResponse,
} from '@twomc/shared';
import { ActivityService } from '../activity/activity.service';
import { ChatGateway } from '../chat/chat.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';

type AchievementListQuery = {
  category?: AchievementCategory;
  rarity?: AchievementRarity;
  filter?: AchievementFilter;
  search?: string;
  sort?: 'order' | 'rarity' | 'name' | 'unlocked';
};

const RARITY_ORDER: Record<AchievementRarity, number> = {
  COMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4,
  MYTHIC: 5,
};

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);
  private checkingAll = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Optional()
    @Inject(forwardRef(() => ActivityService))
    private readonly activity?: ActivityService,
    @Optional()
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway?: ChatGateway,
  ) {}

  async getAllAchievements(
    userId?: string,
    query: AchievementListQuery = {},
  ): Promise<AchievementWithProgress[]> {
    const where: Prisma.AchievementWhereInput = {
      isActive: true,
      ...(query.category ? { category: query.category } : {}),
      ...(query.rarity ? { rarity: query.rarity } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.achievement.findMany({
      where,
      orderBy: [{ category: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    });

    const progressMap = userId
      ? await this.loadProgressMap(
          userId,
          rows.map((r) => r.id),
        )
      : new Map<string, UserAchievementRow>();

    let items = rows.map((row) => this.toWithProgress(row, progressMap.get(row.id) ?? null));

    if (query.filter === 'unlocked') {
      items = items.filter((a) => a.progress?.isCompleted);
    } else if (query.filter === 'available') {
      items = items.filter((a) => !a.isHidden && !a.progress?.isCompleted);
    } else if (query.filter === 'locked') {
      items = items.filter((a) => !a.progress?.isCompleted);
    }

    if (query.sort === 'name') {
      items.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    } else if (query.sort === 'rarity') {
      items.sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity]);
    } else if (query.sort === 'unlocked') {
      items.sort((a, b) => b.unlockedCount - a.unlockedCount);
    }

    return items;
  }

  async getAchievementBySlug(slug: string, userId?: string): Promise<AchievementDetail> {
    const row = await this.prisma.achievement.findUnique({ where: { slug } });
    if (!row || !row.isActive) {
      throw new NotFoundException('Достижение не найдено');
    }

    const progress = userId
      ? await this.prisma.userAchievement.findUnique({
          where: { userId_achievementId: { userId, achievementId: row.id } },
        })
      : null;

    const base = this.toWithProgress(row, progress);
    if (base.isHidden) {
      throw new NotFoundException('Достижение не найдено');
    }

    const recent = await this.prisma.userAchievement.findMany({
      where: { achievementId: row.id, isCompleted: true },
      orderBy: { completedAt: 'desc' },
      take: 10,
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });

    const recentUnlocks: AchievementUnlockPreview[] = recent
      .filter((r) => r.completedAt)
      .map((r) => ({
        userId: r.user.id,
        username: r.user.username,
        avatar: r.user.avatar,
        completedAt: r.completedAt!.toISOString(),
      }));

    return { ...base, recentUnlocks };
  }

  async getStats(): Promise<AchievementsStats> {
    const [achievements, totalUnlocks] = await Promise.all([
      this.prisma.achievement.findMany({
        where: { isActive: true },
        select: { category: true, rarity: true, slug: true, name: true, unlockedCount: true },
      }),
      this.prisma.userAchievement.count({ where: { isCompleted: true } }),
    ]);

    const byCategory: Record<string, number> = {};
    const byRarity: Record<string, number> = {};
    for (const a of achievements) {
      byCategory[a.category] = (byCategory[a.category] ?? 0) + 1;
      byRarity[a.rarity] = (byRarity[a.rarity] ?? 0) + 1;
    }

    const rarest = [...achievements]
      .sort((a, b) => a.unlockedCount - b.unlockedCount || RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity])
      .slice(0, 5)
      .map((a) => ({
        slug: a.slug,
        name: a.name,
        rarity: a.rarity as Achievement['rarity'],
        unlockedCount: a.unlockedCount,
      }));

    return {
      totalAchievements: achievements.length,
      totalUnlocks,
      byCategory,
      byRarity,
      rarest,
    };
  }

  async getUserAchievements(userId: string, viewerId?: string): Promise<UserAchievementsResponse> {
    const achievements = await this.getAllAchievements(userId);
    const isOwner = viewerId === userId;

    const visible = isOwner
      ? achievements
      : achievements.filter((a) => a.progress?.isCompleted || !a.isSecret);

    const showcase = visible
      .filter((a) => a.progress?.isShowcased && a.progress.isCompleted)
      .sort((a, b) => (a.progress?.showcaseOrder ?? 0) - (b.progress?.showcaseOrder ?? 0));

    const completedCount = visible.filter((a) => a.progress?.isCompleted).length;
    const totalCount = visible.filter((a) => !a.isHidden).length;

    return {
      achievements: visible,
      showcase,
      completedCount,
      totalCount,
    };
  }

  async getUserAchievementsByUsername(
    username: string,
    viewerId?: string,
  ): Promise<UserAchievementsResponse> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return this.getUserAchievements(user.id, viewerId);
  }

  async setShowcase(userId: string, achievementIds: string[]): Promise<UserAchievementsResponse> {
    if (achievementIds.length > MAX_SHOWCASE_ACHIEVEMENTS) {
      throw new BadRequestException(`Можно закрепить не более ${MAX_SHOWCASE_ACHIEVEMENTS} достижений`);
    }

    const uniqueIds = [...new Set(achievementIds)];

    const owned = await this.prisma.userAchievement.findMany({
      where: {
        userId,
        achievementId: { in: uniqueIds },
        isCompleted: true,
      },
    });

    if (owned.length !== uniqueIds.length) {
      throw new BadRequestException('Можно закреплять только полученные достижения');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userAchievement.updateMany({
        where: { userId, isShowcased: true },
        data: { isShowcased: false, showcaseOrder: 0 },
      });

      for (let i = 0; i < uniqueIds.length; i++) {
        await tx.userAchievement.update({
          where: {
            userId_achievementId: { userId, achievementId: uniqueIds[i] },
          },
          data: { isShowcased: true, showcaseOrder: i + 1 },
        });
      }
    });

    return this.getUserAchievements(userId, userId);
  }

  async removeFromShowcase(userId: string, achievementId: string): Promise<void> {
    const row = await this.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
    });
    if (!row) throw new NotFoundException('Достижение не найдено');

    await this.prisma.userAchievement.update({
      where: { id: row.id },
      data: { isShowcased: false, showcaseOrder: 0 },
    });
  }

  async updateProgress(
    userId: string,
    achievementId: string,
    value: number,
  ): Promise<UserAchievementProgress | null> {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
    });
    if (!achievement || !achievement.isActive) return null;

    const target = achievement.conditionValue ?? 1;
    const clamped = Math.max(0, Math.min(value, target));

    const existing = await this.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
    });

    if (existing?.isCompleted) {
      return this.toProgress(existing);
    }

    if (clamped >= target) {
      await this.grantAchievement(userId, achievementId);
      const updated = await this.prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId } },
      });
      return updated ? this.toProgress(updated) : null;
    }

    const row = await this.prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId } },
      create: {
        userId,
        achievementId,
        currentProgress: clamped,
      },
      update: {
        currentProgress: Math.max(existing?.currentProgress ?? 0, clamped),
      },
    });

    return this.toProgress(row);
  }

  async checkAndGrantAchievement(
    userId: string,
    conditionType: AchievementConditionType,
    currentValue: number,
  ): Promise<AchievementUnlockedPayload[]> {
    const achievements = await this.prisma.achievement.findMany({
      where: {
        isActive: true,
        conditionType,
        conditionValue: { not: null },
      },
    });

    const granted: AchievementUnlockedPayload[] = [];

    for (const achievement of achievements) {
      const target = achievement.conditionValue ?? 1;
      if (currentValue < target) {
        await this.updateProgress(userId, achievement.id, currentValue);
        continue;
      }

      const existing = await this.prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId: achievement.id } },
      });
      if (existing?.isCompleted) continue;

      const payload = await this.grantAchievement(userId, achievement.id);
      if (payload) granted.push(payload);
    }

    return granted;
  }

  async grantAchievement(
    userId: string,
    achievementId: string,
  ): Promise<AchievementUnlockedPayload | null> {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
    });
    if (!achievement || !achievement.isActive) {
      throw new NotFoundException('Достижение не найдено');
    }

    const existing = await this.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
    });
    if (existing?.isCompleted && existing.rewardsGranted) {
      return null;
    }

    const target = achievement.conditionValue ?? 1;
    const now = new Date();

    const userAchievement = await this.prisma.$transaction(async (tx) => {
      const ua = await tx.userAchievement.upsert({
        where: { userId_achievementId: { userId, achievementId } },
        create: {
          userId,
          achievementId,
          currentProgress: target,
          isCompleted: true,
          completedAt: now,
          rewardsGranted: true,
        },
        update: {
          currentProgress: target,
          isCompleted: true,
          completedAt: existing?.completedAt ?? now,
          rewardsGranted: true,
        },
      });

      if (!existing?.isCompleted) {
        await tx.achievement.update({
          where: { id: achievementId },
          data: { unlockedCount: { increment: 1 } },
        });
      }

      if (achievement.rewardRubies > 0 && !existing?.rewardsGranted) {
        await tx.playerStatistics.upsert({
          where: { userId },
          create: { userId, coins: achievement.rewardRubies },
          update: { coins: { increment: achievement.rewardRubies } },
        });
      }

      if (achievement.rewardBadgeType && !existing?.rewardsGranted) {
        const badgeType = achievement.rewardBadgeType as UserBadgeType;
        if (Object.values(UserBadgeType).includes(badgeType)) {
          const hasBadge = await tx.userBadge.findUnique({
            where: { userId_type: { userId, type: badgeType } },
          });
          if (!hasBadge) {
            await tx.userBadge.create({
              data: { userId, type: badgeType, grantedBy: 'system' },
            });
          }
        }
      }

      return ua;
    });

    const mapped = this.toAchievement(achievement);
    const progress = this.toProgress(userAchievement);
    const payload: AchievementUnlockedPayload = {
      achievement: mapped,
      userAchievement: progress,
      rewards: {
        rubies: existing?.rewardsGranted ? 0 : achievement.rewardRubies,
        badgeType: existing?.rewardsGranted ? null : achievement.rewardBadgeType,
        title: achievement.rewardTitle,
      },
    };

    if (!existing?.isCompleted) {
      void this.activity
        ?.createActivity({
          userId,
          type: ActivityType.ACHIEVEMENT_UNLOCKED,
          title: `получил достижение «${achievement.name}»`,
          description: achievement.description,
          imageUrl: achievement.iconUrl,
          actionUrl: `/achievements/${achievement.slug}`,
          metadata: {
            achievementId: achievement.id,
            slug: achievement.slug,
            rarity: achievement.rarity,
            category: achievement.category,
          },
        })
        .catch(() => undefined);

      const isHigh =
        achievement.rarity === AchievementRarity.LEGENDARY ||
        achievement.rarity === AchievementRarity.MYTHIC;

      void this.notifications
        .createNotification({
          userId,
          type: NotificationType.ACHIEVEMENT_UNLOCKED,
          title: `Достижение: ${achievement.name}`,
          message:
            achievement.rewardMessage ??
            (achievement.rewardRubies > 0
              ? `+${achievement.rewardRubies} рубинов`
              : achievement.description),
          link: `/achievements/${achievement.slug}`,
          imageUrl: achievement.iconUrl,
          metadata: {
            achievementId: achievement.id,
            slug: achievement.slug,
            rarity: achievement.rarity,
            priority: isHigh ? 'HIGH' : 'NORMAL',
          },
        })
        .catch(() => undefined);

      this.chatGateway?.emitAchievementUnlocked(userId, payload);
    }

    return payload;
  }

  async revokeAchievement(userId: string, achievementId: string): Promise<void> {
    const row = await this.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
    });
    if (!row) throw new NotFoundException('Достижение у пользователя не найдено');

    await this.prisma.$transaction(async (tx) => {
      await tx.userAchievement.delete({ where: { id: row.id } });
      if (row.isCompleted) {
        await tx.achievement.update({
          where: { id: achievementId },
          data: { unlockedCount: { decrement: 1 } },
        });
      }
    });
  }

  async checkUserAchievements(userId: string): Promise<AchievementUnlockedPayload[]> {
    const values = await this.collectUserValues(userId);
    const granted: AchievementUnlockedPayload[] = [];

    for (const [conditionType, value] of Object.entries(values)) {
      if (value === null || value === undefined) continue;
      const results = await this.checkAndGrantAchievement(
        userId,
        conditionType as AchievementConditionType,
        value,
      );
      granted.push(...results);
    }

    // Custom / special conditions
    const customGranted = await this.checkCustomAchievements(userId);
    granted.push(...customGranted);

    return granted;
  }

  @Cron('0 * * * *')
  async checkAllUsersCron(): Promise<void> {
    if (this.checkingAll) return;
    this.checkingAll = true;
    this.logger.log('Hourly achievements check started');

    try {
      await this.checkAllUsers();
    } catch (error) {
      this.logger.error(`Achievements cron failed: ${(error as Error).message}`);
    } finally {
      this.checkingAll = false;
    }
  }

  async checkAllUsers(): Promise<{ checked: number; granted: number }> {
    const users = await this.prisma.user.findMany({
      where: { isBanned: false },
      select: { id: true },
    });

    let granted = 0;
    for (const user of users) {
      try {
        const results = await this.checkUserAchievements(user.id);
        granted += results.length;
      } catch (error) {
        this.logger.warn(`Check failed for ${user.id}: ${(error as Error).message}`);
      }
    }

    this.logger.log(`Achievements check done: ${users.length} users, ${granted} grants`);
    return { checked: users.length, granted };
  }

  // ─── Admin CRUD ─────────────────────────────────────────

  async listAdmin(): Promise<Achievement[]> {
    const rows = await this.prisma.achievement.findMany({
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });
    return rows.map((r) => this.toAchievement(r));
  }

  async create(dto: CreateAchievementDto): Promise<Achievement> {
    try {
      const row = await this.prisma.achievement.create({
        data: {
          slug: dto.slug.trim(),
          name: dto.name.trim(),
          description: dto.description.trim(),
          iconUrl: dto.iconUrl.trim(),
          category: dto.category,
          rarity: dto.rarity,
          isSecret: dto.isSecret ?? false,
          isActive: dto.isActive ?? true,
          order: dto.order ?? 0,
          conditionType: dto.conditionType,
          conditionValue: dto.conditionValue ?? null,
          conditionParams: (dto.conditionParams as Prisma.InputJsonValue) ?? undefined,
          rewardRubies: dto.rewardRubies ?? 0,
          rewardBadgeType: dto.rewardBadgeType ?? null,
          rewardTitle: dto.rewardTitle ?? null,
          rewardMessage: dto.rewardMessage ?? null,
        },
      });
      return this.toAchievement(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Достижение с таким slug уже существует');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateAchievementDto): Promise<Achievement> {
    await this.requireAchievement(id);
    try {
      const row = await this.prisma.achievement.update({
        where: { id },
        data: {
          ...(dto.slug !== undefined ? { slug: dto.slug.trim() } : {}),
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
          ...(dto.iconUrl !== undefined ? { iconUrl: dto.iconUrl.trim() } : {}),
          ...(dto.category !== undefined ? { category: dto.category } : {}),
          ...(dto.rarity !== undefined ? { rarity: dto.rarity } : {}),
          ...(dto.isSecret !== undefined ? { isSecret: dto.isSecret } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.order !== undefined ? { order: dto.order } : {}),
          ...(dto.conditionType !== undefined ? { conditionType: dto.conditionType } : {}),
          ...(dto.conditionValue !== undefined ? { conditionValue: dto.conditionValue } : {}),
          ...(dto.conditionParams !== undefined
            ? {
                conditionParams:
                  dto.conditionParams === null
                    ? Prisma.JsonNull
                    : (dto.conditionParams as Prisma.InputJsonValue),
              }
            : {}),
          ...(dto.rewardRubies !== undefined ? { rewardRubies: dto.rewardRubies } : {}),
          ...(dto.rewardBadgeType !== undefined ? { rewardBadgeType: dto.rewardBadgeType } : {}),
          ...(dto.rewardTitle !== undefined ? { rewardTitle: dto.rewardTitle } : {}),
          ...(dto.rewardMessage !== undefined ? { rewardMessage: dto.rewardMessage } : {}),
        },
      });
      return this.toAchievement(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Достижение с таким slug уже существует');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.requireAchievement(id);
    await this.prisma.achievement.delete({ where: { id } });
  }

  async grantFirstLogin(userId: string): Promise<void> {
    const achievement = await this.prisma.achievement.findUnique({
      where: { slug: 'first-login' },
    });
    if (!achievement) return;
    await this.grantAchievement(userId, achievement.id).catch(() => undefined);
  }

  async grantBySlug(userId: string, slug: string): Promise<AchievementUnlockedPayload | null> {
    const achievement = await this.prisma.achievement.findUnique({ where: { slug } });
    if (!achievement) throw new NotFoundException('Достижение не найдено');
    return this.grantAchievement(userId, achievement.id);
  }

  // ─── Private helpers ────────────────────────────────────

  private async collectUserValues(
    userId: string,
  ): Promise<Partial<Record<AchievementConditionType, number>>> {
    const [
      user,
      stats,
      friendsCount,
      commentsCount,
      likesReceived,
      purchases,
      giftsSent,
      giftsReceived,
      profileViewsSent,
      badgesCount,
      bugReports,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { shortId: true, createdAt: true, lastLoginAt: true, lastActivityAt: true },
      }),
      this.prisma.playerStatistics.findUnique({ where: { userId } }),
      this.prisma.friendship.count({
        where: {
          status: FriendshipStatus.ACCEPTED,
          OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
      }),
      this.prisma.profileComment.count({ where: { authorId: userId, isDeleted: false } }),
      this.prisma.profileReaction.count({
        where: { profileId: userId, type: ReactionType.LIKE },
      }),
      this.prisma.order.findMany({
        where: { userId, status: OrderStatus.COMPLETED },
        select: { total: true },
      }),
      this.prisma.orderItem.count({
        where: { order: { userId, status: OrderStatus.COMPLETED }, giftToUserId: { not: null } },
      }),
      this.prisma.orderItem.count({
        where: { giftToUserId: userId, order: { status: OrderStatus.COMPLETED } },
      }),
      this.prisma.profileView.count({ where: { viewerId: userId } }),
      this.prisma.userBadge.count({ where: { userId } }),
      this.prisma.report.count({
        where: {
          authorId: userId,
          type: ReportType.TECHNICAL_ISSUE,
          status: ReportStatus.RESOLVED,
        },
      }),
    ]);

    if (!user) return {};

    const accountAgeDays = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalSpent = purchases.reduce((sum, o) => sum + Number(o.total), 0);
    const streak = await this.computeLoginStreak(userId);

    return {
      PLAYTIME_MINUTES: stats?.playTime ?? 0,
      KILLS_COUNT: stats?.kills ?? 0,
      DEATHS_COUNT: stats?.deaths ?? 0,
      FRIENDS_COUNT: friendsCount,
      COMMENTS_COUNT: commentsCount,
      LIKES_RECEIVED: likesReceived,
      PURCHASES_COUNT: purchases.length,
      TOTAL_SPENT: Math.floor(totalSpent),
      GIFTS_SENT: giftsSent,
      GIFTS_RECEIVED: giftsReceived,
      DAYS_STREAK: streak,
      ACCOUNT_AGE_DAYS: accountAgeDays,
      PROFILE_VIEWS: profileViewsSent,
      BADGES_COUNT: badgesCount,
      REGISTRATION_ORDER: user.shortId,
      BUG_REPORTED: bugReports,
      REPORTS_RESOLVED: bugReports,
    };
  }

  private async checkCustomAchievements(
    userId: string,
  ): Promise<AchievementUnlockedPayload[]> {
    const granted: AchievementUnlockedPayload[] = [];
    const customs = await this.prisma.achievement.findMany({
      where: { isActive: true, conditionType: AchievementConditionType.CUSTOM },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, lastActivityAt: true, lastLoginAt: true },
    });
    if (!user) return granted;

    // Site launch date ≈ earliest user or fixed
    const firstUser = await this.prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    const launchDate = firstUser?.createdAt ?? user.createdAt;
    const firstMonthEnd = new Date(launchDate);
    firstMonthEnd.setMonth(firstMonthEnd.getMonth() + 1);

    for (const achievement of customs) {
      const existing = await this.prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId: achievement.id } },
      });
      if (existing?.isCompleted) continue;

      const params = (achievement.conditionParams ?? {}) as Record<string, unknown>;
      let ok = false;

      if (params.type === 'first_month' && user.createdAt <= firstMonthEnd) {
        ok = true;
      }

      if (params.type === 'night_owl') {
        const fromHour = Number(params.fromHour ?? 2);
        const toHour = Number(params.toHour ?? 4);
        const activity = user.lastActivityAt ?? user.lastLoginAt;
        if (activity) {
          const hour = activity.getHours();
          ok = hour >= fromHour && hour < toHour;
        }
      }

      if (ok) {
        const payload = await this.grantAchievement(userId, achievement.id);
        if (payload) granted.push(payload);
      }
    }

    return granted;
  }

  private async computeLoginStreak(userId: string): Promise<number> {
    // Approximate streak from consecutive calendar days with lastActivityAt / audit of logins.
    // Use ProfileView + lastLoginAt as a lightweight signal; prefer Redis if available later.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastLoginAt: true, lastActivityAt: true, createdAt: true },
    });
    if (!user) return 0;

    const last = user.lastActivityAt ?? user.lastLoginAt;
    if (!last) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDay = new Date(last);
    lastDay.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 1) return 0;

    // Without a dedicated login-day table, estimate from account age capped by activity recency
    // Store progress in UserAchievement for DAYS_STREAK and only increment when last check was yesterday.
    const streakAchievements = await this.prisma.achievement.findMany({
      where: { conditionType: AchievementConditionType.DAYS_STREAK, isActive: true },
      select: { id: true },
    });

    let maxProgress = diffDays === 0 || diffDays === 1 ? 1 : 0;

    for (const a of streakAchievements) {
      const ua = await this.prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId: a.id } },
      });
      if (!ua || ua.isCompleted) {
        if (ua?.isCompleted) maxProgress = Math.max(maxProgress, ua.currentProgress);
        continue;
      }

      const updatedAt = new Date(ua.updatedAt);
      updatedAt.setHours(0, 0, 0, 0);
      const daysSinceUpdate = Math.floor(
        (today.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      let next = ua.currentProgress;
      if (daysSinceUpdate === 1) {
        next = ua.currentProgress + 1;
      } else if (daysSinceUpdate === 0) {
        next = Math.max(ua.currentProgress, 1);
      } else {
        next = 1;
      }
      maxProgress = Math.max(maxProgress, next);
    }

    return maxProgress;
  }

  private async loadProgressMap(
    userId: string,
    achievementIds: string[],
  ): Promise<Map<string, UserAchievementRow>> {
    if (achievementIds.length === 0) return new Map();
    const rows = await this.prisma.userAchievement.findMany({
      where: { userId, achievementId: { in: achievementIds } },
    });
    return new Map(rows.map((r) => [r.achievementId, r]));
  }

  private async requireAchievement(id: string): Promise<AchievementRow> {
    const row = await this.prisma.achievement.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Достижение не найдено');
    return row;
  }

  private toAchievement(row: AchievementRow): Achievement {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      iconUrl: row.iconUrl,
      category: row.category,
      rarity: row.rarity,
      isSecret: row.isSecret,
      isActive: row.isActive,
      order: row.order,
      conditionType: row.conditionType,
      conditionValue: row.conditionValue,
      conditionParams: (row.conditionParams as Record<string, unknown> | null) ?? null,
      rewardRubies: row.rewardRubies,
      rewardBadgeType: row.rewardBadgeType,
      rewardTitle: row.rewardTitle,
      rewardMessage: row.rewardMessage,
      unlockedCount: row.unlockedCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toProgress(row: UserAchievementRow): UserAchievementProgress {
    return {
      id: row.id,
      currentProgress: row.currentProgress,
      isCompleted: row.isCompleted,
      completedAt: row.completedAt?.toISOString() ?? null,
      isShowcased: row.isShowcased,
      showcaseOrder: row.showcaseOrder,
      rewardsGranted: row.rewardsGranted,
    };
  }

  private toWithProgress(
    row: AchievementRow,
    progress: UserAchievementRow | null,
  ): AchievementWithProgress {
    const isHidden = row.isSecret && !progress?.isCompleted;
    const target = row.conditionValue ?? 1;
    const current = progress?.currentProgress ?? 0;
    const progressPercent = progress?.isCompleted
      ? 100
      : Math.min(100, Math.round((current / Math.max(target, 1)) * 100));

    const base = this.toAchievement(row);

    if (isHidden) {
      return {
        ...base,
        name: '???',
        description: 'Секретное достижение',
        iconUrl: '/achievements/secret.svg',
        isHidden: true,
        progress: null,
        progressPercent: 0,
      };
    }

    return {
      ...base,
      isHidden: false,
      progress: progress ? this.toProgress(progress) : null,
      progressPercent,
    };
  }
}
