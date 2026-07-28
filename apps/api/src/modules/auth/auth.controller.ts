import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import {
  AuthResponse,
  LoginResponse,
  PublicUser,
  RefreshResponse,
  RegisterResponse,
  SessionInfo,
  SuccessResponse,
} from '@twomc/shared';
import { Request, Response } from 'express';
import { REFRESH_COOKIE_NAME } from './auth.constants';
import { AuthService, AuthSession } from './auth.service';
import { AuthenticatedUser } from './authenticated-user';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CookieConfig, clearRefreshCookie, setRefreshCookie } from './refresh-cookie';
import { getRequestContext } from './request-context';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegisterResponse> {
    const session = await this.authService.register(dto, getRequestContext(req));

    return { ...this.withRefreshCookie(session, res), promoCode: session.promoCode };
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponse> {
    const result = await this.authService.login(dto, getRequestContext(req));

    if ('requiresCaptcha' in result) {
      return result;
    }

    return this.withRefreshCookie(result, res);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponse> {
    const token = this.readRefreshToken(req) ?? dto.refreshToken;
    const session = await this.authService.refresh(token, getRequestContext(req));

    return { accessToken: this.withRefreshCookie(session, res).accessToken };
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    await this.authService.forgotPassword(dto, getRequestContext(req));

    return {
      success: true,
      message: 'Если такой email существует, мы отправили ссылку для сброса',
    };
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: Request,
  ): Promise<SuccessResponse> {
    await this.authService.resetPassword(dto, getRequestContext(req));

    return { success: true };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() current: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SuccessResponse> {
    await this.authService.changePassword(current.id, dto, getRequestContext(req));
    clearRefreshCookie(res, this.cookieConfig());

    return { success: true, message: 'Пароль изменён, войдите снова' };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  listSessions(
    @CurrentUser() current: AuthenticatedUser,
    @Req() req: Request,
  ): Promise<SessionInfo[]> {
    return this.authService.listSessions(current.id, this.readRefreshToken(req));
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeAllSessions(
    @CurrentUser() current: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.revokeAllSessions(current.id);
    clearRefreshCookie(res, this.cookieConfig());
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeSession(
    @CurrentUser() current: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.authService.revokeSession(current.id, id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: true }> {
    await this.authService.logout(this.readRefreshToken(req));
    clearRefreshCookie(res, this.cookieConfig());

    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() current: AuthenticatedUser): Promise<PublicUser> {
    const user = await this.authService.findById(current.id);

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  private cookieConfig(): CookieConfig {
    return this.config.getOrThrow<CookieConfig>('cookie');
  }

  private readRefreshToken(req: Request): string | undefined {
    return req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  }

  private withRefreshCookie(session: AuthSession, res: Response): AuthResponse {
    setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt, this.cookieConfig());

    return { accessToken: session.accessToken, user: session.user };
  }
}
