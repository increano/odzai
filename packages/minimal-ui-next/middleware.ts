import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Authentication middleware
 * 
 * This lightweight middleware only:
 * 1. Protects routes that require authentication
 * 2. Redirects authenticated users away from auth pages
 * 3. Doesn't handle token processing (that's done by route handlers)
 */
export async function middleware(request: NextRequest) {
  // Let Supabase handle session refresh and cookie management
  // This approach handles both authentication and routing automatically
  return await updateSession(request)
}

/**
 * Configure paths where middleware should run
 * Only apply to routes that need auth checks
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 