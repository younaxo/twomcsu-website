import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoleGroup } from '@prisma/client';
import {
  ChatMessage,
  ChatMessagesResponse,
  ChatOnlineUser,
  hasRoleGroup,
  NotificationType,
  RoleGroup as SharedRoleGroup,
} from '@twomc/shared';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { MarkdownService } from '../comments/markdown.service';
import { MentionsService } from '../comments/mentions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AntiSpamService } from './anti-spam.service';
import { ChannelsService } from './channels.service';
import { LinkPreviewService } from './link-preview.service';

const authorInclude = {
  author: {
    select: {
      id: true,
      username: true,
      avatar: true,
      roleGroup: true,
      position: {
        select: {
          id: true,
          name: true,
          slug: true,
          displayName: true,
          color: true,
          backgroundColor: true,
          icon: true,
          priority: true,
          group: true,
        },
      },
      badges: { select: { id: true, type: true } },
    },
  },
  parent: {
    select: {
      id: true,
      content: true,
      author: { select: { id: true, username: true } },
    },
  },
  reactions: { select: { emoji: true, userId: true } },
} as const;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly redis: RedisService,
    private readonly channels: ChannelsService,
    private readonly antiSpam: AntiSpamService,
    private readonly markdown: MarkdownService,
    private readonly mentions: MentionsService,
    private readonly linkPreview: LinkPreviewService,
    private readonly notifications: NotificationsService,
  ) {}

  async getRecent(channelId: string, viewerId?: string): Promise<ChatMessage[]> {
    const cached = await this.cache.get<ChatMessage[]>(cacheKeys.chatMessagesRecent(channelId));
    if (cached) {
      return viewerId ? this.withReactedByMe(cached, viewerId) : cached;
    }

    const rows = await this.prisma.chatMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: authorInclude,
    });

    const mapped = rows.reverse().map((row) => this.mapMessage(row, viewerId));
    await this.cache.set(cacheKeys.chatMessagesRecent(channelId), mapped, CACHE_TTL.CHAT_MESSAGES);
    return mapped;
  }

  async getHistory(
    slug: string,
    before?: string,
    limit = 50,
    viewerId?: string,
  ): Promise<ChatMessagesResponse> {
    const channel = await this.channels.getBySlug(slug);
    const take = Math.min(Math.max(limit, 1), 100);

    const rows = await this.prisma.chatMessage.findMany({
      where: {
        channelId: channel.id,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      include: authorInclude,
    });

    const hasMore = rows.length > take;
    const slice = hasMore ? rows.slice(0, take) : rows;
    return {
      items: slice.reverse().map((row) => this.mapMessage(row, viewerId)),
      hasMore,
    };
  }

  async getPinned(slug: string, viewerId?: string): Promise<ChatMessage[]> {
    const channel = await this.channels.getBySlug(slug);
    const rows = await this.prisma.chatMessage.findMany({
      where: { channelId: channel.id, isPinned: true, isDeleted: false },
      orderBy: { pinnedAt: 'desc' },
      include: authorInclude,
    });
    return rows.map((row) => this.mapMessage(row, viewerId));
  }

  async sendMessage(
    userId: string,
    channelId: string,
    content: string,
    parentId?: string,
  ): Promise<ChatMessage> {
    const channel = await this.channels.getById(channelId);
    await this.assertCanWrite(userId, channel);

    const trimmed = content.trim();
    if (!trimmed) throw new BadRequestException('Сообщение пустое');

    const spam = await this.antiSpam.canSendMessage(userId, channelId, trimmed, channel.slowMode);
    if (!spam.allowed) {
      throw new BadRequestException(
        spam.waitSeconds
          ? `${spam.reason} (${spam.waitSeconds} сек.)`
          : spam.reason,
      );
    }

    if (parentId) {
      const parent = await this.prisma.chatMessage.findFirst({
        where: { id: parentId, channelId },
      });
      if (!parent) throw new BadRequestException('Сообщение для ответа не найдено');
    }

    const contentHtml = this.markdown.render(trimmed);
    const mentionIds = await this.mentions.resolveMentionIds(trimmed);
    const links = this.linkPreview.extract(trimmed);

    const row = await this.prisma.chatMessage.create({
      data: {
        channelId,
        authorId: userId,
        content: trimmed,
        contentHtml,
        parentId: parentId ?? null,
        mentions: mentionIds,
        metadata: links.length ? ({ links } as Prisma.InputJsonValue) : undefined,
      },
      include: authorInclude,
    });

    await this.antiSpam.registerMessage(userId, channelId, trimmed, channel.slowMode);
    await this.cache.del(cacheKeys.chatMessagesRecent(channelId));

    const mapped = this.mapMessage(row, userId);

    for (const mentionedId of mentionIds) {
      if (mentionedId === userId) continue;
      const target = await this.prisma.user.findUnique({
        where: { id: mentionedId },
        select: { notifyOnMention: true, username: true },
      });
      if (!target?.notifyOnMention) continue;
      await this.notifications.createNotification({
        userId: mentionedId,
        type: NotificationType.CHAT_MENTION,
        title: 'Упоминание в чате',
        message: `${row.author?.username ?? 'Игрок'} упомянул вас в #${channel.slug}`,
        link: `/chat?channel=${channel.slug}`,
        fromUserId: userId,
        metadata: { channelId, messageId: row.id },
      });
    }

    return mapped;
  }

  async editMessage(userId: string, messageId: string, content: string): Promise<ChatMessage> {
    const existing = await this.requireMessage(messageId);
    if (existing.authorId !== userId) {
      throw new ForbiddenException('Можно редактировать только свои сообщения');
    }
    if (existing.isDeleted) throw new BadRequestException('Сообщение удалено');

    const trimmed = content.trim();
    const contentHtml = this.markdown.render(trimmed);
    const mentionIds = await this.mentions.resolveMentionIds(trimmed);
    const links = this.linkPreview.extract(trimmed);

    const row = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content: trimmed,
        contentHtml,
        mentions: mentionIds,
        isEdited: true,
        editedAt: new Date(),
        metadata: links.length ? ({ links } as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
      include: authorInclude,
    });

    await this.cache.del(cacheKeys.chatMessagesRecent(existing.channelId));
    return this.mapMessage(row, userId);
  }

  async deleteMessage(
    actorId: string,
    actorRole: RoleGroup,
    messageId: string,
    reason?: string,
  ): Promise<ChatMessage> {
    const existing = await this.requireMessage(messageId);
    const isMod = hasRoleGroup(actorRole as SharedRoleGroup, SharedRoleGroup.MODERATOR);
    if (existing.authorId !== actorId && !isMod) {
      throw new ForbiddenException('Недостаточно прав');
    }

    const row = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: actorId,
        deletedReason: reason ?? null,
        content: '',
        contentHtml: '<p><em>Сообщение удалено</em></p>',
      },
      include: authorInclude,
    });

    await this.cache.del(cacheKeys.chatMessagesRecent(existing.channelId));
    return this.mapMessage(row, actorId);
  }

  async pinMessage(actorId: string, actorRole: RoleGroup, messageId: string): Promise<ChatMessage> {
    if (!hasRoleGroup(actorRole as SharedRoleGroup, SharedRoleGroup.MODERATOR)) {
      throw new ForbiddenException('Недостаточно прав');
    }
    const existing = await this.requireMessage(messageId);
    const row = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isPinned: true,
        pinnedAt: new Date(),
        pinnedBy: actorId,
      },
      include: authorInclude,
    });
    await this.cache.del(cacheKeys.chatMessagesRecent(existing.channelId));
    return this.mapMessage(row, actorId);
  }

  async unpinMessage(actorId: string, actorRole: RoleGroup, messageId: string): Promise<ChatMessage> {
    if (!hasRoleGroup(actorRole as SharedRoleGroup, SharedRoleGroup.MODERATOR)) {
      throw new ForbiddenException('Недостаточно прав');
    }
    const existing = await this.requireMessage(messageId);
    const row = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { isPinned: false, pinnedAt: null, pinnedBy: null },
      include: authorInclude,
    });
    await this.cache.del(cacheKeys.chatMessagesRecent(existing.channelId));
    return this.mapMessage(row, actorId);
  }

  async addReaction(userId: string, messageId: string, emoji: string) {
    const existing = await this.requireMessage(messageId);
    await this.prisma.chatMessageReaction.upsert({
      where: { messageId_userId: { messageId, userId } },
      create: { messageId, userId, emoji },
      update: { emoji },
    });
    await this.cache.del(cacheKeys.chatMessagesRecent(existing.channelId));
    return { messageId, userId, emoji, channelId: existing.channelId };
  }

  async removeReaction(userId: string, messageId: string) {
    const existing = await this.requireMessage(messageId);
    await this.prisma.chatMessageReaction.deleteMany({ where: { messageId, userId } });
    await this.cache.del(cacheKeys.chatMessagesRecent(existing.channelId));
    return { messageId, userId, channelId: existing.channelId };
  }

  async search(q: string, channelSlug?: string, limit = 50) {
    const channel = channelSlug ? await this.channels.getBySlug(channelSlug) : null;
    const rows = await this.prisma.chatMessage.findMany({
      where: {
        content: { contains: q, mode: 'insensitive' },
        isDeleted: false,
        ...(channel ? { channelId: channel.id } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: authorInclude,
    });
    return rows.map((row) => this.mapMessage(row));
  }

  async getById(id: string, viewerId?: string) {
    const row = await this.prisma.chatMessage.findUnique({
      where: { id },
      include: authorInclude,
    });
    if (!row) throw new NotFoundException('Сообщение не найдено');
    return this.mapMessage(row, viewerId);
  }

  async setOnline(channelId: string, userId: string) {
    await this.redis.client.sadd(cacheKeys.chatOnline(channelId), userId);
  }

  async setOffline(channelId: string, userId: string) {
    await this.redis.client.srem(cacheKeys.chatOnline(channelId), userId);
  }

  async getOnlineUsers(channelId: string): Promise<ChatOnlineUser[]> {
    const ids = await this.redis.client.smembers(cacheKeys.chatOnline(channelId));
    if (ids.length === 0) return [];
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true, avatar: true, roleGroup: true },
      orderBy: { roleGroup: 'desc' },
    });
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      roleGroup: u.roleGroup as SharedRoleGroup,
    }));
  }

  async setTyping(channelId: string, userId: string) {
    const key = cacheKeys.chatTyping(channelId);
    await this.redis.client.sadd(key, userId);
    await this.redis.client.expire(key, 5);
  }

  async clearTyping(channelId: string, userId: string) {
    await this.redis.client.srem(cacheKeys.chatTyping(channelId), userId);
  }

  private async assertCanWrite(
    userId: string,
    channel: { id: string; isReadOnly: boolean; minRoleGroup: string | null },
  ) {
    const ban = await this.prisma.chatBan.findFirst({
      where: {
        userId,
        isActive: true,
        OR: [{ bannedUntil: null }, { bannedUntil: { gt: new Date() } }],
      },
    });
    if (ban) throw new ForbiddenException('Вы заблокированы в чате');

    const mute = await this.prisma.chatMute.findFirst({
      where: {
        userId,
        isActive: true,
        OR: [{ channelId: null }, { channelId: channel.id }],
        AND: [{ OR: [{ mutedUntil: null }, { mutedUntil: { gt: new Date() } }] }],
      },
    });
    if (mute) throw new ForbiddenException('Вы замучены в этом канале');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roleGroup: true },
    });
    if (!user) throw new ForbiddenException('Пользователь не найден');

    if (channel.isReadOnly || channel.minRoleGroup) {
      const required = (channel.minRoleGroup ?? 'MODERATOR') as SharedRoleGroup;
      if (!hasRoleGroup(user.roleGroup as SharedRoleGroup, required)) {
        throw new ForbiddenException('Недостаточно прав для записи в этот канал');
      }
    }
  }

  private async requireMessage(id: string) {
    const row = await this.prisma.chatMessage.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Сообщение не найдено');
    return row;
  }

  private withReactedByMe(messages: ChatMessage[], viewerId: string): ChatMessage[] {
    return messages.map((msg) => ({
      ...msg,
      reactions: msg.reactions.map((r) => ({
        ...r,
        reactedByMe: false,
      })),
    }));
  }

  private mapMessage(
    row: {
      id: string;
      channelId: string;
      authorId: string | null;
      type: ChatMessage['type'];
      content: string;
      contentHtml: string;
      parentId: string | null;
      mentions: string[];
      isPinned: boolean;
      isEdited: boolean;
      isDeleted: boolean;
      metadata: Prisma.JsonValue;
      createdAt: Date;
      updatedAt: Date;
      author?: {
        id: string;
        username: string;
        avatar: string | null;
        roleGroup: RoleGroup;
        position: {
          id: string;
          name: string;
          slug: string;
          displayName: string;
          color: string;
          backgroundColor: string | null;
          icon: string | null;
          priority: number;
          group: RoleGroup;
        } | null;
        badges: { id?: string; type: string }[];
      } | null;
      parent?: {
        id: string;
        content: string;
        author: { id: string; username: string } | null;
      } | null;
      reactions?: { emoji: string; userId: string }[];
    },
    viewerId?: string,
  ): ChatMessage {
    const reactionMap = new Map<string, { count: number; reactedByMe: boolean }>();
    for (const r of row.reactions ?? []) {
      const cur = reactionMap.get(r.emoji) ?? { count: 0, reactedByMe: false };
      cur.count += 1;
      if (viewerId && r.userId === viewerId) cur.reactedByMe = true;
      reactionMap.set(r.emoji, cur);
    }

    return {
      id: row.id,
      channelId: row.channelId,
      authorId: row.authorId,
      author: row.author
        ? {
            id: row.author.id,
            username: row.author.username,
            avatar: row.author.avatar,
            roleGroup: row.author.roleGroup as SharedRoleGroup,
            position: row.author.position
              ? {
                  id: row.author.position.id,
                  name: row.author.position.name,
                  slug: row.author.position.slug,
                  displayName: row.author.position.displayName,
                  color: row.author.position.color,
                  backgroundColor: row.author.position.backgroundColor,
                  icon: row.author.position.icon,
                  priority: row.author.position.priority,
                  group: row.author.position.group as SharedRoleGroup,
                }
              : null,
            badges: row.author.badges,
          }
        : null,
      type: row.type,
      content: row.isDeleted ? '' : row.content,
      contentHtml: row.isDeleted ? '<p><em>Сообщение удалено</em></p>' : row.contentHtml,
      parentId: row.parentId,
      parent: row.parent ?? null,
      mentions: row.mentions,
      isPinned: row.isPinned,
      isEdited: row.isEdited,
      isDeleted: row.isDeleted,
      metadata: (row.metadata as ChatMessage['metadata']) ?? null,
      reactions: [...reactionMap.entries()].map(([emoji, v]) => ({
        emoji,
        count: v.count,
        reactedByMe: v.reactedByMe,
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
