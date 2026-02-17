import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // If user is logged in but doesn't have a family, redirect to setup (allow /setup and /setup/done)
    if (token && !token.familyId && pathname !== '/setup' && pathname !== '/setup/done') {
      return NextResponse.redirect(new URL('/setup', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        // Public routes that don't require authentication
        const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/error'];
        const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

        // If it's a public route, allow access
        if (isPublicRoute) {
          // If user is already logged in, redirect to home
          if (token) {
            return false; // Will trigger redirect in pages config
          }
          return true;
        }

        // For protected routes, require a token
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (except /api/protected/*)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
