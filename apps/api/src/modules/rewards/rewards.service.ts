import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, RewardRarity } from '@prisma/client';
import type { RewardsOverview } from '@twomc/shared';
import { createHmac, randomInt } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 86_400_000;
const NORMAL_CARDS = [
  { reward: 15, rarity: RewardRarity.COMMON },
  { reward: 20, rarity: RewardRarity.COMMON },
  { reward: 25, rarity: RewardRarity.COMMON },
  { reward: 35, rarity: RewardRarity.RARE },
  { reward: 45, rarity: RewardRarity.RARE },
  { reward: 60, rarity: RewardRarity.EPIC },
  { reward: 75, rarity: RewardRarity.EPIC },
  { reward: 100, rarity: RewardRarity.LEGENDARY },
];
const LEGENDARY_CARDS = [200, 250, 300, 350, 400, 500, 750, 1_000].map((reward) => ({
  reward,
  rarity: RewardRarity.LEGENDARY,
}));
const WHEEL_PRIZES = [
  { reward: 20, rarity: RewardRarity.COMMON, weight: 30 },
  { reward: 40, rarity: RewardRarity.COMMON, weight: 24 },
  { reward: 75, rarity: RewardRarity.RARE, weight: 20 },
  { reward: 125, rarity: RewardRarity.RARE, weight: 13 },
  { reward: 250, rarity: RewardRarity.EPIC, weight: 8 },
  { reward: 500, rarity: RewardRarity.EPIC, weight: 4 },
  { reward: 1_000, rarity: RewardRarity.LEGENDARY, weight: 1 },
];

@Injectable()
export class RewardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async overview(userId: string): Promise<RewardsOverview> {
    const now = new Date();
    const day = this.dayKey(now);
    const week = this.weekKey(now);
    const [latest, today, wheel, statistics] = await Promise.all([
      this.prisma.dailyRewardClaim.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.dailyRewardClaim.findUnique({
        where: { userId_claimDay: { userId, claimDay: day } },
      }),
      this.prisma.wheelSpin.findUnique({ where: { userId_weekKey: { userId, weekKey: week } } }),
      this.prisma.playerStatistics.findUnique({ where: { userId }, select: { coins: true } }),
    ]);
    const streak =
      today?.streak ?? (latest && this.dayDistance(latest.claimDay, day) === 1 ? latest.streak : 0);
    const cardSet = this.cardsFor(userId, day, streak + (today ? 0 : 1));
    return {
      balance: statistics?.coins ?? 0,
      streak,
      canClaim: !today,
      nextClaimAt: today ? this.nextDay(now).toISOString() : null,
      cards: cardSet.map((card, index) => ({
        index,
        rarity: card.rarity,
        revealed: today?.cardIndex === index,
        reward: today?.cardIndex === index ? today.reward : null,
      })),
      wheel: {
        canSpin: !wheel,
        nextSpinAt: wheel ? this.nextWeek(now).toISOString() : null,
        prizes: WHEEL_PRIZES.map(({ reward, rarity }) => ({ reward, rarity })),
      },
    };
  }

  async claimCard(userId: string, cardIndex: number) {
    const now = new Date();
    const claimDay = this.dayKey(now);
    return this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.dailyRewardClaim.findUnique({
          where: { userId_claimDay: { userId, claimDay } },
        });
        if (existing) throw new ConflictException('Сегодня награда уже получена');
        const latest = await tx.dailyRewardClaim.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        const streak =
          latest && this.dayDistance(latest.claimDay, claimDay) === 1
            ? Math.min(7, latest.streak + 1)
            : 1;
        const prize = this.cardsFor(userId, claimDay, streak)[cardIndex];
        const claim = await tx.dailyRewardClaim.create({
          data: { userId, claimDay, streak, reward: prize.reward, cardIndex, rarity: prize.rarity },
        });
        const stats = await tx.playerStatistics.upsert({
          where: { userId },
          create: { userId, coins: prize.reward },
          update: { coins: { increment: prize.reward } },
        });
        return {
          reward: claim.reward,
          rarity: claim.rarity,
          streak: claim.streak,
          balance: stats.coins,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async spinWheel(userId: string) {
    const now = new Date();
    const weekKey = this.weekKey(now);
    return this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.wheelSpin.findUnique({
          where: { userId_weekKey: { userId, weekKey } },
        });
        if (existing) throw new ConflictException('Колесо уже использовано на этой неделе');
        const segment = this.weightedIndex(WHEEL_PRIZES.map((item) => item.weight));
        const prize = WHEEL_PRIZES[segment];
        await tx.wheelSpin.create({
          data: { userId, reward: prize.reward, segment, weekKey, rarity: prize.rarity },
        });
        const stats = await tx.playerStatistics.upsert({
          where: { userId },
          create: { userId, coins: prize.reward },
          update: { coins: { increment: prize.reward } },
        });
        return { segment, reward: prize.reward, rarity: prize.rarity, balance: stats.coins };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private cardsFor(userId: string, day: string, streak: number) {
    const source = streak >= 7 ? LEGENDARY_CARDS : NORMAL_CARDS;
    const keyed = source.map((card, index) => ({
      card,
      key: this.digest(`${userId}:${day}:${index}`),
    }));
    return keyed.sort((a, b) => a.key.localeCompare(b.key)).map(({ card }) => card);
  }

  private digest(value: string) {
    const secret = this.config.get<string>('jwt.secret') ?? 'twomc-rewards';
    return createHmac('sha256', secret).update(value).digest('hex');
  }

  private weightedIndex(weights: number[]) {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let roll = randomInt(total);
    for (let index = 0; index < weights.length; index += 1) {
      roll -= weights[index];
      if (roll < 0) return index;
    }
    return 0;
  }

  private dayKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }
  private dayDistance(from: string, to: string) {
    return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
  }
  private nextDay(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
  }
  private weekKey(date: Date) {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() - day + 1);
    return this.dayKey(d);
  }
  private nextWeek(date: Date) {
    const monday = new Date(`${this.weekKey(date)}T00:00:00Z`);
    return new Date(monday.getTime() + 7 * DAY_MS);
  }
}
