import { Injectable, NotFoundException } from '@nestjs/common';
import type { ChatChannel } from '@twomc/shared';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto, UpdateChannelDto } from './dto/chat.dto';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async listActive(): Promise<ChatChannel[]> {
    const rows = await this.prisma.chatChannel.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return rows.map(this.mapChannel);
  }

  async getBySlug(slug: string): Promise<ChatChannel> {
    return this.cache.wrap(cacheKeys.chatChannel(slug), CACHE_TTL.CHAT_CHANNEL, async () => {
      const row = await this.prisma.chatChannel.findFirst({
        where: { slug, isActive: true },
      });
      if (!row) throw new NotFoundException('Канал не найден');
      return this.mapChannel(row);
    });
  }

  async getById(id: string) {
    const row = await this.prisma.chatChannel.findUnique({ where: { id } });
    if (!row || !row.isActive) throw new NotFoundException('Канал не найден');
    return row;
  }

  async create(dto: CreateChannelDto): Promise<ChatChannel> {
    const row = await this.prisma.chatChannel.create({
      data: {
        slug: dto.slug.trim().toLowerCase(),
        name: dto.name.trim(),
        description: dto.description ?? null,
        type: dto.type,
        icon: dto.icon ?? null,
        isReadOnly: dto.isReadOnly ?? false,
        order: dto.order ?? 0,
      },
    });
    return this.mapChannel(row);
  }

  async update(id: string, dto: UpdateChannelDto): Promise<ChatChannel> {
    const existing = await this.prisma.chatChannel.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Канал не найден');

    const row = await this.prisma.chatChannel.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        isActive: dto.isActive,
        isReadOnly: dto.isReadOnly,
        order: dto.order,
      },
    });
    await this.cache.del(cacheKeys.chatChannel(row.slug));
    return this.mapChannel(row);
  }

  async remove(id: string) {
    const existing = await this.prisma.chatChannel.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Канал не найден');
    await this.prisma.chatChannel.delete({ where: { id } });
    await this.cache.del(cacheKeys.chatChannel(existing.slug));
  }

  private mapChannel(row: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    type: ChatChannel['type'];
    icon: string | null;
    isActive: boolean;
    isReadOnly: boolean;
    slowMode: number | null;
    order: number;
    minRoleGroup: string | null;
  }): ChatChannel {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      type: row.type,
      icon: row.icon,
      isActive: row.isActive,
      isReadOnly: row.isReadOnly,
      slowMode: row.slowMode,
      order: row.order,
      minRoleGroup: row.minRoleGroup,
    };
  }
}
