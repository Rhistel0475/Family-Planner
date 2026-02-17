import { auth } from './lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/error'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // API routes that should be public
  const publicApiRoutes = ['/api/auth'];
  const isPublicApi = publicApiRoutes.some((route) => pathname.startsWith(route));

  // If user is not logged in and trying to access a protected route
  if (!isLoggedIn && !isPublicRoute && !isPublicApi) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If user is logged in but doesn't have a family, redirect to setup
  if (isLoggedIn && !req.auth.user?.familyId && pathname !== '/setup' && !isPublicRoute) {
    return NextResponse.redirect(new URL('/setup', req.url));
  }

  // If user is logged in and on signin page, redirect to home
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
