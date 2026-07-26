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
