import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateServerPayload,
  GameServer,
  ServerHistoryPoint,
  ServerPlayer,
  ServersOverview,
  ServerStatusLogRow,
  ServerStatusSnapshot,
  UpdateServerPayload,
} from '@twomc/shared';
import { Prisma } from '@prisma/client';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { MonitoringService } from './monitoring.service';

@Injectable()
export class ServersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly monitoring: MonitoringService,
  ) {}

  async listActive(): Promise<GameServer[]> {
    return this.cache.wrap(cacheKeys.serversList(), CACHE_TTL.SERVERS_LIST, async () => {
      const servers = await this.prisma.server.findMany({
        where: { isActive: true },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      });
      return Promise.all(servers.map((s) => this.toGameServer(s)));
    });
  }

  async listAllAdmin(): Promise<GameServer[]> {
    const servers = await this.prisma.server.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    return Promise.all(servers.map((s) => this.toGameServer(s)));
  }

  async getBySlug(slug: string): Promise<GameServer> {
    const server = await this.prisma.server.findUnique({ where: { slug } });
    if (!server || !server.isActive) {
      throw new NotFoundException('Сервер не найден');
    }
    return this.toGameServer(server);
  }

  async getStatus(slug: string): Promise<ServerStatusSnapshot> {
    const server = await this.requireActiveBySlug(slug);
    const cached = await this.monitoring.getCachedStatus(server.id);
    if (cached) return cached;

    return {
      online: false,
      playerCount: 0,
      maxPlayers: server.maxPlayers,
      players: [],
      version: server.version,
      motd: server.motd,
      ping: null,
      checkedAt: new Date().toISOString(),
    };
  }

  async getPlayers(slug: string): Promise<ServerPlayer[]> {
    await this.requireActiveBySlug(slug);
    const status = await this.getStatus(slug);
    const names = status.players;

    if (names.length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        OR: names.map((name) => ({
          username: { equals: name, mode: 'insensitive' as const },
        })),
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        shortId: true,
        tag: true,
        lastServerActivity: true,
      },
    });

    const byLower = new Map(users.map((u) => [u.username.toLowerCase(), u]));

    return names.map((username) => {
      const user = byLower.get(username.toLowerCase()) ?? null;
      return {
        username,
        isRegistered: Boolean(user),
        user: user
          ? {
              id: user.id,
              username: user.username,
              avatar: user.avatar,
              shortId: user.shortId,
              tag: user.tag,
            }
          : null,
        lastServerActivity: user?.lastServerActivity?.toISOString() ?? null,
      };
    });
  }

  async getHistory(slug: string, days = 7): Promise<ServerHistoryPoint[]> {
    const server = await this.requireActiveBySlug(slug);
    const safeDays = Math.min(30, Math.max(1, days));
    const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

    const logs = await this.prisma.serverStatusLog.findMany({
      where: { serverId: server.id, timestamp: { gte: since } },
      orderBy: { timestamp: 'asc' },
      select: {
        timestamp: true,
        playerCount: true,
        online: true,
      },
    });

    // Downsample if too many points
    const maxPoints = 500;
    if (logs.length <= maxPoints) {
      return logs.map((l) => ({
        timestamp: l.timestamp.toISOString(),
        playerCount: l.playerCount,
        online: l.online,
      }));
    }

    const step = Math.ceil(logs.length / maxPoints);
    return logs
      .filter((_, i) => i % step === 0)
      .map((l) => ({
        timestamp: l.timestamp.toISOString(),
        playerCount: l.playerCount,
        online: l.online,
      }));
  }

  async getOverview(): Promise<ServersOverview> {
    return this.cache.wrap(
      cacheKeys.serversOverview(),
      CACHE_TTL.SERVERS_OVERVIEW,
      async () => {
        const servers = await this.listActive();
        const totalOnline = servers.reduce(
          (sum, s) => sum + (s.status?.online ? s.status.playerCount : 0),
          0,
        );
        const activeServers = servers.filter((s) => s.status?.online).length;

        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const peakAgg = await this.prisma.serverStatusLog.aggregate({
          where: { timestamp: { gte: since }, online: true },
          _max: { playerCount: true },
        });

        // Peak of sum per timestamp bucket is expensive; approximate via max single-server peak * active count fallback
        const perServerPeaks = await this.prisma.serverStatusLog.groupBy({
          by: ['serverId'],
          where: { timestamp: { gte: since }, online: true },
          _max: { playerCount: true },
        });
        const peakOnline24h = Math.max(
          peakAgg._max.playerCount ?? 0,
          perServerPeaks.reduce((sum, row) => sum + (row._max.playerCount ?? 0), 0),
        );

        const topServers = [...servers]
          .sort(
            (a, b) =>
              (b.status?.online ? b.status.playerCount : 0) -
              (a.status?.online ? a.status.playerCount : 0),
          )
          .slice(0, 4)
          .map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            type: s.type,
            playerCount: s.status?.playerCount ?? 0,
            maxPlayers: s.status?.maxPlayers ?? s.maxPlayers,
            online: s.status?.online ?? false,
          }));

        return {
          totalOnline,
          peakOnline24h,
          activeServers,
          topServers,
        };
      },
    );
  }

  async create(dto: CreateServerPayload): Promise<GameServer> {
    const existing = await this.prisma.server.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('Сервер с таким slug уже существует');
    }

    const server = await this.prisma.server.create({
      data: {
        name: dto.name.trim(),
        slug: dto.slug.trim().toLowerCase(),
        address: dto.address.trim(),
        port: dto.port ?? 25565,
        type: dto.type.trim().toLowerCase(),
        description: dto.description?.trim() || null,
        iconUrl: dto.iconUrl?.trim() || null,
        maxPlayers: dto.maxPlayers ?? 100,
        isActive: dto.isActive ?? true,
        order: dto.order ?? 0,
      },
    });

    await this.invalidateListCaches();
    return this.toGameServer(server);
  }

  async update(id: string, dto: UpdateServerPayload): Promise<GameServer> {
    await this.requireById(id);

    if (dto.slug) {
      const clash = await this.prisma.server.findFirst({
        where: { slug: dto.slug, NOT: { id } },
        select: { id: true },
      });
      if (clash) {
        throw new ConflictException('Сервер с таким slug уже существует');
      }
    }

    const data: Prisma.ServerUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.slug !== undefined) data.slug = dto.slug.trim().toLowerCase();
    if (dto.address !== undefined) data.address = dto.address.trim();
    if (dto.port !== undefined) data.port = dto.port;
    if (dto.type !== undefined) data.type = dto.type.trim().toLowerCase();
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.iconUrl !== undefined) data.iconUrl = dto.iconUrl?.trim() || null;
    if (dto.maxPlayers !== undefined) data.maxPlayers = dto.maxPlayers;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.order !== undefined) data.order = dto.order;

    const server = await this.prisma.server.update({ where: { id }, data });
    await this.invalidateListCaches();
    return this.toGameServer(server);
  }

  async remove(id: string): Promise<void> {
    await this.requireById(id);
    await this.prisma.server.delete({ where: { id } });
    await this.cache.del(cacheKeys.serverStatus(id));
    await this.invalidateListCaches();
  }

  async getLogs(
    id: string,
    opts?: { from?: Date; to?: Date; page?: number; limit?: number },
  ): Promise<{ items: ServerStatusLogRow[]; total: number; page: number; limit: number }> {
    await this.requireById(id);
    const page = Math.max(1, opts?.page ?? 1);
    const limit = Math.min(200, Math.max(1, opts?.limit ?? 50));
    const where: Prisma.ServerStatusLogWhereInput = {
      serverId: id,
      ...(opts?.from || opts?.to
        ? {
            timestamp: {
              ...(opts.from ? { gte: opts.from } : {}),
              ...(opts.to ? { lte: opts.to } : {}),
            },
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.serverStatusLog.count({ where }),
      this.prisma.serverStatusLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        online: row.online,
        playerCount: row.playerCount,
        maxPlayers: row.maxPlayers,
        players: row.players,
        version: row.version,
        motd: row.motd,
        ping: row.ping,
        timestamp: row.timestamp.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  private async requireActiveBySlug(slug: string) {
    const server = await this.prisma.server.findUnique({ where: { slug } });
    if (!server || !server.isActive) {
      throw new NotFoundException('Сервер не найден');
    }
    return server;
  }

  private async requireById(id: string) {
    const server = await this.prisma.server.findUnique({ where: { id } });
    if (!server) {
      throw new NotFoundException('Сервер не найден');
    }
    return server;
  }

  private async toGameServer(server: {
    id: string;
    name: string;
    slug: string;
    address: string;
    port: number;
    type: string;
    description: string | null;
    iconUrl: string | null;
    maxPlayers: number;
    version: string | null;
    motd: string | null;
    isActive: boolean;
    order: number;
  }): Promise<GameServer> {
    const status = await this.monitoring.getCachedStatus(server.id);
    return {
      id: server.id,
      name: server.name,
      slug: server.slug,
      address: server.address,
      port: server.port,
      type: server.type,
      description: server.description,
      iconUrl: server.iconUrl,
      maxPlayers: server.maxPlayers,
      version: status?.version ?? server.version,
      motd: status?.motd ?? server.motd,
      isActive: server.isActive,
      order: server.order,
      status,
    };
  }

  private async invalidateListCaches(): Promise<void> {
    await this.cache.del([cacheKeys.serversList(), cacheKeys.serversOverview()]);
  }
}
