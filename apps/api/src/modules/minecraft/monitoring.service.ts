import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { status as mcStatus } from 'minecraft-server-util';
import type { ServerStatusSnapshot } from '@twomc/shared';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private checking = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  @Cron('*/30 * * * * *')
  async checkAllServers(): Promise<void> {
    if (this.checking) {
      return;
    }

    this.checking = true;
    try {
      const servers = await this.prisma.server.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      });

      await Promise.allSettled(servers.map((server) => this.checkServer(server)));
      await this.cache.del([cacheKeys.serversList(), cacheKeys.serversOverview()]);
    } catch (error) {
      this.logger.error('checkAllServers failed', error instanceof Error ? error.stack : error);
    } finally {
      this.checking = false;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldLogs(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await this.prisma.serverStatusLog.deleteMany({
      where: { timestamp: { lt: cutoff } },
    });
    this.logger.log(`Deleted ${result.count} server status logs older than 30 days`);
  }

  async getCachedStatus(serverId: string): Promise<ServerStatusSnapshot | null> {
    return this.cache.get<ServerStatusSnapshot>(cacheKeys.serverStatus(serverId));
  }

  private async checkServer(server: {
    id: string;
    slug: string;
    address: string;
    port: number;
    maxPlayers: number;
  }): Promise<void> {
    const started = Date.now();
    let snapshot: ServerStatusSnapshot;

    try {
      const result = await mcStatus(server.address, server.port, { timeout: 5000 });
      const sample = result.players.sample?.map((p) => p.name) ?? [];
      const motd =
        typeof result.motd === 'object' && result.motd !== null && 'clean' in result.motd
          ? (result.motd as { clean: string }).clean
          : String(result.motd ?? '');

      snapshot = {
        online: true,
        playerCount: result.players.online,
        maxPlayers: result.players.max || server.maxPlayers,
        players: sample,
        version: result.version?.name ?? null,
        motd: motd || null,
        ping: Date.now() - started,
        checkedAt: new Date().toISOString(),
      };

      await this.prisma.server.update({
        where: { id: server.id },
        data: {
          version: snapshot.version,
          motd: snapshot.motd,
        },
      });
    } catch {
      snapshot = {
        online: false,
        playerCount: 0,
        maxPlayers: server.maxPlayers,
        players: [],
        version: null,
        motd: null,
        ping: null,
        checkedAt: new Date().toISOString(),
      };
    }

    await this.cache.set(cacheKeys.serverStatus(server.id), snapshot, CACHE_TTL.SERVER_STATUS);

    await this.prisma.serverStatusLog.create({
      data: {
        serverId: server.id,
        online: snapshot.online,
        playerCount: snapshot.playerCount,
        maxPlayers: snapshot.maxPlayers,
        players: snapshot.players,
        version: snapshot.version,
        motd: snapshot.motd,
        ping: snapshot.ping,
      },
    });

    await this.updatePlayersStatus(server.id, server.slug, snapshot.players);
  }

  private async updatePlayersStatus(
    serverId: string,
    serverSlug: string,
    playerNames: string[],
  ): Promise<void> {
    const now = new Date();
    const namesLower = playerNames.map((n) => n.toLowerCase());

    if (playerNames.length > 0) {
      const users = await this.prisma.user.findMany({
        where: {
          OR: playerNames.map((name) => ({
            username: { equals: name, mode: 'insensitive' as const },
          })),
        },
        select: { id: true },
      });

      if (users.length > 0) {
        await this.prisma.user.updateMany({
          where: { id: { in: users.map((u) => u.id) } },
          data: {
            currentServer: serverSlug,
            currentServerId: serverId,
            lastServerActivity: now,
            isOnlineInGame: true,
          },
        });
      }
    }

    const staleBefore = new Date(Date.now() - 2 * 60 * 1000);
    const onlineOnServer = await this.prisma.user.findMany({
      where: {
        currentServerId: serverId,
        isOnlineInGame: true,
      },
      select: { id: true, username: true, lastServerActivity: true },
    });

    const toOffline = onlineOnServer.filter((user) => {
      if (namesLower.includes(user.username.toLowerCase())) {
        return false;
      }
      if (!user.lastServerActivity) {
        return true;
      }
      return user.lastServerActivity < staleBefore;
    });

    if (toOffline.length > 0) {
      await this.prisma.user.updateMany({
        where: { id: { in: toOffline.map((u) => u.id) } },
        data: {
          isOnlineInGame: false,
          currentServer: null,
          currentServerId: null,
        },
      });
    }
  }
}
