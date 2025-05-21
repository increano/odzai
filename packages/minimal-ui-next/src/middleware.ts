import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define paths that should be publicly accessible without authentication
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/onboarding',
  '/onboarding/welcome',
  '/onboarding/workspace',
  '/onboarding/profile',
  '/onboarding/complete',
  '/api/user/preferences',
  '/api/auth',
];

// Helper for public paths that start with these prefixes
const PUBLIC_PATH_PREFIXES = [
  '/_next/',
  '/favicon.ico',
  '/public/',
  '/api/metrics/',
];

/**
 * Check if a path should be accessible without authentication
 */
function isPublicPath(path: string): boolean {
  // Check exact routes first
  for (const route of PUBLIC_ROUTES) {
    // Check for exact match or route with trailing slash
    if (path === route || path === `${route}/`) {
      return true;
    }
  }

  // Then check prefixes
  return PUBLIC_PATH_PREFIXES.some(prefix => path.startsWith(prefix));
}

/**
 * Detect if the request is coming from the login, signup, or onboarding pages
 */
function isFromAuthPage(request: NextRequest): boolean {
  const referer = request.headers.get('referer') || '';
  return referer.includes('/login') || referer.includes('/signup') || referer.includes('/onboarding');
}

/**
 * Middleware function that runs on applicable requests
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Log the current path for debugging
  console.log(`Middleware processing: ${path}`);

  // Always skip auth check for public paths
  if (isPublicPath(path)) {
    console.log(`Public path: ${path}, skipping auth check`);
    return NextResponse.next();
  }
  
  // Skip auth check for requests coming from auth pages to prevent redirect loops
  if (isFromAuthPage(request)) {
    console.log(`Request from auth page to ${path}, skipping auth check to prevent loops`);
    return NextResponse.next();
  }
  
  // Get Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  try {
    // Initialize Supabase with current request cookies
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      },
    });

    // Check for an active session
    const { data } = await supabase.auth.getSession();
    
    // If we have a valid session, allow the request
    if (data.session) {
      console.log(`Authenticated access to ${path}`);
      return NextResponse.next();
    }
    
    // No session, redirect to login
    console.log(`No session, redirecting to login from ${path}`);
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    // In case of error, redirect to login as fallback
    console.error(`Auth error: ${error}`);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

/**
 * Configure which paths the middleware should run on
 * Use a simple pattern to avoid regex complexity
 */
export const config = {
  matcher: [
    // Only run middleware on specific protected paths,
    // explicitly listing them instead of using complex patterns
    '/budget/:path*',
    '/accounts/:path*',
    '/transactions/:path*',
    '/settings/:path*',
    '/reports/:path*',
    '/goals/:path*',
    '/schedules/:path*',
    '/api/budgets/:path*',
    '/api/accounts/:path*',
    '/api/transactions/:path*',
  ],
}; 