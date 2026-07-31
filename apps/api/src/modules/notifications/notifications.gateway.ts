import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { AccessTokenPayload, AppNotification } from '@twomc/shared';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

type AuthedSocket = Socket & {
  data: { userId?: string };
};

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
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
        select: { id: true, isBanned: true },
      });

      if (!user || user.isBanned) {
        client.disconnect(true);
        return;
      }

      client.data.userId = user.id;
      await client.join(this.userRoom(user.id));
    } catch (error) {
      this.logger.debug(`Notifications socket rejected: ${String(error)}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: AuthedSocket) {
    // no-op
  }

  emitNew(userId: string, notification: AppNotification) {
    this.server?.to(this.userRoom(userId)).emit('notification:new', notification);
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private extractBearer(header?: string) {
    if (!header?.startsWith('Bearer ')) return undefined;
    return header.slice(7);
  }
}
