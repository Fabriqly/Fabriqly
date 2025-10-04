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
        if (req.nextUrl.pathname.startsWith('/api/auth/')) {
          return true;
        }
        
        // Allow public API routes (GET requests only for browsing)
        if (req.nextUrl.pathname.startsWith('/api/products') && req.method === 'GET') {
          return true;
        }
        
        if (req.nextUrl.pathname.startsWith('/api/categories') && req.method === 'GET') {
          return true;
        }
        
        if (req.nextUrl.pathname.startsWith('/api/designs') && req.method === 'GET') {
          return true;
        }
        
        // Allow access to public pages
        if (req.nextUrl.pathname.startsWith('/login') || 
            req.nextUrl.pathname.startsWith('/register') ||
            req.nextUrl.pathname.startsWith('/forgot-password') ||
            req.nextUrl.pathname.startsWith('/reset-password') ||
            req.nextUrl.pathname.startsWith('/role-selection') ||
            req.nextUrl.pathname.startsWith('/business/login') ||
            req.nextUrl.pathname.startsWith('/explore') ||
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
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
