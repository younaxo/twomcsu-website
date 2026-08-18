import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  MediaPartnerDashboard,
  ReferralDashboard,
  ReferralLeaderboardEntry,
} from '@twomc/shared';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

const SITE_URL = 'https://twomc.su';
const REWARD_BY_LEVEL = [100, 40, 20];

@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(userId: string): Promise<ReferralDashboard> {
    const user = await this.ensureReferralCode(userId);
    const rewards = await this.prisma.referralReward.findMany({
      where: { inviterId: userId },
      include: { invitedUser: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const levels = REWARD_BY_LEVEL.map((rewardPerInvite, index) => ({
      level: index + 1,
      count: rewards.filter((item) => item.level === index + 1).length,
      rewardPerInvite,
    }));
    return {
      code: user.referralCode,
      referralUrl: `${SITE_URL}/r/${encodeURIComponent(user.referralCode)}`,
      registrationUrl: `${SITE_URL}/register?promoCode=${encodeURIComponent(user.referralCode)}`,
      directCount: levels[0].count,
      networkCount: rewards.length,
      earned: rewards.reduce((sum, item) => sum + item.reward, 0),
      levels,
      recent: rewards.slice(0, 12).map((item) => ({
        username: item.invitedUser.username,
        level: item.level,
        reward: item.reward,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  async leaderboard(): Promise<ReferralLeaderboardEntry[]> {
    const grouped = await this.prisma.referralReward.groupBy({
      by: ['inviterId'],
      _count: true,
      _sum: { reward: true },
      orderBy: { _count: { inviterId: 'desc' } },
      take: 50,
    });
    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((item) => item.inviterId) }, isBanned: false },
      select: { id: true, username: true, avatar: true, _count: { select: { referrals: true } } },
    });
    const byId = new Map(users.map((user) => [user.id, user]));
    return grouped
      .flatMap((item) => {
        const user = byId.get(item.inviterId);
        if (!user) return [];
        return [
          {
            rank: 0,
            username: user.username,
            avatar: user.avatar,
            directCount: user._count.referrals,
            networkCount: item._count,
            earned: item._sum.reward ?? 0,
          },
        ];
      })
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }

  async mediaDashboard(userId: string): Promise<MediaPartnerDashboard> {
    let badges = await this.prisma.userMediaBadge.findMany({
      where: { userId, isApproved: true },
      include: {
        user: { select: { username: true } },
        promoCode: { include: { usages: { select: { usedAt: true } } } },
      },
      orderBy: { mediaGroup: 'asc' },
    });
    const missing = badges.filter((badge) => !badge.promoCodeId);
    if (missing.length) {
      await Promise.all(
        missing.map(async (badge) => {
          const code = `MEDIA_${badge.user.username}_${badge.mediaGroup.slice(0, 2)}`.toUpperCase();
          const promo = await this.prisma.promoCode.upsert({
            where: { code },
            create: {
              code,
              description: `Промокод медиа-партнёра ${badge.user.username}`,
              discountType: 'BONUS',
              discountValue: 0,
              applicableToTypes: [],
            },
            update: { isActive: true },
          });
          await this.prisma.userMediaBadge.update({
            where: { id: badge.id },
            data: { promoCodeId: promo.id },
          });
        }),
      );
      badges = await this.prisma.userMediaBadge.findMany({
        where: { userId, isApproved: true },
        include: {
          user: { select: { username: true } },
          promoCode: { include: { usages: { select: { usedAt: true } } } },
        },
        orderBy: { mediaGroup: 'asc' },
      });
    }
    const requests = await this.prisma.mediaBadgeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const since = Date.now() - 30 * 86_400_000;
    return {
      channels: badges.map((badge) => {
        const code = badge.promoCode?.code ?? null;
        return {
          id: badge.id,
          mediaGroup: badge.mediaGroup,
          channelUrl: badge.channelUrl,
          rank: badge.rank,
          promoCode: code,
          registrations: badge.promoCode?.usages.length ?? 0,
          registrations30d:
            badge.promoCode?.usages.filter((usage) => usage.usedAt.getTime() >= since).length ?? 0,
          referralUrl: code ? `${SITE_URL}/r/${encodeURIComponent(code)}` : null,
          registrationUrl: code
            ? `${SITE_URL}/register?promoCode=${encodeURIComponent(code)}`
            : null,
        };
      }),
      requests: requests.map((request) => ({
        ...request,
        createdAt: request.createdAt.toISOString(),
      })),
    };
  }

  async adminMediaPartners() {
    return this.prisma.userMediaBadge.findMany({
      orderBy: [{ mediaGroup: 'asc' }, { rank: 'desc' }],
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        promoCode: { select: { code: true, usedCount: true } },
      },
    });
  }

  async updateMediaRank(id: string, rank: number) {
    const badge = await this.prisma.userMediaBadge.findUnique({ where: { id } });
    if (!badge) throw new NotFoundException('Медиа-партнёр не найден');
    return this.prisma.userMediaBadge.update({ where: { id }, data: { rank } });
  }

  private async ensureReferralCode(userId: string): Promise<{ referralCode: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, referralCode: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    if (user.referralCode) return { referralCode: user.referralCode };
    const referralCode = `${user.username.toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
    await this.prisma.user.update({ where: { id: userId }, data: { referralCode } });
    return { referralCode };
  }
}
