import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import type { VotingOverview } from '@twomc/shared';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVoteSiteDto, UpdateVoteSiteDto, VoteWebhookDto } from './dto/voting.dto';

@Injectable()
export class VotingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async overview(userId?: string | null): Promise<VotingOverview> {
    const [sites, user, totals] = await Promise.all([
      this.prisma.voteSite.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          votes: userId ? { where: { userId }, orderBy: { votedAt: 'desc' }, take: 1 } : false,
        },
      }),
      userId
        ? this.prisma.user.findUnique({ where: { id: userId }, select: { username: true } })
        : null,
      userId
        ? this.prisma.playerVote.aggregate({
            where: { userId },
            _count: true,
            _sum: { rewardCoins: true },
          })
        : null,
    ]);
    const now = Date.now();
    return {
      sites: sites.map((site) => {
        const lastVotedAt = 'votes' in site ? (site.votes[0]?.votedAt ?? null) : null;
        const nextVoteAt = lastVotedAt
          ? new Date(lastVotedAt.getTime() + site.cooldownHours * 60 * 60 * 1000)
          : null;
        return {
          id: site.id,
          slug: site.slug,
          name: site.name,
          description: site.description,
          url: user?.username
            ? site.url.replace('{username}', encodeURIComponent(user.username))
            : site.url,
          logoUrl: site.logoUrl,
          rewardCoins: site.rewardCoins,
          cooldownHours: site.cooldownHours,
          sortOrder: site.sortOrder,
          isActive: site.isActive,
          lastVotedAt: lastVotedAt?.toISOString() ?? null,
          nextVoteAt: nextVoteAt?.toISOString() ?? null,
          canVote: !nextVoteAt || nextVoteAt.getTime() <= now,
        };
      }),
      totalVotes: totals?._count ?? 0,
      totalEarned: totals?._sum.rewardCoins ?? 0,
    };
  }

  async adminList() {
    return this.prisma.voteSite.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { votes: true } } },
    });
  }

  async create(dto: CreateVoteSiteDto) {
    const secret = randomBytes(32).toString('hex');
    const site = await this.prisma.voteSite.create({
      data: { ...dto, webhookSecretHash: this.hash(secret) },
    });
    return { site, webhookSecret: secret };
  }

  async update(id: string, dto: UpdateVoteSiteDto) {
    return this.prisma.voteSite.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.voteSite.delete({ where: { id } });
  }

  async rotateSecret(id: string) {
    const secret = randomBytes(32).toString('hex');
    await this.prisma.voteSite.update({
      where: { id },
      data: { webhookSecretHash: this.hash(secret) },
    });
    return { webhookSecret: secret };
  }

  async processWebhook(slug: string, secret: string | undefined, dto: VoteWebhookDto) {
    const site = await this.prisma.voteSite.findUnique({ where: { slug } });
    if (!site?.isActive) throw new NotFoundException('Сайт голосования не найден');
    if (!secret || !this.safeEqual(site.webhookSecretHash, this.hash(secret))) {
      throw new ForbiddenException('Неверная подпись webhook');
    }
    if (dto.externalId) {
      const existing = await this.prisma.playerVote.findUnique({
        where: { siteId_externalId: { siteId: site.id, externalId: dto.externalId } },
      });
      if (existing) return { accepted: true, duplicate: true, rewardCoins: existing.rewardCoins };
    }

    const result = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findFirst({
          where: { username: { equals: dto.username.trim(), mode: 'insensitive' } },
          select: { id: true, username: true },
        });
        if (!user) throw new NotFoundException('Пользователь не найден');
        const latest = await tx.playerVote.findFirst({
          where: { siteId: site.id, userId: user.id },
          orderBy: { votedAt: 'desc' },
        });
        const availableAt = latest
          ? new Date(latest.votedAt.getTime() + site.cooldownHours * 60 * 60 * 1000)
          : null;
        if (availableAt && availableAt > new Date()) {
          throw new ConflictException(`Следующий голос доступен ${availableAt.toISOString()}`);
        }
        const vote = await tx.playerVote.create({
          data: {
            siteId: site.id,
            userId: user.id,
            externalId: dto.externalId,
            rewardCoins: site.rewardCoins,
          },
        });
        await tx.playerStatistics.upsert({
          where: { userId: user.id },
          create: { userId: user.id, coins: site.rewardCoins },
          update: { coins: { increment: site.rewardCoins } },
        });
        return { user, vote };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await this.notifications.createNotification({
      userId: result.user.id,
      type: NotificationType.SYSTEM,
      title: 'Награда за голосование',
      message: `Спасибо за голос на ${site.name}! Начислено ${site.rewardCoins} рубинов.`,
      link: '/vote',
      metadata: { voteId: result.vote.id, siteId: site.id, rewardCoins: site.rewardCoins },
    });
    return { accepted: true, duplicate: false, rewardCoins: site.rewardCoins };
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private safeEqual(left: string, right: string): boolean {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
