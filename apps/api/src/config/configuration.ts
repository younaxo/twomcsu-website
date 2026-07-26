const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const configuration = () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toInt(process.env.API_PORT, 4000),
  // фронт крутится локально, в проде домен подставим через WEB_ORIGIN
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: toInt(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD ?? '',
  },
});

export type AppConfig = ReturnType<typeof configuration>;
