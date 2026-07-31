import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { RoleGroup } from '@prisma/client';
import type { AccessTokenPayload } from '@twomc/shared';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from './messages.service';
import { ModerationService } from './moderation.service';
import {
  BanUserDto,
  ChannelIdDto,
  EditMessageDto,
  MessageIdDto,
  MuteUserDto,
  SendMessageDto,
} from './dto/chat.dto';

type AuthedSocket = Socket & {
  data: {
    user?: {
      id: string;
      username: string;
      roleGroup: RoleGroup;
    };
    channels?: Set<string>;
  };
};

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly messages: MessagesService,
    private readonly moderation: ModerationService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ||
        this.extractBearer(client.handshake.headers.authorization);

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, username: true, roleGroup: true, isBanned: true },
      });

      if (!user || user.isBanned) {
        client.disconnect(true);
        return;
      }

      const ban = await this.prisma.chatBan.findFirst({
        where: {
          userId: user.id,
          isActive: true,
          OR: [{ bannedUntil: null }, { bannedUntil: { gt: new Date() } }],
        },
      });
      if (ban) {
        client.emit('user:banned', { reason: ban.reason });
        client.disconnect(true);
        return;
      }

      client.data.user = user;
      client.data.channels = new Set();
      client.join(`user:${user.id}`);
    } catch (error) {
      this.logger.debug(`WS auth failed: ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthedSocket) {
    const user = client.data.user;
    if (!user) return;
    for (const channelId of client.data.channels ?? []) {
      await this.messages.setOffline(channelId, user.id);
      this.server.to(`channel:${channelId}`).emit('user:offline', {
        userId: user.id,
        channelId,
      });
    }
  }

  @SubscribeMessage('join_channel')
  async joinChannel(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: ChannelIdDto) {
    const user = this.requireUser(client);
    client.join(`channel:${body.channelId}`);
    client.data.channels?.add(body.channelId);
    await this.messages.setOnline(body.channelId, user.id);
    this.server.to(`channel:${body.channelId}`).emit('user:online', {
      userId: user.id,
      username: user.username,
      channelId: body.channelId,
    });
    return { ok: true };
  }

  @SubscribeMessage('leave_channel')
  async leaveChannel(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: ChannelIdDto) {
    const user = this.requireUser(client);
    client.leave(`channel:${body.channelId}`);
    client.data.channels?.delete(body.channelId);
    await this.messages.setOffline(body.channelId, user.id);
    this.server.to(`channel:${body.channelId}`).emit('user:offline', {
      userId: user.id,
      channelId: body.channelId,
    });
    return { ok: true };
  }

  @SubscribeMessage('send_message')
  async sendMessage(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: SendMessageDto) {
    const user = this.requireUser(client);
    try {
      const message = await this.messages.sendMessage(
        user.id,
        body.channelId,
        body.content,
        body.parentId,
      );
      this.server.to(`channel:${body.channelId}`).emit('message:new', message);
      return { ok: true, message };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('edit_message')
  async editMessage(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: EditMessageDto) {
    const user = this.requireUser(client);
    try {
      const message = await this.messages.editMessage(user.id, body.messageId, body.content);
      this.server.to(`channel:${message.channelId}`).emit('message:edited', message);
      return { ok: true, message };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('delete_message')
  async deleteMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: MessageIdDto & { reason?: string },
  ) {
    const user = this.requireUser(client);
    try {
      const message = await this.messages.deleteMessage(
        user.id,
        user.roleGroup,
        body.messageId,
        body.reason,
      );
      this.server.to(`channel:${message.channelId}`).emit('message:deleted', message);
      return { ok: true, message };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('typing_start')
  async typingStart(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: ChannelIdDto) {
    const user = this.requireUser(client);
    await this.messages.setTyping(body.channelId, user.id);
    client.to(`channel:${body.channelId}`).emit('user:typing', {
      userId: user.id,
      username: user.username,
      channelId: body.channelId,
    });
    return { ok: true };
  }

  @SubscribeMessage('typing_stop')
  async typingStop(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: ChannelIdDto) {
    const user = this.requireUser(client);
    await this.messages.clearTyping(body.channelId, user.id);
    client.to(`channel:${body.channelId}`).emit('user:stopped_typing', {
      userId: user.id,
      channelId: body.channelId,
    });
    return { ok: true };
  }

  @SubscribeMessage('pin_message')
  async pinMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: MessageIdDto & { unpin?: boolean },
  ) {
    const user = this.requireUser(client);
    try {
      const message = body.unpin
        ? await this.messages.unpinMessage(user.id, user.roleGroup, body.messageId)
        : await this.messages.pinMessage(user.id, user.roleGroup, body.messageId);
      this.server
        .to(`channel:${message.channelId}`)
        .emit(body.unpin ? 'message:unpinned' : 'message:pinned', message);
      return { ok: true, message };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('mute_user')
  async muteUser(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: MuteUserDto) {
    const user = this.requireUser(client);
    try {
      const mute = await this.moderation.muteUser(user.id, user.roleGroup, body);
      const room = body.channelId ? `channel:${body.channelId}` : undefined;
      if (room) this.server.to(room).emit('user:muted', mute);
      else this.server.emit('user:muted', mute);
      this.server.to(`user:${body.targetId}`).emit('user:muted', mute);
      return { ok: true, mute };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('ban_user')
  async banUser(@ConnectedSocket() client: AuthedSocket, @MessageBody() body: BanUserDto) {
    const user = this.requireUser(client);
    try {
      const ban = await this.moderation.banUser(user.id, user.roleGroup, body);
      this.server.emit('user:banned', ban);
      const sockets = await this.server.in(`user:${body.targetId}`).fetchSockets();
      for (const s of sockets) s.disconnect(true);
      return { ok: true, ban };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  emitActivity(
    event: 'activity:new' | 'activity:updated' | 'activity:deleted',
    payload: unknown,
  ) {
    this.server.emit(event, payload);
  }

  private requireUser(client: AuthedSocket) {
    if (!client.data.user) {
      throw new Error('Не авторизован');
    }
    return client.data.user;
  }

  private extractBearer(header?: string) {
    if (!header?.startsWith('Bearer ')) return undefined;
    return header.slice(7);
  }
}
