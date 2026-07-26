import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthResponse } from '@twomc/shared';
import { Request, Response } from 'express';
import { AuthService, AuthSession } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { CookieConfig, setRefreshCookie } from './refresh-cookie';
import { getRequestContext } from './request-context';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const session = await this.authService.register(dto, getRequestContext(req));

    return this.withRefreshCookie(session, res);
  }

  private withRefreshCookie(session: AuthSession, res: Response): AuthResponse {
    setRefreshCookie(
      res,
      session.refreshToken,
      session.refreshExpiresAt,
      this.config.getOrThrow<CookieConfig>('cookie'),
    );

    return { accessToken: session.accessToken, user: session.user };
  }
}
