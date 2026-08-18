import { ConflictException, Injectable } from '@nestjs/common';
import { MiniGameType, Prisma } from '@prisma/client';
import type { MiniGameResult } from '@twomc/shared';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MinigamesService {
  constructor(private readonly prisma: PrismaService) {}

  roulette(userId: string, bet: number, color: 'RED' | 'BLACK' | 'GREEN') {
    const fair = this.fairRoll();
    const number = Math.floor(fair.roll * 37);
    const resultColor = number === 0 ? 'GREEN' : number % 2 === 0 ? 'BLACK' : 'RED';
    const multiplier = color === 'GREEN' ? 14 : 2;
    return this.settle(
      userId,
      MiniGameType.ROULETTE,
      bet,
      resultColor === color ? multiplier : 0,
      {
        number,
        color: resultColor,
        selectedColor: color,
      },
      fair,
    );
  }

  crash(userId: string, bet: number, autoCashout: number) {
    const fair = this.fairRoll();
    const roll = fair.roll;
    const crashAt = Math.min(100, Math.max(1, Math.floor((0.97 / (1 - roll)) * 100) / 100));
    return this.settle(
      userId,
      MiniGameType.CRASH,
      bet,
      crashAt >= autoCashout ? autoCashout : 0,
      {
        crashAt,
        autoCashout,
      },
      fair,
    );
  }

  upgrader(userId: string, bet: number, targetMultiplier: number) {
    const chance = 0.96 / targetMultiplier;
    const fair = this.fairRoll();
    const roll = fair.roll;
    return this.settle(
      userId,
      MiniGameType.UPGRADER,
      bet,
      roll <= chance ? targetMultiplier : 0,
      {
        chance,
        roll,
        targetMultiplier,
      },
      fair,
    );
  }

  async history(userId: string): Promise<MiniGameResult[]> {
    const rows = await this.prisma.gameRound.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return rows.map((row) => ({
      ...row,
      result: row.result as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      balance: 0,
    }));
  }

  private async settle(
    userId: string,
    game: MiniGameType,
    bet: number,
    multiplier: number,
    result: Record<string, unknown>,
    fair: { serverSeed: string; serverSeedHash: string; roll: number },
  ): Promise<MiniGameResult> {
    const { serverSeed, serverSeedHash } = fair;
    const payoutAmount = Math.floor(bet * multiplier);
    const won = payoutAmount > 0;
    return this.prisma.$transaction(
      async (tx) => {
        await tx.playerStatistics.upsert({
          where: { userId },
          create: { userId, coins: 0 },
          update: {},
        });
        const debit = await tx.playerStatistics.updateMany({
          where: { userId, coins: { gte: bet } },
          data: { coins: { decrement: bet } },
        });
        if (!debit.count) throw new ConflictException('Недостаточно рубинов для ставки');
        const stats = payoutAmount
          ? await tx.playerStatistics.update({
              where: { userId },
              data: { coins: { increment: payoutAmount } },
            })
          : await tx.playerStatistics.findUniqueOrThrow({ where: { userId } });
        const round = await tx.gameRound.create({
          data: {
            userId,
            game,
            betAmount: bet,
            payoutAmount,
            multiplier: won ? multiplier : 0,
            won,
            result: result as Prisma.InputJsonValue,
            serverSeed,
            serverSeedHash,
          },
        });
        return {
          id: round.id,
          game: round.game,
          betAmount: round.betAmount,
          payoutAmount: round.payoutAmount,
          multiplier: round.multiplier,
          won: round.won,
          balance: stats.coins,
          result,
          serverSeed,
          serverSeedHash,
          createdAt: round.createdAt.toISOString(),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private fairRoll() {
    const serverSeed = randomBytes(32).toString('hex');
    const serverSeedHash = createHash('sha256').update(serverSeed).digest('hex');
    const roll = Number.parseInt(serverSeed.slice(0, 12), 16) / 0x1000000000000;
    return { serverSeed, serverSeedHash, roll };
  }
}
