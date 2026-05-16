import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasToken = req.cookies.has('access_token');

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p);

  // Not logged in, trying to access protected route
  if (!hasToken && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Logged in, trying to access auth pages
  if (hasToken && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
