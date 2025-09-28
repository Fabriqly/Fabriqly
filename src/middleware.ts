import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Allow the request to continue
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Always allow access to auth pages and API routes
        if (req.nextUrl.pathname.startsWith('/api/auth/') ||
            req.nextUrl.pathname.startsWith('/api/test-') ||
            req.nextUrl.pathname.startsWith('/api/diagnose-') ||
            req.nextUrl.pathname.startsWith('/api/create-test-') ||
            req.nextUrl.pathname.startsWith('/api/debug') ||
            req.nextUrl.pathname.startsWith('/api/direct-') ||
            req.nextUrl.pathname.startsWith('/api/check-')) {
          return true;
        }
        
        // Allow access to public pages
        if (req.nextUrl.pathname.startsWith('/login') || 
            req.nextUrl.pathname.startsWith('/register') ||
            req.nextUrl.pathname.startsWith('/role-selection') ||
            req.nextUrl.pathname.startsWith('/forgot-password') ||
            req.nextUrl.pathname.startsWith('/reset-password') ||
            req.nextUrl.pathname.startsWith('/nav-test') ||
            req.nextUrl.pathname.startsWith('/test-forgot') ||
            req.nextUrl.pathname.startsWith('/test-email') ||
            req.nextUrl.pathname.startsWith('/test-automatic') ||
            req.nextUrl.pathname === '/') {
          return true;
        }

        // For protected pages, require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!api/auth|api/users|_next/static|_next/image|favicon.ico).*)',
  ],
};
