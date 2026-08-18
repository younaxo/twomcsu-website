import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChatMuteReason, NotificationType } from '@prisma/client';
import { RoleGroup, hasRoleGroup } from '@twomc/shared';
import { AuthenticatedUser } from '../auth/authenticated-user';
import { AuditService } from '../admin/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QuickModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  private async requireTarget(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, roleGroup: true, positionId: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  private assertNotSelf(actorId: string, targetId: string) {
    if (actorId === targetId) {
      throw new BadRequestException('Нельзя применить действие к себе');
    }
  }

  async mute(
    actor: AuthenticatedUser,
    userId: string,
    dto: { duration?: number | null; reason: string; channelId?: string },
  ) {
    this.assertNotSelf(actor.id, userId);
    const target = await this.requireTarget(userId);

    const mutedUntil =
      dto.duration != null ? new Date(Date.now() + dto.duration * 60_000) : null;

    const mute = await this.prisma.chatMute.create({
      data: {
        userId,
        channelId: dto.channelId ?? null,
        reason: ChatMuteReason.OTHER,
        reasonNote: dto.reason,
        mutedBy: actor.id,
        mutedUntil,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'user.mute',
      targetType: 'user',
      targetId: userId,
      changes: { duration: dto.duration ?? null, reason: dto.reason, channelId: dto.channelId },
    });

    const untilLabel = mutedUntil
      ? mutedUntil.toLocaleString('ru-RU')
      : 'навсегда';
    await this.notifications.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      title: 'Мут в чате',
      message: `Вас замутили в чате до ${untilLabel}. Причина: ${dto.reason}`,
      fromUserId: actor.id,
    });

    return { ok: true, muteId: mute.id, username: target.username };
  }

  async warn(actor: AuthenticatedUser, userId: string, reason: string) {
    this.assertNotSelf(actor.id, userId);
    await this.requireTarget(userId);

    await this.audit.log({
      actorId: actor.id,
      action: 'user.warn',
      targetType: 'user',
      targetId: userId,
      changes: { reason },
    });

    await this.notifications.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      title: 'Предупреждение',
      message: `Вы получили предупреждение. Причина: ${reason}`,
      fromUserId: actor.id,
    });

    return { ok: true };
  }

  async hardDeleteMessage(actor: AuthenticatedUser, messageId: string, reason: string) {
    const message = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Сообщение не найдено');

    await this.prisma.chatMessage.delete({ where: { id: messageId } });

    await this.audit.log({
      actorId: actor.id,
      action: 'message.hard-delete',
      targetType: 'chat_message',
      targetId: messageId,
      changes: {
        reason,
        authorId: message.authorId,
        content: message.content.slice(0, 200),
      },
    });

    return { ok: true };
  }

  async hardDeleteComment(actor: AuthenticatedUser, commentId: string, reason: string) {
    const comment = await this.prisma.profileComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Комментарий не найден');

    await this.prisma.profileComment.delete({ where: { id: commentId } });

    await this.audit.log({
      actorId: actor.id,
      action: 'comment.hard-delete',
      targetType: 'profile_comment',
      targetId: commentId,
      changes: {
        reason,
        authorId: comment.authorId,
        content: comment.content.slice(0, 200),
      },
    });

    return { ok: true };
  }

  async kick(actor: AuthenticatedUser, userId: string, reason: string) {
    this.assertNotSelf(actor.id, userId);
    await this.requireTarget(userId);

    await this.audit.log({
      actorId: actor.id,
      action: 'user.kick',
      targetType: 'user',
      targetId: userId,
      changes: { reason },
    });

    await this.notifications.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      title: 'Кик с сервера',
      message: `Вас кикнули с сервера. Причина: ${reason}`,
      fromUserId: actor.id,
    });

    return { ok: true };
  }

  async ban(
    actor: AuthenticatedUser,
    userId: string,
    dto: { duration?: number | null; reason: string; banType: 'ACCOUNT' | 'IP' },
  ) {
    this.assertNotSelf(actor.id, userId);
    await this.requireTarget(userId);

    const isPermanent = dto.duration == null;
    if (dto.banType === 'IP' || isPermanent) {
      if (!hasRoleGroup(actor.roleGroup, RoleGroup.ADMIN)) {
        throw new ForbiddenException('Недостаточно прав для этого бана');
      }
    }

    const bannedUntil =
      dto.duration != null ? new Date(Date.now() + dto.duration * 60 * 60_000) : null;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        banReason: dto.reason,
        bannedUntil,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'user.ban',
      targetType: 'user',
      targetId: userId,
      changes: {
        reason: dto.reason,
        banType: dto.banType,
        durationHours: dto.duration ?? null,
      },
    });

    const durationLabel = bannedUntil
      ? bannedUntil.toLocaleString('ru-RU')
      : 'навсегда';
    await this.notifications.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      title: 'Блокировка аккаунта',
      message: `Вы забанены на ${durationLabel}. Причина: ${dto.reason}`,
      fromUserId: actor.id,
    });

    return { ok: true };
  }

  async changeRole(actor: AuthenticatedUser, userId: string, positionId: string) {
    this.assertNotSelf(actor.id, userId);
    await this.requireTarget(userId);

    const position = await this.prisma.position.findUnique({ where: { id: positionId } });
    if (!position) throw new NotFoundException('Должность не найдена');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        positionId,
        roleGroup: position.group,
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'user.change-role',
      targetType: 'user',
      targetId: userId,
      changes: { positionId, positionName: position.displayName },
    });

    await this.notifications.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      title: 'Роль изменена',
      message: `Ваша роль изменена на ${position.displayName}`,
      fromUserId: actor.id,
    });

    return { ok: true };
  }

  async deleteAccount(actor: AuthenticatedUser, userId: string) {
    this.assertNotSelf(actor.id, userId);
    const target = await this.requireTarget(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        banReason: 'ACCOUNT_DELETED',
        bannedUntil: null,
        email: `deleted_${userId}@deleted.local`,
        username: `deleted_${target.username.slice(0, 8)}_${Date.now().toString(36)}`.slice(0, 16),
      },
    });

    await this.audit.log({
      actorId: actor.id,
      action: 'user.delete',
      targetType: 'user',
      targetId: userId,
      changes: { username: target.username },
    });

    return { ok: true };
  }
}
