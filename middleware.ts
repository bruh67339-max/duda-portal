// Next.js Middleware
// Handles authentication checks and security headers

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// API Routes that require authentication
const PROTECTED_API_ROUTES = ['/api/admin', '/api/client'];

// API Routes that are public
const PUBLIC_API_ROUTES = ['/api/auth/login', '/api/auth/password/reset', '/api/public'];

// Page routes that require authentication
const PROTECTED_PAGE_ROUTES = ['/admin', '/dashboard'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle page routes (not API)
  if (!pathname.startsWith('/api')) {
    // Check if it's a protected page route
    const isProtectedPage = PROTECTED_PAGE_ROUTES.some((route) =>
      pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isProtectedPage) {
      // Create a Supabase client to check authentication
      let response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      });

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                request.cookies.set(name, value)
              );
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              });
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to login if not authenticated
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      return response;
    }

    return NextResponse.next();
  }

  // Handle API routes
  // Allow public routes without auth
  if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Check if route is protected
  const isProtected = PROTECTED_API_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtected) {
    return addSecurityHeaders(NextResponse.next());
  }

  // For protected API routes, authentication is verified in route handlers
  // They support both Bearer token (external clients) and cookie session (browser)
  // Create response and add security headers
  const response = NextResponse.next();

  return addSecurityHeaders(response);
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Add rate limit headers if they exist in the request
  // (They'll be set by the rate limit middleware in route handlers)

  // CORS headers for public API
  if (response.headers.get('x-middleware-request-pathname')?.startsWith('/api/public')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  }

  return response;
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match admin and dashboard routes
    '/admin/:path*',
    '/dashboard/:path*',
  ],
};
