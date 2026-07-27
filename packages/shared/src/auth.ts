import type { PublicUser, RoleGroup } from './user';

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}

export interface RefreshResponse {
  accessToken: string;
}

/** Login answers with this instead of tokens once the ip looks suspicious */
export interface CaptchaRequiredResponse {
  requiresCaptcha: true;
}

export type LoginResponse = AuthResponse | CaptchaRequiredResponse;

export interface AccessTokenPayload {
  sub: string;
  email: string;
  username: string;
  roleGroup: RoleGroup;
}

export interface SuccessResponse {
  success: true;
  message?: string;
}

/** Promo code result travels next to the session, a bad code never fails registration */
export interface RegisterResponse extends AuthResponse {
  promoCode?: {
    applied: boolean;
    message: string;
  };
}
