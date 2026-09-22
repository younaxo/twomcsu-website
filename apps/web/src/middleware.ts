import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const REFRESH_COOKIE = 'refresh_token';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const NON_DEFAULT_LOCALES = routing.locales.filter((locale) => locale !== routing.defaultLocale);

const intlMiddleware = createIntlMiddleware(routing);

type CachedStatus = {
  at: number;
  maintenance: boolean;
};

let statusCache: CachedStatus | null = null;
const CACHE_MS = 30_000;

async function isMaintenanceEnabled(): Promise<boolean> {
  const now = Date.now();
  if (statusCache && now - statusCache.at < CACHE_MS) {
    return statusCache.maintenance;
  }

  try {
    const res = await fetch(`${API_URL}/system/status`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      return statusCache?.maintenance ?? false;
    }
    const data = (await res.json()) as { maintenance?: { isEnabled?: boolean } };
    const maintenance = Boolean(data.maintenance?.isEnabled);
    statusCache = { at: now, maintenance };
    return maintenance;
  } catch {
    return statusCache?.maintenance ?? false;
  }
}

/** Splits off a leading /uk or /en locale segment so route checks work regardless of locale */
function stripLocalePrefix(pathname: string): { locale: string; rest: string } {
  for (const locale of NON_DEFAULT_LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return { locale, rest: pathname.slice(locale.length + 1) || '/' };
    }
  }
  return { locale: routing.defaultLocale, rest: pathname };
}

/** Rebuilds an internal path with the current locale's prefix (default locale stays unprefixed) */
function withLocale(locale: string, path: string): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locale, rest } = stripLocalePrefix(pathname);

  // Auth-gated routes
  if (
    rest.startsWith('/profile') ||
    rest.startsWith('/admin') ||
    rest.startsWith('/dashboard') ||
    rest.startsWith('/moderation')
  ) {
    if (!request.cookies.has(REFRESH_COOKIE)) {
      const url = request.nextUrl.clone();
      url.pathname = withLocale(locale, '/login');
      return NextResponse.redirect(url);
    }
  }

  const skipMaintenance =
    rest.startsWith('/admin') ||
    rest.startsWith('/dashboard') ||
    rest.startsWith('/moderation') ||
    rest.startsWith('/login') ||
    rest.startsWith('/register') ||
    rest.startsWith('/forgot-password') ||
    rest.startsWith('/reset-password') ||
    rest === '/maintenance';

  // Guests → rewrite to maintenance page.
  // Logged-in users pass through; MaintenanceGate hides content for non-admins.
  if (!skipMaintenance && !request.cookies.has(REFRESH_COOKIE)) {
    const maintenance = await isMaintenanceEnabled();
    if (maintenance) {
      const url = request.nextUrl.clone();
      url.pathname = withLocale(locale, '/maintenance');
      return NextResponse.rewrite(url);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
