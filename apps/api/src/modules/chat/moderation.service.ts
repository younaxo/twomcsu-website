import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleGroup } from '@prisma/client';
import { hasRoleGroup, RoleGroup as SharedRoleGroup } from '@twomc/shared';
import { PrismaService } from '../prisma/prisma.service';
import { BanUserDto, MuteUserDto } from './dto/chat.dto';

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async muteUser(actorId: string, actorRole: RoleGroup, dto: MuteUserDto) {
    if (!hasRoleGroup(actorRole as SharedRoleGroup, SharedRoleGroup.HELPER)) {
      throw new ForbiddenException('Недостаточно прав для мута');
    }

    const target = await this.prisma.user.findUnique({ where: { id: dto.targetId } });
    if (!target) throw new NotFoundException('Пользователь не найден');

    const mutedUntil = dto.durationMinutes
      ? new Date(Date.now() + dto.durationMinutes * 60_000)
      : null;

    return this.prisma.chatMute.create({
      data: {
        userId: dto.targetId,
        channelId: dto.channelId ?? null,
        reason: dto.reason,
        reasonNote: dto.reasonNote ?? null,
        mutedBy: actorId,
        mutedUntil,
      },
      include: {
        user: { select: { id: true, username: true } },
      },
    });
  }

  async unmute(muteId: string) {
    const mute = await this.prisma.chatMute.findUnique({ where: { id: muteId } });
    if (!mute) throw new NotFoundException('Мут не найден');
    return this.prisma.chatMute.update({
      where: { id: muteId },
      data: { isActive: false },
    });
  }

  async listMutes() {
    return this.prisma.chatMute.findMany({
      where: {
        isActive: true,
        OR: [{ mutedUntil: null }, { mutedUntil: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true } },
        channel: { select: { id: true, slug: true, name: true } },
      },
    });
  }

  async banUser(actorId: string, actorRole: RoleGroup, dto: BanUserDto) {
    if (!hasRoleGroup(actorRole as SharedRoleGroup, SharedRoleGroup.MODERATOR)) {
      throw new ForbiddenException('Недостаточно прав для бана');
    }

    const target = await this.prisma.user.findUnique({ where: { id: dto.targetId } });
    if (!target) throw new NotFoundException('Пользователь не найден');

    const bannedUntil = dto.durationMinutes
      ? new Date(Date.now() + dto.durationMinutes * 60_000)
      : null;

    return this.prisma.chatBan.create({
      data: {
        userId: dto.targetId,
        reason: dto.reason,
        bannedBy: actorId,
        bannedUntil,
      },
      include: {
        user: { select: { id: true, username: true } },
      },
    });
  }

  async unban(banId: string) {
    const ban = await this.prisma.chatBan.findUnique({ where: { id: banId } });
    if (!ban) throw new NotFoundException('Бан не найден');
    return this.prisma.chatBan.update({
      where: { id: banId },
      data: { isActive: false },
    });
  }

  async listBans() {
    return this.prisma.chatBan.findMany({
      where: {
        isActive: true,
        OR: [{ bannedUntil: null }, { bannedUntil: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true } },
      },
    });
  }

  async getSettings() {
    const keys = [
      'chat.blacklist',
      'chat.previewWhitelist',
      'chat.rateLimitCount',
      'chat.rateLimitWindowSec',
      'chat.defaultSlowMode',
    ];
    const rows = await this.prisma.siteSetting.findMany({
      where: { key: { in: keys } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      blacklist: map['chat.blacklist'] ?? '',
      previewWhitelist: map['chat.previewWhitelist'] ?? 'youtube.com,youtu.be,twitch.tv,imgur.com',
      rateLimitCount: Number(map['chat.rateLimitCount'] ?? 5),
      rateLimitWindowSec: Number(map['chat.rateLimitWindowSec'] ?? 10),
      defaultSlowMode: Number(map['chat.defaultSlowMode'] ?? 0),
    };
  }

  async updateSettings(data: {
    blacklist?: string;
    previewWhitelist?: string;
    rateLimitCount?: number;
    rateLimitWindowSec?: number;
    defaultSlowMode?: number;
  }) {
    const entries: Array<[string, string]> = [];
    if (data.blacklist !== undefined) entries.push(['chat.blacklist', String(data.blacklist)]);
    if (data.previewWhitelist !== undefined) {
      entries.push(['chat.previewWhitelist', String(data.previewWhitelist)]);
    }
    if (data.rateLimitCount !== undefined) {
      entries.push(['chat.rateLimitCount', String(data.rateLimitCount)]);
    }
    if (data.rateLimitWindowSec !== undefined) {
      entries.push(['chat.rateLimitWindowSec', String(data.rateLimitWindowSec)]);
    }
    if (data.defaultSlowMode !== undefined) {
      entries.push(['chat.defaultSlowMode', String(data.defaultSlowMode)]);
    }

    for (const [key, value] of entries) {
      await this.prisma.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }

    return this.getSettings();
  }
}
