const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const configuration = () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toInt(process.env.API_PORT, 4000),
  // фронт крутится локально, в проде домен подставим через WEB_ORIGIN
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  // база для ссылок, которые уходят пользователю в письмах
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: toInt(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD ?? '',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '30d',
  },
  captcha: {
    secret: process.env.HCAPTCHA_SECRET ?? '',
    disabled: process.env.HCAPTCHA_DISABLED === 'true',
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN ?? 'localhost',
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: (process.env.COOKIE_SAMESITE ?? 'lax') as 'lax' | 'strict' | 'none',
  },
  uploads: {
    // относительный путь считается от рабочей директории apps/api
    dir: process.env.UPLOADS_DIR ?? './uploads',
    maxAvatarSize: toInt(process.env.UPLOAD_MAX_AVATAR_SIZE, 5 * 1024 * 1024),
    maxBannerSize: toInt(process.env.UPLOAD_MAX_BANNER_SIZE, 10 * 1024 * 1024),
  },
});

export type AppConfig = ReturnType<typeof configuration>;
