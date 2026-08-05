import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import {
  AccessTokenPayload,
  AuthResponse,
  CaptchaRequiredResponse,
  PublicUser,
  RegisterResponse,
  RoleGroup,
  SessionInfo,
} from '@twomc/shared';
import { compare, hash } from 'bcrypt';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { durationToSeconds } from '../../common/duration.util';
import { AuthUserRow, selectAuthUser } from '../../common/prisma/user-selects';
import { generateUserTag } from '../../common/user-identifier';
import { CACHE_TTL, cacheKeys } from '../cache/cache.keys';
import { CacheService } from '../cache/cache.service';
import { toPublicPosition } from '../positions/position.mapper';
import { toCustomPositionView, toUserDepartments } from '../users/profile.mapper';
import { PositionsService } from '../positions/positions.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BCRYPT_ROUNDS,
  BLOCK_AFTER_ATTEMPTS,
  CAPTCHA_AFTER_ATTEMPTS,
  PASSWORD_RESET_TTL_MS,
} from './auth.constants';
import { BruteForceService } from './brute-force.service';
import { CaptchaService } from './captcha.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestContext } from './request-context';

export interface AuthSession extends AuthResponse {
  refreshToken: string;
  refreshExpiresAt: Date;
}

export interface RegisterSession extends AuthSession {
  promoCode?: RegisterResponse['promoCode'];
}

type PromoCodeResult = NonNullable<RegisterResponse['promoCode']>;

type UserWithPosition = Prisma.UserGetPayload<{ include: { position: true } }> | AuthUserRow;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly captcha: CaptchaService,
    private readonly bruteForce: BruteForceService,
    private readonly positions: PositionsService,
    private readonly cache: CacheService,
  ) {}

  async register(dto: RegisterDto, context: RequestContext): Promise<RegisterSession> {
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
          positionId: await this.positions.getDefaultId(RoleGroup.PLAYER),
          tag: generateUserTag(dto.username),
        },
        include: { position: true },
      });

      const promoCode = dto.promoCode
        ? await this.applyPromoCode(user.id, dto.promoCode)
        : undefined;

      return { ...(await this.issueSession(user, context)), promoCode };
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
      include: { position: true },
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
      include: { position: true },
    });

    return this.issueSession(loggedIn, context);
  }

  async refresh(token: string | undefined, context: RequestContext): Promise<AuthSession> {
    if (!token) {
      throw new UnauthorizedException('Сессия не найдена');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashRefreshToken(token) },
      include: { user: { include: { position: true } } },
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

  /** Silent on unknown emails: the response must not tell whether an account exists */
  async forgotPassword(dto: ForgotPasswordDto, context: RequestContext): Promise<void> {
    await this.captcha.verify(dto.captchaToken, context.ip);

    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return;
    }

    const token = randomBytes(32).toString('hex');

    await this.prisma.$transaction([
      // requesting a new link kills the previous ones
      this.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          tokenHash: this.hashResetToken(token),
          userId: user.id,
          expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      }),
    ]);

    const link = `${this.config.getOrThrow<string>('frontendUrl')}/reset-password?token=${token}`;

    // TODO: send this link by email, the dev log is the only delivery channel for now
    if (this.config.get<string>('nodeEnv') !== 'production') {
      this.logger.warn(`Password reset for ${email}: ${link}`);
    }
  }

  async resetPassword(dto: ResetPasswordDto, context: RequestContext): Promise<void> {
    await this.captcha.verify(dto.captchaToken, context.ip);

    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hashResetToken(dto.token) },
    });

    if (!stored || stored.usedAt || stored.expiresAt <= new Date()) {
      throw new BadRequestException('Ссылка недействительна или устарела');
    }

    const password = await hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: stored.userId }, data: { password } }),
      this.prisma.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      }),
      // whoever knew the old password loses every live session
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    context: RequestContext,
  ): Promise<void> {
    await this.captcha.verify(dto.captchaToken, context.ip);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (!(await compare(dto.currentPassword, user.password))) {
      throw new BadRequestException('Неверный текущий пароль');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Новый пароль должен отличаться от текущего');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: await hash(dto.newPassword, BCRYPT_ROUNDS) },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async listSessions(userId: string, currentRefreshToken?: string): Promise<SessionInfo[]> {
    const currentHash = currentRefreshToken
      ? this.hashRefreshToken(currentRefreshToken)
      : null;

    const rows = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt.toISOString(),
      isCurrent: currentHash !== null && row.tokenHash === currentHash,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const row = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId, revokedAt: null },
    });

    if (!row) {
      throw new NotFoundException('Сессия не найдена');
    }

    await this.prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async findById(userId: string): Promise<PublicUser | null> {
    return this.cache.wrap(cacheKeys.authMe(userId), CACHE_TTL.USER_PROFILE, async () => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: selectAuthUser,
      });

      return user ? this.toPublicUser(user) : null;
    });
  }

  toPublicUser(user: UserWithPosition): PublicUser {
    const rawBadges = 'badges' in user ? user.badges : undefined;
    const badges = rawBadges
      ?.filter((b) => b.isActive)
      .map((b) => ({
        id: b.id,
        userId: b.userId,
        type: b.type as import('@twomc/shared').UserBadgeType,
        grantedAt: b.grantedAt.toISOString(),
        expiresAt: b.expiresAt?.toISOString() ?? null,
        isActive: b.isActive,
        grantedBy: b.grantedBy,
      }));

    return {
      id: user.id,
      shortId: user.shortId,
      tag: user.tag,
      email: user.email,
      username: user.username,
      roleGroup: user.roleGroup,
      position: toPublicPosition(user.position),
      customPosition:
        'customPosition' in user ? toCustomPositionView(user.customPosition) : null,
      departments: 'departments' in user ? toUserDepartments(user.departments) : undefined,
      avatar: user.avatar,
      isVerified: user.isVerified,
      isBanned: user.isBanned,
      createdAt: user.createdAt.toISOString(),
      ...(badges ? { badges } : {}),
    };
  }

  /** A dead code never blocks registration, the user just gets a notice */
  private async applyPromoCode(userId: string, code: string): Promise<PromoCodeResult> {
    const promo = await this.prisma.promoCode.findFirst({
      where: { code: { equals: code.trim(), mode: 'insensitive' } },
    });

    if (!promo || !promo.isActive) {
      return { applied: false, message: 'Промокод не найден или больше не действует' };
    }

    const now = new Date();
    const outOfWindow =
      (promo.validFrom !== null && promo.validFrom > now) ||
      (promo.validUntil !== null && promo.validUntil < now);
    const exhausted = promo.maxUses !== null && promo.usedCount >= promo.maxUses;

    if (outOfWindow || exhausted) {
      return { applied: false, message: 'Промокод не найден или больше не действует' };
    }

    try {
      // TODO: apply the actual discount once the store module exists
      await this.prisma.$transaction([
        this.prisma.promoCodeUsage.create({ data: { promoCodeId: promo.id, userId } }),
        this.prisma.promoCode.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } },
        }),
      ]);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { applied: false, message: 'Этот промокод уже использован' };
      }

      throw error;
    }

    return { applied: true, message: `Промокод ${promo.code} активирован` };
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

  private async issueSession(
    user: UserWithPosition,
    context: RequestContext,
  ): Promise<AuthSession> {
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

  /** 32 random bytes are unguessable on their own, so a plain digest is enough here */
  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private get refreshTtlSeconds(): number {
    return durationToSeconds(this.config.getOrThrow<string>('jwt.refreshExpires'));
  }
}
