import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationRole,
  ConversationType,
  DirectMessagePolicy,
  FriendshipStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import type {
  Conversation as ConversationView,
  ConversationsResponse,
  DirectMessage as DirectMessageView,
  DirectMessagesResponse,
  GroupInvite as GroupInviteView,
  GroupInvitePreview,
} from '@twomc/shared';
import { randomBytes } from 'node:crypto';
import { findUserByIdentifier } from '../../common/user-identifier';
import { MarkdownService } from '../comments/markdown.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

const MAX_GROUP_MEMBERS = 10;
const userSelect = { id: true, username: true, avatar: true } as const;
const messageInclude = Prisma.validator<Prisma.DirectMessageInclude>()({
  sender: { select: userSelect },
  parent: { include: { sender: { select: userSelect } } },
  reactions: { include: { user: { select: userSelect } }, orderBy: { createdAt: 'asc' } },
  attachments: { orderBy: { createdAt: 'asc' } },
});
const conversationInclude = Prisma.validator<Prisma.ConversationInclude>()({
  members: {
    include: { user: { select: userSelect } },
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
  },
  messages: { take: 1, orderBy: { createdAt: 'desc' }, include: messageInclude },
});

type MessageRow = Prisma.DirectMessageGetPayload<{ include: typeof messageInclude }>;
type ConversationRow = Prisma.ConversationGetPayload<{ include: typeof conversationInclude }>;

@Injectable()
export class DirectMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly markdown: MarkdownService,
    private readonly notifications: NotificationsService,
    private readonly uploads: UploadsService,
  ) {}

  async listConversations(userId: string): Promise<ConversationsResponse> {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId, isArchived: false },
      orderBy: { conversation: { lastMessageAt: 'desc' } },
      include: { conversation: { include: conversationInclude } },
    });

    const items = await Promise.all(
      memberships.map(async (membership) => {
        const unreadCount = await this.prisma.directMessage.count({
          where: {
            conversationId: membership.conversationId,
            createdAt: { gt: membership.lastReadAt },
            senderId: { not: userId },
            isDeleted: false,
          },
        });
        return this.mapConversation(membership.conversation, userId, unreadCount);
      }),
    );

    return {
      items,
      totalUnread: items.reduce((sum, item) => sum + item.unreadCount, 0),
    };
  }

  async getConversation(userId: string, conversationId: string): Promise<ConversationView> {
    await this.requireMember(conversationId, userId);
    const row = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: conversationInclude,
    });
    if (!row) throw new NotFoundException('Диалог не найден');

    const member = row.members.find((item) => item.userId === userId)!;
    const unreadCount = await this.prisma.directMessage.count({
      where: {
        conversationId,
        createdAt: { gt: member.lastReadAt },
        senderId: { not: userId },
        isDeleted: false,
      },
    });
    return this.mapConversation(row, userId, unreadCount);
  }

  async createDirect(userId: string, username: string): Promise<ConversationView> {
    const target = await this.requireUser(username);
    if (target.id === userId) throw new BadRequestException('Нельзя написать самому себе');

    await this.assertNotBlocked(userId, target.id);
    const directKey = [userId, target.id].sort().join(':');
    const existing = await this.prisma.conversation.findUnique({
      where: { directKey },
      include: conversationInclude,
    });
    if (existing) {
      await this.prisma.conversationMember.updateMany({
        where: { conversationId: existing.id, userId },
        data: { isArchived: false },
      });
      return this.mapConversation(existing, userId, 0);
    }

    await this.assertCanContact(userId, target.id, target.directMessagePolicy);
    const conversation = await this.prisma.$transaction(async (tx) =>
      tx.conversation.create({
        data: {
          type: ConversationType.DIRECT,
          directKey,
          createdById: userId,
          members: {
            create: [
              { userId, role: ConversationRole.OWNER },
              { userId: target.id, role: ConversationRole.MEMBER },
            ],
          },
        },
        include: conversationInclude,
      }),
    );
    return this.mapConversation(conversation, userId, 0);
  }

  async createGroup(userId: string, title: string, usernames: string[]): Promise<ConversationView> {
    const normalized = [...new Set(usernames.map((item) => item.trim().toLowerCase()).filter(Boolean))];
    if (normalized.length + 1 > MAX_GROUP_MEMBERS) {
      throw new BadRequestException(`В группе может быть не больше ${MAX_GROUP_MEMBERS} участников`);
    }

    const targets = await Promise.all(normalized.map((username) => this.requireUser(username)));
    for (const target of targets) {
      if (target.id === userId) throw new BadRequestException('Вы уже будете участником группы');
      await this.assertNotBlocked(userId, target.id);
      if (!(await this.areFriends(userId, target.id))) {
        throw new ForbiddenException(`Добавлять напрямую можно только друзей: ${target.username}`);
      }
      await this.assertCanContact(userId, target.id, target.directMessagePolicy);
    }

    const conversation = await this.prisma.$transaction(async (tx) =>
      tx.conversation.create({
        data: {
          type: ConversationType.GROUP,
          title: title.trim(),
          createdById: userId,
          members: {
            create: [
              { userId, role: ConversationRole.OWNER },
              ...targets.map((target) => ({ userId: target.id, role: ConversationRole.MEMBER })),
            ],
          },
        },
        include: conversationInclude,
      }),
    );
    return this.mapConversation(conversation, userId, 0);
  }

  async getMessages(
    userId: string,
    conversationId: string,
    before?: string,
    limit = 50,
  ): Promise<DirectMessagesResponse> {
    await this.requireMember(conversationId, userId);
    const take = Math.min(100, Math.max(1, limit));
    const beforeMessage = before
      ? await this.prisma.directMessage.findFirst({
          where: { id: before, conversationId },
          select: { createdAt: true },
        })
      : null;
    const rows = await this.prisma.directMessage.findMany({
      where: {
        conversationId,
        ...(beforeMessage ? { createdAt: { lt: beforeMessage.createdAt } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      include: messageInclude,
    });
    const hasMore = rows.length > take;
    return {
      items: rows.slice(0, take).reverse().map((row) => this.mapMessage(row, userId)),
      hasMore,
    };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    content: string,
    parentId?: string,
  ): Promise<DirectMessageView> {
    await this.requireMember(conversationId, userId);
    await this.assertConversationBlocks(conversationId, userId);
    const text = content.trim();
    if (!text) throw new BadRequestException('Сообщение не может быть пустым');
    if (parentId) await this.requireParent(conversationId, parentId);

    const row = await this.prisma.$transaction(async (tx) => {
      const message = await tx.directMessage.create({
        data: {
          conversationId,
          senderId: userId,
          content: text,
          contentHtml: this.markdown.render(text),
          parentId,
        },
        include: messageInclude,
      });
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: message.createdAt },
      });
      await tx.conversationMember.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { lastReadAt: message.createdAt, lastReadMessageId: message.id },
      });
      return message;
    });

    void this.notifyMembers(conversationId, userId, text).catch(() => undefined);
    return this.mapMessage(row, userId);
  }

  async sendAttachment(
    userId: string,
    conversationId: string,
    file: Express.Multer.File,
    content?: string,
    parentId?: string,
  ): Promise<DirectMessageView> {
    await this.requireMember(conversationId, userId);
    await this.assertConversationBlocks(conversationId, userId);
    if (parentId) await this.requireParent(conversationId, parentId);
    const text = content?.trim() ?? '';
    if (text.length > 4000) throw new BadRequestException('Сообщение длиннее 4000 символов');
    const stored = await this.uploads.saveMessageAttachment(userId, file);
    try {
      const row = await this.prisma.$transaction(async (tx) => {
        const message = await tx.directMessage.create({
          data: {
            conversationId,
            senderId: userId,
            content: text,
            contentHtml: text ? this.markdown.render(text) : '',
            parentId,
            attachments: { create: stored },
          },
          include: messageInclude,
        });
        await tx.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: message.createdAt },
        });
        await tx.conversationMember.update({
          where: { conversationId_userId: { conversationId, userId } },
          data: { lastReadAt: message.createdAt, lastReadMessageId: message.id },
        });
        return message;
      });
      void this.notifyMembers(conversationId, userId, text || 'Отправлен файл').catch(
        () => undefined,
      );
      return this.mapMessage(row, userId);
    } catch (error) {
      await this.uploads.remove(stored.fileUrl);
      throw error;
    }
  }

  async editMessage(userId: string, messageId: string, content: string) {
    const current = await this.requireMessage(messageId);
    await this.requireMember(current.conversationId, userId);
    if (current.senderId !== userId) throw new ForbiddenException('Можно редактировать только свои сообщения');
    if (current.isDeleted) throw new BadRequestException('Сообщение удалено');
    const text = content.trim();
    if (!text) throw new BadRequestException('Сообщение не может быть пустым');
    const row = await this.prisma.directMessage.update({
      where: { id: messageId },
      data: { content: text, contentHtml: this.markdown.render(text), isEdited: true, editedAt: new Date() },
      include: messageInclude,
    });
    return this.mapMessage(row, userId);
  }

  async deleteMessage(userId: string, messageId: string) {
    const current = await this.requireMessage(messageId);
    const member = await this.requireMember(current.conversationId, userId);
    if (current.senderId !== userId && member.role === ConversationRole.MEMBER) {
      throw new ForbiddenException('Недостаточно прав для удаления сообщения');
    }
    const row = await this.prisma.directMessage.update({
      where: { id: messageId },
      data: {
        content: '',
        contentHtml: '',
        isDeleted: true,
        deletedAt: new Date(),
        reactions: { deleteMany: {} },
      },
      include: messageInclude,
    });
    await Promise.all(current.attachments.map((attachment) => this.uploads.remove(attachment.fileUrl)));
    return this.mapMessage(row, userId);
  }

  async toggleReaction(userId: string, messageId: string, emoji: string) {
    const message = await this.requireMessage(messageId);
    await this.requireMember(message.conversationId, userId);
    const key = { messageId_userId_emoji: { messageId, userId, emoji } };
    const existing = await this.prisma.directMessageReaction.findUnique({ where: key });
    if (existing) await this.prisma.directMessageReaction.delete({ where: key });
    else await this.prisma.directMessageReaction.create({ data: { messageId, userId, emoji } });
    const row = await this.prisma.directMessage.findUnique({ where: { id: messageId }, include: messageInclude });
    return this.mapMessage(row!, userId);
  }

  async markRead(userId: string, conversationId: string, messageId?: string) {
    await this.requireMember(conversationId, userId);
    const message = messageId
      ? await this.requireParent(conversationId, messageId)
      : await this.prisma.directMessage.findFirst({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          select: { id: true, createdAt: true },
        });
    const readAt = message?.createdAt ?? new Date();
    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: readAt, lastReadMessageId: message?.id ?? null },
    });
    return { conversationId, userId, messageId: message?.id ?? null, readAt: readAt.toISOString() };
  }

  async updateConversation(
    userId: string,
    conversationId: string,
    input: { title?: string; isMuted?: boolean; isArchived?: boolean },
  ) {
    const member = await this.requireMember(conversationId, userId);
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Диалог не найден');
    if (input.title !== undefined) {
      if (conversation.type !== ConversationType.GROUP) throw new BadRequestException('Название доступно только группам');
      if (member.role === ConversationRole.MEMBER) throw new ForbiddenException('Недостаточно прав');
      await this.prisma.conversation.update({ where: { id: conversationId }, data: { title: input.title.trim() } });
    }
    if (input.isMuted !== undefined || input.isArchived !== undefined) {
      await this.prisma.conversationMember.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { isMuted: input.isMuted, isArchived: input.isArchived },
      });
    }
    return this.getConversation(userId, conversationId);
  }

  async addMember(userId: string, conversationId: string, username: string) {
    await this.requireGroupManager(conversationId, userId);
    const target = await this.requireUser(username);
    await this.assertNotBlocked(userId, target.id);
    if (!(await this.areFriends(userId, target.id))) {
      throw new ForbiddenException('Добавлять напрямую можно только друзей');
    }
    await this.assertCanContact(userId, target.id, target.directMessagePolicy);
    const count = await this.prisma.conversationMember.count({ where: { conversationId } });
    if (count >= MAX_GROUP_MEMBERS) throw new BadRequestException('Группа заполнена');
    await this.prisma.conversationMember.create({ data: { conversationId, userId: target.id } });
    return this.getConversation(userId, conversationId);
  }

  async removeMember(userId: string, conversationId: string, targetId: string) {
    const actor = await this.requireMember(conversationId, userId);
    const target = await this.requireMember(conversationId, targetId);
    if (target.role === ConversationRole.OWNER) {
      throw new BadRequestException('Сначала передайте права владельца');
    }
    if (userId !== targetId && actor.role === ConversationRole.MEMBER) {
      throw new ForbiddenException('Недостаточно прав');
    }
    await this.prisma.conversationMember.delete({
      where: { conversationId_userId: { conversationId, userId: targetId } },
    });
    return { ok: true };
  }

  async updateMemberRole(userId: string, conversationId: string, targetId: string, role: 'MODERATOR' | 'MEMBER') {
    const actor = await this.requireMember(conversationId, userId);
    if (actor.role !== ConversationRole.OWNER) throw new ForbiddenException('Только владелец может менять роли');
    const target = await this.requireMember(conversationId, targetId);
    if (target.role === ConversationRole.OWNER) throw new BadRequestException('Нельзя изменить роль владельца');
    await this.prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId: targetId } },
      data: { role },
    });
    return this.getConversation(userId, conversationId);
  }

  async listInvites(userId: string, conversationId: string): Promise<GroupInviteView[]> {
    await this.requireGroupManager(conversationId, userId);
    const rows = await this.prisma.groupInvite.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.mapInvite(row));
  }

  async createInvite(
    userId: string,
    conversationId: string,
    input: { maxUses?: number; expiresInHours?: number },
  ): Promise<GroupInviteView> {
    await this.requireGroupManager(conversationId, userId);
    const row = await this.prisma.groupInvite.create({
      data: {
        conversationId,
        createdById: userId,
        code: randomBytes(9).toString('base64url'),
        maxUses: input.maxUses,
        expiresAt: input.expiresInHours
          ? new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000)
          : undefined,
      },
    });
    return this.mapInvite(row);
  }

  async revokeInvite(userId: string, conversationId: string, code: string) {
    await this.requireGroupManager(conversationId, userId);
    const result = await this.prisma.groupInvite.updateMany({
      where: { conversationId, code, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (!result.count) throw new NotFoundException('Приглашение не найдено');
    return { ok: true };
  }

  async previewInvite(code: string): Promise<GroupInvitePreview> {
    const invite = await this.prisma.groupInvite.findUnique({
      where: { code },
      include: { conversation: { include: { _count: { select: { members: true } } } } },
    });
    if (!invite || invite.conversation.type !== ConversationType.GROUP) {
      throw new NotFoundException('Приглашение не найдено');
    }
    const reason = this.inviteUnavailableReason(invite, invite.conversation._count.members);
    return {
      code,
      conversationId: invite.conversationId,
      title: invite.conversation.title ?? 'Групповой чат',
      avatar: invite.conversation.avatar,
      membersCount: invite.conversation._count.members,
      expiresAt: invite.expiresAt?.toISOString() ?? null,
      available: !reason,
      reason,
    };
  }

  async joinInvite(userId: string, code: string): Promise<ConversationView> {
    const initialInvite = await this.prisma.groupInvite.findUnique({ where: { code } });
    if (!initialInvite) throw new NotFoundException('Приглашение не найдено');
    await this.assertNotBlocked(userId, initialInvite.createdById);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await this.prisma.$transaction(
          async (tx) => {
            const invite = await tx.groupInvite.findUnique({ where: { code } });
            if (!invite) throw new NotFoundException('Приглашение не найдено');
            const existing = await tx.conversationMember.findUnique({
              where: { conversationId_userId: { conversationId: invite.conversationId, userId } },
            });
            if (existing) return;

            const currentCount = await tx.conversationMember.count({
              where: { conversationId: invite.conversationId },
            });
            const reason = this.inviteUnavailableReason(invite, currentCount);
            if (reason) throw new BadRequestException(reason);

            await tx.conversationMember.create({ data: { conversationId: invite.conversationId, userId } });
            await tx.groupInvite.update({
              where: { id: invite.id },
              data: { usedCount: { increment: 1 } },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
        break;
      } catch (error) {
        const retryable = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
        if (!retryable || attempt === 2) throw error;
      }
    }
    return this.getConversation(userId, initialInvite.conversationId);
  }

  async getPrivacy(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { directMessagePolicy: true } });
    return { policy: user?.directMessagePolicy ?? DirectMessagePolicy.EVERYONE };
  }

  async updatePrivacy(userId: string, policy: DirectMessagePolicy) {
    await this.prisma.user.update({ where: { id: userId }, data: { directMessagePolicy: policy } });
    return { policy };
  }

  async giftFee(userId: string, username: string) {
    const target = await this.requireUser(username);
    return { percent: (await this.areFriends(userId, target.id)) ? 5 : 10 };
  }

  async requireMember(conversationId: string, userId: string) {
    const member = await this.prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw new ForbiddenException('Вы не участвуете в этом диалоге');
    return member;
  }

  private async requireGroupManager(conversationId: string, userId: string) {
    const member = await this.requireMember(conversationId, userId);
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.type !== ConversationType.GROUP) {
      throw new BadRequestException('Действие доступно только в группе');
    }
    if (member.role === ConversationRole.MEMBER) throw new ForbiddenException('Недостаточно прав');
    return member;
  }

  private async requireUser(identifier: string) {
    const user = await findUserByIdentifier(this.prisma, identifier, {
      select: { id: true, username: true, avatar: true, directMessagePolicy: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  private async requireMessage(messageId: string) {
    const message = await this.prisma.directMessage.findUnique({
      where: { id: messageId },
      include: { attachments: true },
    });
    if (!message) throw new NotFoundException('Сообщение не найдено');
    return message;
  }

  private async requireParent(conversationId: string, messageId: string) {
    const parent = await this.prisma.directMessage.findFirst({
      where: { id: messageId, conversationId },
      select: { id: true, createdAt: true },
    });
    if (!parent) throw new BadRequestException('Исходное сообщение не найдено');
    return parent;
  }

  private async assertNotBlocked(userA: string, userB: string) {
    const blocked = await this.prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.BLOCKED,
        OR: [
          { requesterId: userA, addresseeId: userB },
          { requesterId: userB, addresseeId: userA },
        ],
      },
      select: { id: true },
    });
    if (blocked) throw new ForbiddenException('Обмен сообщениями недоступен из-за блокировки');
  }

  private async assertConversationBlocks(conversationId: string, senderId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { type: true, members: { select: { userId: true } } },
    });
    if (conversation?.type !== ConversationType.DIRECT) return;
    const target = conversation.members.find((member) => member.userId !== senderId);
    if (target) await this.assertNotBlocked(senderId, target.userId);
  }

  private async assertCanContact(senderId: string, targetId: string, policy: DirectMessagePolicy) {
    if (policy === DirectMessagePolicy.EVERYONE) return;
    if (policy === DirectMessagePolicy.NOBODY) throw new ForbiddenException('Пользователь запретил новые сообщения');
    const friends = await this.areFriends(senderId, targetId);
    if (friends) return;
    if (policy === DirectMessagePolicy.FRIENDS) throw new ForbiddenException('Писать могут только друзья');

    const [senderFriends, targetFriends] = await Promise.all([
      this.friendIds(senderId),
      this.friendIds(targetId),
    ]);
    const targetSet = new Set(targetFriends);
    if (!senderFriends.some((id) => targetSet.has(id))) {
      throw new ForbiddenException('Писать могут только друзья друзей');
    }
  }

  private async areFriends(userA: string, userB: string) {
    return Boolean(
      await this.prisma.friendship.findFirst({
        where: {
          status: FriendshipStatus.ACCEPTED,
          OR: [
            { requesterId: userA, addresseeId: userB },
            { requesterId: userB, addresseeId: userA },
          ],
        },
        select: { id: true },
      }),
    );
  }

  private async friendIds(userId: string) {
    const rows = await this.prisma.friendship.findMany({
      where: { status: FriendshipStatus.ACCEPTED, OR: [{ requesterId: userId }, { addresseeId: userId }] },
      select: { requesterId: true, addresseeId: true },
    });
    return rows.map((row) => (row.requesterId === userId ? row.addresseeId : row.requesterId));
  }

  private async notifyMembers(conversationId: string, senderId: string, content: string) {
    const [members, sender] = await Promise.all([
      this.prisma.conversationMember.findMany({
        where: { conversationId, userId: { not: senderId }, isMuted: false },
        select: { userId: true },
      }),
      this.prisma.user.findUnique({ where: { id: senderId }, select: { username: true } }),
    ]);
    await Promise.all(
      members.map((member) =>
        this.notifications.createNotification({
          userId: member.userId,
          fromUserId: senderId,
          type: NotificationType.MESSAGE_RECEIVED,
          title: `Новое сообщение от ${sender?.username ?? 'пользователя'}`,
          message: content.slice(0, 160),
          link: `/messages?conversation=${conversationId}`,
          actionUrl: `/messages?conversation=${conversationId}`,
          actionLabel: 'Открыть',
          groupKey: `messages:${conversationId}`,
        }),
      ),
    );
  }

  private mapConversation(row: ConversationRow, userId: string, unreadCount: number): ConversationView {
    const membership = row.members.find((member) => member.userId === userId)!;
    const other = row.type === ConversationType.DIRECT
      ? row.members.find((member) => member.userId !== userId)?.user
      : null;
    return {
      id: row.id,
      type: row.type,
      title: row.type === ConversationType.DIRECT ? other?.username ?? 'Удалённый пользователь' : row.title ?? 'Групповой чат',
      avatar: row.type === ConversationType.DIRECT ? other?.avatar ?? null : row.avatar,
      role: membership.role,
      members: row.members.map((member) => ({
        id: member.id,
        user: member.user,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
        lastReadAt: member.lastReadAt.toISOString(),
        isMuted: member.isMuted,
      })),
      lastMessage: row.messages[0] ? this.mapMessage(row.messages[0], userId) : null,
      lastMessageAt: row.lastMessageAt.toISOString(),
      unreadCount,
      isMuted: membership.isMuted,
      isArchived: membership.isArchived,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapMessage(row: MessageRow, userId: string): DirectMessageView {
    const reactions = new Map<string, MessageRow['reactions']>();
    for (const reaction of row.reactions) {
      reactions.set(reaction.emoji, [...(reactions.get(reaction.emoji) ?? []), reaction]);
    }
    return {
      id: row.id,
      conversationId: row.conversationId,
      sender: row.sender,
      content: row.isDeleted ? '' : row.content,
      contentHtml: row.isDeleted ? '' : row.contentHtml,
      parent: row.parent
        ? { id: row.parent.id, content: row.parent.content, sender: row.parent.sender }
        : null,
      reactions: [...reactions.entries()].map(([emoji, items]) => ({
        emoji,
        count: items.length,
        reactedByMe: items.some((item) => item.userId === userId),
        users: items.map((item) => item.user),
      })),
      attachments: row.isDeleted
        ? []
        : row.attachments.map((attachment) => ({
            id: attachment.id,
            fileUrl: attachment.fileUrl,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            size: attachment.size,
            createdAt: attachment.createdAt.toISOString(),
          })),
      isEdited: row.isEdited,
      isDeleted: row.isDeleted,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapInvite(row: {
    id: string;
    code: string;
    maxUses: number | null;
    usedCount: number;
    expiresAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
  }): GroupInviteView {
    return {
      id: row.id,
      code: row.code,
      url: `https://twomc.su/g/${row.code}`,
      maxUses: row.maxUses,
      usedCount: row.usedCount,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      revokedAt: row.revokedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private inviteUnavailableReason(
    invite: { revokedAt: Date | null; expiresAt: Date | null; maxUses: number | null; usedCount: number },
    membersCount: number,
  ) {
    if (invite.revokedAt) return 'Приглашение отозвано';
    if (invite.expiresAt && invite.expiresAt <= new Date()) return 'Срок приглашения истёк';
    if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) return 'Лимит приглашения исчерпан';
    if (membersCount >= MAX_GROUP_MEMBERS) return 'Группа заполнена';
    return null;
  }
}
