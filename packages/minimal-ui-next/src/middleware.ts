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
 * Check if request is to a workspace-specific API route
 */
function isWorkspaceApiRequest(path: string): boolean {
  return path.startsWith('/api/budgets/') || 
         path.startsWith('/api/accounts/') || 
         path.startsWith('/api/transactions/');
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
    
    // If we have a valid session, continue with additional checks if needed
    if (data.session) {
      console.log(`Authenticated access to ${path}`);
      
      // For workspace-specific API requests, we need to check workspace access
      if (isWorkspaceApiRequest(path)) {
        // Extract the workspace ID from the path
        const match = path.match(/\/api\/(budgets|accounts|transactions)\/([^\/]+)/);
        if (match && match[2]) {
          const workspaceId = match[2];
          
          // Check if the user has access to this workspace
          try {
            const { data: workspaceAccess, error } = await supabase
              .from('workspace_users')
              .select('access_level')
              .eq('workspace_id', workspaceId)
              .eq('user_id', data.session.user.id)
              .single();
            
            if (error || !workspaceAccess) {
              console.log(`User does not have access to workspace ${workspaceId}`);
              return NextResponse.redirect(new URL('/unauthorized', request.url));
            }
            
            console.log(`User has ${workspaceAccess.access_level} access to workspace ${workspaceId}`);
          } catch (err) {
            console.error('Error checking workspace access:', err);
          }
        }
      }
      
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