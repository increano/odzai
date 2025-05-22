import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Authentication middleware
 * 
 * This lightweight middleware only:
 * 1. Protects routes that require authentication
 * 2. Redirects authenticated users away from auth pages
 * 3. Doesn't handle token processing (that's done by route handlers)
 */
export async function middleware(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Get Supabase credentials from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    // Create a Supabase client with the cookies from the request
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      },
    });
    
    // Get the current user - this is a lightweight operation
    const { data: { user } } = await supabase.auth.getUser();
    
    // Define protected routes that require authentication
    const protectedRoutes = ['/budget', '/settings', '/profile', '/onboarding'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    
    // Define auth routes where authenticated users shouldn't be
    const authRoutes = ['/login', '/signup', '/forgot-password'];
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    
    // If user is not authenticated and tries to access protected route
    if (!user && isProtectedRoute) {
      const redirectUrl = new URL('/login', request.url);
      // Add the original URL as a "next" parameter so we can redirect after login
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // If user is authenticated and tries to access auth route
    if (user && isAuthRoute) {
      // Redirect to dashboard or home page
      return NextResponse.redirect(new URL('/budget', request.url));
    }
    
    return NextResponse.next();
  } catch (e) {
    console.error('Auth middleware error:', e);
    // Continue rather than blocking the request
    return NextResponse.next();
  }
}

/**
 * Configure paths where middleware should run
 * Only apply to routes that need auth checks
 */
export const config = {
  matcher: [
    '/budget/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/onboarding/:path*',
    '/login',
    '/signup',
    '/forgot-password',
  ],
}; 