import { NextRequest, NextResponse } from 'next/server';

// api sets it for the whole localhost domain, so :3000 sees the cookie too
const REFRESH_COOKIE = 'refresh_token';

export function middleware(request: NextRequest) {
  if (request.cookies.has(REFRESH_COOKIE)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/profile/:path*', '/dashboard/:path*', '/moderation/:path*', '/admin/:path*'],
};
