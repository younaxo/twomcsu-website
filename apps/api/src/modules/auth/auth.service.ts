import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { AccessTokenPayload, AuthResponse, PublicUser } from '@twomc/shared';
import { hash } from 'bcrypt';
import { createHmac, randomBytes } from 'node:crypto';
import { durationToSeconds } from '../../common/duration.util';
import { PrismaService } from '../prisma/prisma.service';
import { BCRYPT_ROUNDS } from './auth.constants';
import { CaptchaService } from './captcha.service';
import { RegisterDto } from './dto/register.dto';
import { RequestContext } from './request-context';

export interface AuthSession extends AuthResponse {
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly captcha: CaptchaService,
  ) {}

  async register(dto: RegisterDto, context: RequestContext): Promise<AuthSession> {
    await this.captcha.verify(dto.captchaToken, context.ip);

    const email = dto.email.trim().toLowerCase();
    const taken = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { username: dto.username }] },
      select: { email: true },
    });

    if (taken) {
      throw new ConflictException(
        taken.email === email ? 'Этот email уже занят' : 'Этот никнейм уже занят',
      );
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          username: dto.username,
          password: await hash(dto.password, BCRYPT_ROUNDS),
        },
      });

      return await this.issueSession(user, context);
    } catch (error) {
      // two parallel registrations with the same email slip past the check above
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Этот email или никнейм уже занят');
      }

      throw error;
    }
  }

  async findById(userId: string): Promise<PublicUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    return user ? this.toPublicUser(user) : null;
  }

  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      roleGroup: user.roleGroup,
      minecraftNick: user.minecraftNick,
      avatar: user.avatar,
      isVerified: user.isVerified,
      isBanned: user.isBanned,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async issueSession(user: User, context: RequestContext): Promise<AuthSession> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roleGroup: user.roleGroup,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      algorithm: 'HS256',
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: this.config.getOrThrow<string>('jwt.accessExpires'),
    });

    const refreshToken = randomBytes(64).toString('hex');
    const refreshExpiresAt = new Date(Date.now() + this.refreshTtlSeconds * 1000);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashRefreshToken(refreshToken),
        userId: user.id,
        userAgent: context.userAgent,
        ipAddress: context.ip,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      refreshExpiresAt,
      user: this.toPublicUser(user),
    };
  }

  /** hmac instead of plain sha256: a leaked table is useless without the server secret */
  private hashRefreshToken(token: string): string {
    return createHmac('sha256', this.config.getOrThrow<string>('jwt.refreshSecret'))
      .update(token)
      .digest('hex');
  }

  private get refreshTtlSeconds(): number {
    return durationToSeconds(this.config.getOrThrow<string>('jwt.refreshExpires'));
  }
}
