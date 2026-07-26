import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import {
  AccessTokenPayload,
  AuthResponse,
  CaptchaRequiredResponse,
  PublicUser,
} from '@twomc/shared';
import { compare, hash } from 'bcrypt';
import { createHmac, randomBytes } from 'node:crypto';
import { durationToSeconds } from '../../common/duration.util';
import { PrismaService } from '../prisma/prisma.service';
import { BCRYPT_ROUNDS, BLOCK_AFTER_ATTEMPTS, CAPTCHA_AFTER_ATTEMPTS } from './auth.constants';
import { BruteForceService } from './brute-force.service';
import { CaptchaService } from './captcha.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestContext } from './request-context';

export interface AuthSession extends AuthResponse {
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly captcha: CaptchaService,
    private readonly bruteForce: BruteForceService,
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

  async login(
    dto: LoginDto,
    context: RequestContext,
  ): Promise<AuthSession | CaptchaRequiredResponse> {
    if (await this.bruteForce.isBlocked(context.ip)) {
      throw new HttpException(
        'Слишком много попыток входа. Попробуйте через 15 минут',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const failedAttempts = await this.bruteForce.getFailedAttempts(context.ip);

    if (failedAttempts >= CAPTCHA_AFTER_ATTEMPTS && !dto.captchaToken) {
      return { requiresCaptcha: true };
    }

    if (dto.captchaToken) {
      await this.captcha.verify(dto.captchaToken, context.ip);
    }

    const login = dto.emailOrUsername.trim();
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: login.toLowerCase() }, { username: login }] },
    });

    if (!user || !(await compare(dto.password, user.password))) {
      await this.handleFailedAttempt(context.ip);
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    if (user.isBanned && (!user.bannedUntil || user.bannedUntil > new Date())) {
      throw new ForbiddenException({
        message: 'Аккаунт заблокирован',
        reason: user.banReason,
        bannedUntil: user.bannedUntil,
      });
    }

    await this.bruteForce.resetFailedAttempts(context.ip);

    const loggedIn = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: context.ip },
    });

    return this.issueSession(loggedIn, context);
  }

  async refresh(token: string | undefined, context: RequestContext): Promise<AuthSession> {
    if (!token) {
      throw new UnauthorizedException('Сессия не найдена');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashRefreshToken(token) },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Сессия не найдена');
    }

    if (stored.revokedAt) {
      // someone replays an old token, safest move is to drop every session of that user
      await this.revokeAllSessions(stored.userId);
      this.logger.warn(`Refresh token reuse detected for user ${stored.userId}`);
      throw new UnauthorizedException('Сессия недействительна');
    }

    if (stored.expiresAt <= new Date()) {
      throw new UnauthorizedException('Сессия истекла');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueSession(stored.user, context);
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) {
      return;
    }

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashRefreshToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
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

  private async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async handleFailedAttempt(ip: string): Promise<void> {
    const attempts = await this.bruteForce.incrementFailedAttempts(ip);

    if (attempts >= BLOCK_AFTER_ATTEMPTS) {
      await this.bruteForce.blockIp(ip);

      throw new HttpException(
        'Слишком много попыток входа. Попробуйте через 15 минут',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
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
