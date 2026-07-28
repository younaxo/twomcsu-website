import { NextRequest, NextResponse } from 'next/server';

const REFRESH_COOKIE = 'refresh_token';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

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
      // Avoid Next data cache for middleware freshness; we cache in-memory
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth-gated routes
  if (pathname.startsWith('/profile') || pathname.startsWith('/admin')) {
    if (!request.cookies.has(REFRESH_COOKIE)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Skip maintenance rewrite for auth/admin/maintenance itself
  const skipMaintenance =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname === '/maintenance';

  // Guests → rewrite to maintenance page.
  // Logged-in users pass through; MaintenanceGate hides content for non-admins.
  if (!skipMaintenance && !request.cookies.has(REFRESH_COOKIE)) {
    const maintenance = await isMaintenanceEnabled();
    if (maintenance) {
      const url = request.nextUrl.clone();
      url.pathname = '/maintenance';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
