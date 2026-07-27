const requiredVars = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

export function validateEnv(env: Record<string, unknown>) {
  const missing = requiredVars.filter((name) => !env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required env variables: ${missing.join(', ')}`);
  }

  if (env.HCAPTCHA_DISABLED !== 'true' && !env.HCAPTCHA_SECRET) {
    throw new Error('HCAPTCHA_SECRET is required unless HCAPTCHA_DISABLED=true');
  }

  return env;
}
