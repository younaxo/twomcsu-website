import { CookieOptions, Response } from 'express';
import { REFRESH_COOKIE_NAME } from './auth.constants';

export interface CookieConfig {
  domain: string;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
}

const baseOptions = (config: CookieConfig): CookieOptions => ({
  httpOnly: true,
  domain: config.domain,
  secure: config.secure,
  sameSite: config.sameSite,
  path: '/',
});

export function setRefreshCookie(
  res: Response,
  token: string,
  expiresAt: Date,
  config: CookieConfig,
): void {
  res.cookie(REFRESH_COOKIE_NAME, token, { ...baseOptions(config), expires: expiresAt });
}

export function clearRefreshCookie(res: Response, config: CookieConfig): void {
  res.clearCookie(REFRESH_COOKIE_NAME, baseOptions(config));
}
