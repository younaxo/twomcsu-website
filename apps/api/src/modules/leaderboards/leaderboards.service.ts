import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  LeaderboardMetric,
  type LeaderboardResponse,
  type ProfileDecoration,
} from '@twomc/shared';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';

const metricFields: Record<LeaderboardMetric, keyof Pick<
  Prisma.PlayerStatisticsOrderByWithRelationInput,
  'playTime' | 'kills' | 'killDeathRatio' | 'coins' | 'hits'
>> = {
  PLAY_TIME: 'playTime',
  KILLS: 'kills',
  KILL_DEATH_RATIO: 'killDeathRatio',
  COINS: 'coins',
  HITS: 'hits',
};

@Injectable()
export class LeaderboardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async list(metric: LeaderboardMetric, requestedLimit: number): Promise<LeaderboardResponse> {
    const limit = Math.min(100, Math.max(1, requestedLimit));
    return this.cache.wrap(`leaderboards:${metric}:${limit}`, 60, async () => {
      const field = metricFields[metric];
      const orderBy: Prisma.PlayerStatisticsOrderByWithRelationInput[] = [
        { [field]: 'desc' },
        { playTime: 'desc' },
      ];
      const rows = await this.prisma.playerStatistics.findMany({
        where: {
          user: {
            hideStatistics: false,
            isBanned: false,
          },
        },
        orderBy,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              selectedDecoration: true,
            },
          },
        },
      });

      return {
        metric,
        updatedAt: new Date().toISOString(),
        items: rows.map((row, index) => ({
          rank: index + 1,
          user: {
            id: row.user.id,
            username: row.user.username,
            avatar: row.user.avatar,
            avatarDecoration: this.mapDecoration(row.user.selectedDecoration),
          },
          value: row[field],
          kills: row.kills,
          deaths: row.deaths,
          playTime: row.playTime,
          lastServer: row.lastServer,
        })),
      };
    });
  }

  private mapDecoration(row: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string;
    availability: ProfileDecoration['availability'];
    isActive: boolean;
    order: number;
  } | null): ProfileDecoration | null {
    if (!row?.isActive) return null;
    return row;
  }
}
