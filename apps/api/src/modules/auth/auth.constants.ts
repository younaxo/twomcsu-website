export const REFRESH_COOKIE_NAME = 'refresh_token';

export const BCRYPT_ROUNDS = 12;

/** Failed logins from one ip before we start asking for a captcha */
export const CAPTCHA_AFTER_ATTEMPTS = 3;

/** Failed logins from one ip before the ip is locked out */
export const BLOCK_AFTER_ATTEMPTS = 10;

export const BRUTE_FORCE_WINDOW_SECONDS = 900;

/** Lifetime of a password reset link */
export const PASSWORD_RESET_TTL_MS = 3_600_000;
