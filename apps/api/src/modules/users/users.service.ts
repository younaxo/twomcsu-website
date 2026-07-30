import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  MediaBadgeRequestStatus,
  Prisma,
  ReactionType,
  SocialPlatform,
  UserBadgeType,
} from '@prisma/client';
import {
  BannerPreset,
  MediaBadgeRequest,
  MediaBadgeRequestAdmin,
  MyProfile,
  PlayerStatistics,
  ProfileReactionSummary,
  ProfileReport,
  MAX_USER_BADGES,
  RoleGroup,
  SocialLink,
  SuccessResponse,
  UserBadge,
  UserProfile,
  UserSearchHint,
  UserSearchResult,
  hasRoleGroup,
} from '@twomc/shared';
import { assertSearchLength } from '../../common/pagination';
import { selectFullProfile, selectMinimalUser } from '../../common/prisma/user-selects';
import { buildUserSearchWhere } from '../../common/user-search';
import { findUserByIdentifier } from '../../common/user-identifier';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { FriendsService } from '../friends/friends.service';
import { toPublicPosition } from '../positions/position.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateMediaRequestDto } from './dto/create-media-request.dto';
import { CreateProfileReportDto } from './dto/create-profile-report.dto';
import { GrantBadgeDto } from './dto/grant-badge.dto';
import { ReviewMediaRequestDto } from './dto/review-media-request.dto';
import { ReviewProfileReportDto } from './dto/review-profile-report.dto';
import { SetBannerPresetDto } from './dto/set-banner-preset.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateStatisticsDto } from './dto/update-statistics.dto';
import {
  ProfileUser,
  toBannerPreset,
  parseBirthDate,
  toMyProfile,
  toPublicProfile,
  toSocialLink,
  toStatistics,
  toUserBadge,
} from './profile.mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly cache: CacheService,
    @Inject(forwardRef(() => FriendsService))
    private readonly friends: FriendsService,
  ) {}

  async getMyProfile(userId: string): Promise<MyProfile> {
    const user = await this.requireProfileUser({ id: userId });
    const bannerUrl = await this.resolveBanner(user);

    return toMyProfile(user, bannerUrl);
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto): Promise<MyProfile> {
    const data: Prisma.UserUpdateInput = {};

    if (dto.statusText !== undefined) {
      data.statusText = dto.statusText?.trim() || null;
    }

    if (dto.bio !== undefined) {
      data.bio = dto.bio?.trim() || null;
    }

    if (dto.country !== undefined) {
      data.country = dto.country?.trim() || null;
    }

    if (dto.city !== undefined) {
      data.city = dto.city?.trim() || null;
    }

    if (dto.gender !== undefined) {
      data.gender = dto.gender;
    }

    if (dto.birthDate !== undefined) {
      if (dto.birthDate === null) {
        data.birthDate = null;
      } else {
        try {
          data.birthDate = parseBirthDate(dto.birthDate);
        } catch {
          throw new BadRequestException('Некорректная дата рождения');
        }
      }
    }

    if (dto.showBirthDate !== undefined) data.showBirthDate = dto.showBirthDate;
    if (dto.profileVisibility !== undefined) data.profileVisibility = dto.profileVisibility;
    if (dto.friendRequestPolicy !== undefined) data.friendRequestPolicy = dto.friendRequestPolicy;
    if (dto.commentPolicy !== undefined) data.commentPolicy = dto.commentPolicy;
    if (dto.notifyOnComment !== undefined) data.notifyOnComment = dto.notifyOnComment;
    if (dto.notifyOnMention !== undefined) data.notifyOnMention = dto.notifyOnMention;
    if (dto.notifyOnReply !== undefined) data.notifyOnReply = dto.notifyOnReply;
    if (dto.notifyOnFriendRequest !== undefined) data.notifyOnFriendRequest = dto.notifyOnFriendRequest;
    if (dto.notifyOnGift !== undefined) data.notifyOnGift = dto.notifyOnGift;
    if (dto.notifyOnOrder !== undefined) data.notifyOnOrder = dto.notifyOnOrder;
    if (dto.hideEmail !== undefined) data.hideEmail = dto.hideEmail;
    if (dto.hideCountry !== undefined) data.hideCountry = dto.hideCountry;
    if (dto.hideCity !== undefined) data.hideCity = dto.hideCity;
    if (dto.hideBirthDate !== undefined) data.hideBirthDate = dto.hideBirthDate;
    if (dto.hideGender !== undefined) data.hideGender = dto.hideGender;
    if (dto.hideStatistics !== undefined) data.hideStatistics = dto.hideStatistics;
    if (dto.hideSocials !== undefined) data.hideSocials = dto.hideSocials;

    try {
      await this.prisma.user.update({ where: { id: userId }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Этот Minecraft ник уже занят');
      }

      throw error;
    }

    await this.invalidateUserCache(userId);
    return this.getMyProfile(userId);
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<MyProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const path = await this.uploads.saveAvatar(userId, file);
    await this.prisma.user.update({ where: { id: userId }, data: { avatar: path } });
    await this.uploads.remove(user.avatar);
    await this.invalidateUserCache(userId);

    return this.getMyProfile(userId);
  }

  async deleteAvatar(userId: string): Promise<MyProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.prisma.user.update({ where: { id: userId }, data: { avatar: null } });
    await this.uploads.remove(user.avatar);
    await this.invalidateUserCache(userId);

    return this.getMyProfile(userId);
  }

  async uploadBanner(userId: string, file: Express.Multer.File): Promise<MyProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { banner: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const path = await this.uploads.saveBanner(userId, file);
    await this.prisma.user.update({
      where: { id: userId },
      data: { banner: path, bannerPreset: null },
    });
    await this.uploads.remove(user.banner);
    await this.invalidateUserCache(userId);

    return this.getMyProfile(userId);
  }

  async deleteBanner(userId: string): Promise<MyProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { banner: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { banner: null },
    });
    await this.uploads.remove(user.banner);
    await this.invalidateUserCache(userId);

    return this.getMyProfile(userId);
  }

  async setBannerPreset(userId: string, dto: SetBannerPresetDto): Promise<MyProfile> {
    const preset = await this.prisma.bannerPreset.findFirst({
      where: { id: dto.presetId, isActive: true },
    });

    if (!preset) {
      throw new NotFoundException('Пресет баннера не найден');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { banner: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { bannerPreset: preset.id, banner: null },
    });
    await this.uploads.remove(user.banner);
    await this.invalidateUserCache(userId);

    return this.getMyProfile(userId);
  }

  async listBannerPresets(): Promise<BannerPreset[]> {
    const rows = await this.prisma.bannerPreset.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return rows.map(toBannerPreset);
  }

  async listMySocials(userId: string): Promise<SocialLink[]> {
    const rows = await this.prisma.socialLink.findMany({
      where: { userId },
      orderBy: { platform: 'asc' },
    });

    return rows.map(toSocialLink);
  }

  async upsertSocial(
    userId: string,
    data: { platform: SocialPlatform; value: string },
  ): Promise<SocialLink> {
    const value = data.value.trim();

    if (!value) {
      throw new BadRequestException('Значение не может быть пустым');
    }

    const row = await this.prisma.socialLink.upsert({
      where: { userId_platform: { userId, platform: data.platform } },
      create: { userId, platform: data.platform, value },
      update: { value },
    });

    return toSocialLink(row);
  }

  async deleteSocial(userId: string, platform: string): Promise<void> {
    if (!Object.values(SocialPlatform).includes(platform as SocialPlatform)) {
      throw new BadRequestException('Неизвестная платформа');
    }

    const row = await this.prisma.socialLink.findUnique({
      where: { userId_platform: { userId, platform: platform as SocialPlatform } },
    });

    if (!row) {
      throw new NotFoundException('Ссылка не найдена');
    }

    await this.prisma.socialLink.delete({ where: { id: row.id } });
  }

  async listUserBadges(userId: string): Promise<UserBadge[]> {
    await this.requireUserExists(userId);

    const rows = await this.prisma.userBadge.findMany({
      where: { userId },
      orderBy: { grantedAt: 'asc' },
    });

    return rows.map(toUserBadge);
  }

  async grantBadge(userId: string, dto: GrantBadgeDto, grantedBy: string): Promise<UserBadge> {
    await this.requireUserExists(userId);

    const existing = await this.prisma.userBadge.findUnique({
      where: { userId_type: { userId, type: dto.type } },
    });

    const activeCount = await this.prisma.userBadge.count({
      where: { userId, isActive: true },
    });

    if (existing?.isActive !== true && activeCount >= MAX_USER_BADGES) {
      throw new BadRequestException('Максимум 3 префикса на игрока');
    }

    const row = await this.prisma.userBadge.upsert({
      where: { userId_type: { userId, type: dto.type } },
      create: {
        userId,
        type: dto.type,
        grantedBy,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: true,
      },
      update: {
        grantedBy,
        grantedAt: new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: true,
      },
    });

    return toUserBadge(row);
  }

  async revokeBadge(userId: string, type: string): Promise<void> {
    if (!Object.values(UserBadgeType).includes(type as UserBadgeType)) {
      throw new BadRequestException('Неизвестный тип бейджа');
    }

    const row = await this.prisma.userBadge.findUnique({
      where: { userId_type: { userId, type: type as UserBadgeType } },
    });

    if (!row) {
      throw new NotFoundException('Бейдж не найден');
    }

    await this.prisma.userBadge.delete({ where: { id: row.id } });
  }

  async createMediaRequest(userId: string, dto: CreateMediaRequestDto): Promise<MediaBadgeRequest> {
    const pending = await this.prisma.mediaBadgeRequest.findFirst({
      where: { userId, mediaGroup: dto.mediaGroup, status: MediaBadgeRequestStatus.PENDING },
    });

    if (pending) {
      throw new ConflictException('Заявка по этой платформе уже на рассмотрении');
    }

    const existing = await this.prisma.userMediaBadge.findUnique({
      where: { userId_mediaGroup: { userId, mediaGroup: dto.mediaGroup } },
    });

    if (existing?.isApproved) {
      throw new ConflictException('Медиа-бейдж по этой платформе уже выдан');
    }

    const row = await this.prisma.mediaBadgeRequest.create({
      data: {
        userId,
        mediaGroup: dto.mediaGroup,
        channelUrl: dto.channelUrl.trim(),
        description: dto.description?.trim() || null,
      },
    });

    return {
      id: row.id,
      mediaGroup: row.mediaGroup,
      channelUrl: row.channelUrl,
      description: row.description,
      status: row.status,
      reviewNote: row.reviewNote,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listMyMediaRequests(userId: string): Promise<MediaBadgeRequest[]> {
    const rows = await this.prisma.mediaBadgeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      mediaGroup: row.mediaGroup,
      channelUrl: row.channelUrl,
      description: row.description,
      status: row.status,
      reviewNote: row.reviewNote,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async listAdminMediaRequests(): Promise<MediaBadgeRequestAdmin[]> {
    const rows = await this.prisma.mediaBadgeRequest.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: { user: { include: { position: true } } },
    });

    return rows.map((row) => ({
      id: row.id,
      mediaGroup: row.mediaGroup,
      channelUrl: row.channelUrl,
      description: row.description,
      status: row.status,
      reviewNote: row.reviewNote,
      createdAt: row.createdAt.toISOString(),
      user: {
        id: row.user.id,
        username: row.user.username,
        avatar: row.user.avatar,
        position: toPublicPosition(row.user.position),
      },
    }));
  }

  async reviewMediaRequest(
    id: string,
    dto: ReviewMediaRequestDto,
    reviewerId: string,
  ): Promise<MediaBadgeRequestAdmin> {
    const row = await this.prisma.mediaBadgeRequest.findUnique({
      where: { id },
      include: { user: { include: { position: true } } },
    });

    if (!row) {
      throw new NotFoundException('Заявка не найдена');
    }

    if (row.status !== MediaBadgeRequestStatus.PENDING) {
      throw new ConflictException('Заявка уже обработана');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const request = await tx.mediaBadgeRequest.update({
        where: { id },
        data: {
          status: dto.status,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reviewNote: dto.reviewNote?.trim() || null,
        },
        include: { user: { include: { position: true } } },
      });

      if (dto.status === MediaBadgeRequestStatus.APPROVED) {
        await tx.userMediaBadge.upsert({
          where: {
            userId_mediaGroup: { userId: row.userId, mediaGroup: row.mediaGroup },
          },
          create: {
            userId: row.userId,
            mediaGroup: row.mediaGroup,
            channelUrl: row.channelUrl,
            isApproved: true,
            approvedBy: reviewerId,
            approvedAt: new Date(),
          },
          update: {
            channelUrl: row.channelUrl,
            isApproved: true,
            approvedBy: reviewerId,
            approvedAt: new Date(),
          },
        });
      }

      return request;
    });

    return {
      id: updated.id,
      mediaGroup: updated.mediaGroup,
      channelUrl: updated.channelUrl,
      description: updated.description,
      status: updated.status,
      reviewNote: updated.reviewNote,
      createdAt: updated.createdAt.toISOString(),
      user: {
        id: updated.user.id,
        username: updated.user.username,
        avatar: updated.user.avatar,
        position: toPublicPosition(updated.user.position),
      },
    };
  }

  async recordView(username: string, viewerId: string): Promise<SuccessResponse> {
    const profile = await findUserByIdentifier(this.prisma, username, {
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (profile.id === viewerId) {
      return { success: true };
    }

    await this.prisma.profileView.upsert({
      where: { profileId_viewerId: { profileId: profile.id, viewerId } },
      create: { profileId: profile.id, viewerId },
      update: { viewedAt: new Date() },
    });

    return { success: true };
  }

  async setReaction(
    username: string,
    viewerId: string,
    type: ReactionType | null,
  ): Promise<ProfileReactionSummary> {
    const profile = await findUserByIdentifier(this.prisma, username, {
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (profile.id === viewerId) {
      throw new BadRequestException('Нельзя реагировать на свой профиль');
    }

    if (type === null) {
      await this.prisma.profileReaction.deleteMany({
        where: { profileId: profile.id, userId: viewerId },
      });
    } else {
      await this.prisma.profileReaction.upsert({
        where: { profileId_userId: { profileId: profile.id, userId: viewerId } },
        create: { profileId: profile.id, userId: viewerId, type },
        update: { type },
      });
    }

    return this.reactionSummary(profile.id, viewerId);
  }

  async createReport(
    username: string,
    reporterId: string,
    dto: CreateProfileReportDto,
  ): Promise<SuccessResponse> {
    const profile = await findUserByIdentifier(this.prisma, username, {
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (profile.id === reporterId) {
      throw new BadRequestException('Нельзя пожаловаться на свой профиль');
    }

    try {
      await this.prisma.profileReport.create({
        data: {
          profileId: profile.id,
          reporterId,
          reason: dto.reason,
          description: dto.description?.trim() || null,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Вы уже жаловались на этот профиль');
      }

      throw error;
    }

    return { success: true, message: 'Жалоба отправлена' };
  }

  async listProfileReports(): Promise<ProfileReport[]> {
    const rows = await this.prisma.profileReport.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        profile: { include: { position: true } },
        reporter: { include: { position: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      reason: row.reason,
      description: row.description,
      status: row.status,
      reviewNote: row.reviewNote,
      createdAt: row.createdAt.toISOString(),
      profile: {
        id: row.profile.id,
        username: row.profile.username,
        position: toPublicPosition(row.profile.position),
      },
      reporter: {
        id: row.reporter.id,
        username: row.reporter.username,
        position: toPublicPosition(row.reporter.position),
      },
    }));
  }

  async reviewProfileReport(
    id: string,
    dto: ReviewProfileReportDto,
    reviewerId: string,
  ): Promise<ProfileReport> {
    const row = await this.prisma.profileReport.findUnique({
      where: { id },
      include: {
        profile: { include: { position: true } },
        reporter: { include: { position: true } },
      },
    });

    if (!row) {
      throw new NotFoundException('Жалоба не найдена');
    }

    const updated = await this.prisma.profileReport.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNote: dto.reviewNote?.trim() || null,
      },
      include: {
        profile: { include: { position: true } },
        reporter: { include: { position: true } },
      },
    });

    return {
      id: updated.id,
      reason: updated.reason,
      description: updated.description,
      status: updated.status,
      reviewNote: updated.reviewNote,
      createdAt: updated.createdAt.toISOString(),
      profile: {
        id: updated.profile.id,
        username: updated.profile.username,
        position: toPublicPosition(updated.profile.position),
      },
      reporter: {
        id: updated.reporter.id,
        username: updated.reporter.username,
        position: toPublicPosition(updated.reporter.position),
      },
    };
  }

  async getStatistics(username: string, viewer?: AuthenticatedUser | null): Promise<PlayerStatistics> {
    const user = await findUserByIdentifier(this.prisma, username, {
      select: {
        id: true,
        hideStatistics: true,
        profileVisibility: true,
        statistics: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const isOwner = viewer?.id === user.id;
    const isStaff = viewer ? hasRoleGroup(viewer.roleGroup, RoleGroup.MODERATOR) : false;

    if (user.profileVisibility === 'NOBODY' && !isOwner && !isStaff) {
      throw new ForbiddenException('Этот профиль скрыт');
    }

    if (user.hideStatistics && !isOwner && !isStaff) {
      throw new ForbiddenException('Статистика скрыта');
    }

    if (!user.statistics) {
      throw new NotFoundException('Статистика не найдена');
    }

    return toStatistics(user.statistics);
  }

  async updateStatistics(userId: string, dto: UpdateStatisticsDto): Promise<PlayerStatistics> {
    await this.requireUserExists(userId);

    const kills = dto.kills;
    const deaths = dto.deaths;
    const existing = await this.prisma.playerStatistics.findUnique({ where: { userId } });

    const nextKills = kills ?? existing?.kills ?? 0;
    const nextDeaths = deaths ?? existing?.deaths ?? 0;
    const killDeathRatio = nextDeaths === 0 ? nextKills : Number((nextKills / nextDeaths).toFixed(2));

    const row = await this.prisma.playerStatistics.upsert({
      where: { userId },
      create: {
        userId,
        coins: dto.coins ?? 0,
        playTime: dto.playTime ?? 0,
        kills: nextKills,
        deaths: nextDeaths,
        hits: dto.hits ?? 0,
        killDeathRatio,
        lastServer: dto.lastServer ?? null,
      },
      update: {
        ...(dto.coins !== undefined ? { coins: dto.coins } : {}),
        ...(dto.playTime !== undefined ? { playTime: dto.playTime } : {}),
        ...(dto.kills !== undefined ? { kills: dto.kills } : {}),
        ...(dto.deaths !== undefined ? { deaths: dto.deaths } : {}),
        ...(dto.hits !== undefined ? { hits: dto.hits } : {}),
        ...(dto.lastServer !== undefined ? { lastServer: dto.lastServer } : {}),
        killDeathRatio,
      },
    });

    return toStatistics(row);
  }

  async findPublicProfile(
    username: string,
    viewer?: AuthenticatedUser | null,
  ): Promise<UserProfile> {
    const user = await this.requireProfileUser({ username });
    const isOwner = viewer?.id === user.id;
    const canBypassPrivate = viewer
      ? hasRoleGroup(viewer.roleGroup, RoleGroup.MODERATOR)
      : false;

    if (user.profileVisibility === 'NOBODY' && !isOwner && !canBypassPrivate) {
      const bannerUrl = await this.resolveBanner(user);

      throw new ForbiddenException({
        restricted: true,
        reason: 'private',
        user: {
          username: user.username,
          avatar: user.avatar,
          position: toPublicPosition(user.position),
          bannerUrl,
          statusText: user.statusText,
        },
      });
    }

    if (user.profileVisibility === 'FRIENDS_ONLY' && !isOwner && !canBypassPrivate) {
      const isFriend = viewer ? await this.friends.areFriends(viewer.id, user.id) : false;

      if (!isFriend) {
        const bannerUrl = await this.resolveBanner(user);

        throw new ForbiddenException({
          restricted: true,
          reason: 'friends_only',
          user: {
            username: user.username,
            avatar: user.avatar,
            position: toPublicPosition(user.position),
            bannerUrl,
            statusText: user.statusText,
          },
        });
      }
    }

    const [bannerUrl, likesCount, dislikesCount, viewsCount, reaction] = await Promise.all([
      this.resolveBanner(user),
      this.prisma.profileReaction.count({
        where: { profileId: user.id, type: ReactionType.LIKE },
      }),
      this.prisma.profileReaction.count({
        where: { profileId: user.id, type: ReactionType.DISLIKE },
      }),
      this.prisma.profileView.count({ where: { profileId: user.id } }),
      viewer && !isOwner
        ? this.prisma.profileReaction.findUnique({
            where: { profileId_userId: { profileId: user.id, userId: viewer.id } },
          })
        : Promise.resolve(null),
    ]);

    return toPublicProfile(user, {
      bannerUrl,
      likesCount,
      dislikesCount,
      viewsCount,
      userReaction: reaction?.type ?? null,
      isOwner,
      canBypassPrivate,
    });
  }

  /** Username lookup for autocomplete and admin tools */
  async search(query: string, limit = 10): Promise<UserSearchResult[]> {
    const q = assertSearchLength(query);

    if (!q) {
      return [];
    }

    const take = Math.min(Math.max(limit, 1), 10);
    const cacheKey = cacheKeys.userSearch(q, take);

    return this.cache.wrap(cacheKey, CACHE_TTL.USER_SEARCH, async () =>
      this.findUsersBySearch(q, take),
    );
  }

  async searchHint(username: string): Promise<UserSearchHint> {
    const normalized = username.trim();
    if (!normalized || normalized.length < 2 || normalized.length > 16) {
      return { id: '', username: normalized, exists: false };
    }

    const user = await this.prisma.user.findUnique({
      where: { username: normalized },
      select: { id: true, username: true },
    });

    if (!user) {
      return { id: '', username: normalized, exists: false };
    }

    return { id: user.id, username: user.username, exists: true };
  }

  private async findUsersBySearch(query: string, limit: number): Promise<UserSearchResult[]> {
    const users = await this.prisma.user.findMany({
      where: buildUserSearchWhere(query),
      orderBy: { username: 'asc' },
      take: limit,
      select: selectMinimalUser,
    });

    return users.map((user) => ({
      id: user.id,
      shortId: user.shortId,
      tag: user.tag,
      username: user.username,
      avatar: user.avatar,
      roleGroup: user.roleGroup,
      position: toPublicPosition(user.position),
    }));
  }

  private async reactionSummary(
    profileId: string,
    viewerId: string,
  ): Promise<ProfileReactionSummary> {
    const [likesCount, dislikesCount, reaction] = await Promise.all([
      this.prisma.profileReaction.count({
        where: { profileId, type: ReactionType.LIKE },
      }),
      this.prisma.profileReaction.count({
        where: { profileId, type: ReactionType.DISLIKE },
      }),
      this.prisma.profileReaction.findUnique({
        where: { profileId_userId: { profileId, userId: viewerId } },
      }),
    ]);

    return {
      likesCount,
      dislikesCount,
      userReaction: reaction?.type ?? null,
    };
  }

  private async resolveBanner(user: Pick<ProfileUser, 'banner' | 'bannerPreset'>): Promise<string | null> {
    if (user.banner) {
      return user.banner;
    }

    if (!user.bannerPreset) {
      return null;
    }

    const preset = await this.prisma.bannerPreset.findUnique({
      where: { id: user.bannerPreset },
      select: { imageUrl: true },
    });

    return preset?.imageUrl ?? null;
  }

  private async requireProfileUser(
    where: { id: string } | { username: string },
  ): Promise<ProfileUser> {
    if ('id' in where) {
      const user = await this.prisma.user.findUnique({
        where: { id: where.id },
        select: selectFullProfile,
      });

      if (!user) {
        throw new NotFoundException('Пользователь не найден');
      }

      return user;
    }

    const user = await findUserByIdentifier(this.prisma, where.username, {
      select: selectFullProfile,
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    await this.cache.set(
      cacheKeys.userProfile(user.username),
      { id: user.id },
      CACHE_TTL.USER_PROFILE,
    );

    return user;
  }

  private async invalidateUserCache(userId: string, username?: string): Promise<void> {
    const keys = [cacheKeys.userById(userId), cacheKeys.authMe(userId)];

    if (username) {
      keys.push(cacheKeys.userProfile(username), cacheKeys.userByUsername(username));
    }

    await this.cache.del(keys);
    await this.cache.delPattern(`user:*${userId}*`);
  }

  private async requireUserExists(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
  }
}
