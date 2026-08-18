import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { AccessTokenPayload, DirectMessage } from '@twomc/shared';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConversationSocketDto,
  EditDirectMessageDto,
  MarkConversationReadDto,
  ReactToDirectMessageDto,
  SendDirectMessageDto,
} from './dto/direct-messages.dto';
import { DirectMessagesService } from './direct-messages.service';

type MessagesSocket = Socket & { data: { userId?: string; username?: string } };

@WebSocketGateway({
  namespace: 'messages',
  cors: { origin: true, credentials: true },
})
export class DirectMessagesGateway implements OnGatewayConnection {
  private readonly logger = new Logger(DirectMessagesGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly messages: DirectMessagesService,
  ) {}

  async handleConnection(client: MessagesSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        this.extractBearer(client.handshake.headers.authorization);
      if (!token) return client.disconnect(true);
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, username: true, isBanned: true },
      });
      if (!user || user.isBanned) return client.disconnect(true);
      client.data.userId = user.id;
      client.data.username = user.username;
      client.join(`messages:user:${user.id}`);
      const memberships = await this.prisma.conversationMember.findMany({
        where: { userId: user.id },
        select: { conversationId: true },
      });
      await Promise.all(
        memberships.map((membership) => client.join(`messages:conversation:${membership.conversationId}`)),
      );
    } catch (error) {
      this.logger.debug(`Messages WS auth failed: ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('conversation:join')
  async join(@ConnectedSocket() client: MessagesSocket, @MessageBody() body: ConversationSocketDto) {
    const userId = this.requireUser(client);
    await this.messages.requireMember(body.conversationId, userId);
    await client.join(`messages:conversation:${body.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage('conversation:leave')
  async leave(@ConnectedSocket() client: MessagesSocket, @MessageBody() body: ConversationSocketDto) {
    await client.leave(`messages:conversation:${body.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage('message:send')
  async send(
    @ConnectedSocket() client: MessagesSocket,
    @MessageBody() body: ConversationSocketDto & SendDirectMessageDto,
  ) {
    try {
      const message = await this.messages.sendMessage(
        this.requireUser(client),
        body.conversationId,
        body.content,
        body.parentId,
      );
      this.emitNewMessage(body.conversationId, message);
      return { ok: true, message };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('message:edit')
  async edit(
    @ConnectedSocket() client: MessagesSocket,
    @MessageBody() body: { messageId: string } & EditDirectMessageDto,
  ) {
    try {
      const message = await this.messages.editMessage(this.requireUser(client), body.messageId, body.content);
      this.server.to(`messages:conversation:${message.conversationId}`).emit('message:updated', message);
      return { ok: true, message };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('message:delete')
  async remove(@ConnectedSocket() client: MessagesSocket, @MessageBody() body: { messageId: string }) {
    try {
      const message = await this.messages.deleteMessage(this.requireUser(client), body.messageId);
      this.server.to(`messages:conversation:${message.conversationId}`).emit('message:updated', message);
      return { ok: true, message };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('message:react')
  async react(
    @ConnectedSocket() client: MessagesSocket,
    @MessageBody() body: { messageId: string } & ReactToDirectMessageDto,
  ) {
    try {
      const message = await this.messages.toggleReaction(this.requireUser(client), body.messageId, body.emoji);
      this.server.to(`messages:conversation:${message.conversationId}`).emit('message:updated', message);
      return { ok: true, message };
    } catch (error) {
      return { ok: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('conversation:read')
  async read(
    @ConnectedSocket() client: MessagesSocket,
    @MessageBody() body: ConversationSocketDto & MarkConversationReadDto,
  ) {
    const receipt = await this.messages.markRead(this.requireUser(client), body.conversationId, body.messageId);
    this.server.to(`messages:conversation:${body.conversationId}`).emit('conversation:read', receipt);
    return { ok: true, receipt };
  }

  @SubscribeMessage('typing:start')
  async typingStart(
    @ConnectedSocket() client: MessagesSocket,
    @MessageBody() body: ConversationSocketDto,
  ) {
    const userId = this.requireUser(client);
    await this.messages.requireMember(body.conversationId, userId);
    client.to(`messages:conversation:${body.conversationId}`).emit('typing:start', {
      conversationId: body.conversationId,
      userId,
      username: client.data.username,
    });
    return { ok: true };
  }

  @SubscribeMessage('typing:stop')
  async typingStop(
    @ConnectedSocket() client: MessagesSocket,
    @MessageBody() body: ConversationSocketDto,
  ) {
    const userId = this.requireUser(client);
    client.to(`messages:conversation:${body.conversationId}`).emit('typing:stop', {
      conversationId: body.conversationId,
      userId,
    });
    return { ok: true };
  }

  emitNewMessage(conversationId: string, message: DirectMessage) {
    this.server.to(`messages:conversation:${conversationId}`).emit('message:new', message);
    this.server.to(`messages:conversation:${conversationId}`).emit('conversation:updated', {
      conversationId,
      lastMessage: message,
    });
  }

  emitUpdatedMessage(message: DirectMessage) {
    this.server
      .to(`messages:conversation:${message.conversationId}`)
      .emit('message:updated', message);
  }

  emitConversationChanged(conversationId: string) {
    this.server.to(`messages:conversation:${conversationId}`).emit('conversation:changed', {
      conversationId,
    });
  }

  async syncConversationRooms(conversationId: string) {
    const members = await this.prisma.conversationMember.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    for (const member of members) {
      this.server.in(`messages:user:${member.userId}`).socketsJoin(`messages:conversation:${conversationId}`);
      this.server.to(`messages:user:${member.userId}`).emit('conversation:changed', { conversationId });
    }
  }

  private requireUser(client: MessagesSocket) {
    if (!client.data.userId) throw new Error('Не авторизован');
    return client.data.userId;
  }

  private extractBearer(value?: string) {
    return value?.startsWith('Bearer ') ? value.slice(7) : undefined;
  }
}
