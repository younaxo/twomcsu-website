const requiredVars = ['DATABASE_URL'];

export function validateEnv(env: Record<string, unknown>) {
  const missing = requiredVars.filter((name) => !env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required env variables: ${missing.join(', ')}`);
  }

  return env;
}
