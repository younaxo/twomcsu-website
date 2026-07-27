import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// единый .env лежит в корне монорепо
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
config({ path: resolve(rootDir, '.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    NEXT_PUBLIC_HCAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? '',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'mc-heads.net' },
      { protocol: 'https', hostname: 'minotar.net' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'http', hostname: 'localhost', port: '4000' },
      { protocol: 'http', hostname: '127.0.0.1', port: '4000' },
    ],
  },
};

export default nextConfig;
