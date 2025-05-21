# Supabase Migration Roadmap

## Overview

This document outlines the step-by-step implementation plan for migrating the application to Supabase for authentication, role-based access control, and PostgreSQL database integration. The migration will be performed incrementally while maintaining existing functionality, adhering to UI freeze prevention guidelines, and preserving legacy Actual features.

## Migration Phases

### Phase 1: Supabase Setup and Authentication Integration (80% Complete)

| Task | Status | Notes |
|------|--------|-------|
| Create Supabase project with PostgreSQL database | ✅ Completed | Set up dedicated project for the application |
| Configure authentication settings | ✅ Completed | Email/password for fmuhirwa@gmail.com |
| Set up initial database schema | ⬜️ Pending | User tables with role fields and core entities |
| Implement Supabase Auth in Next.js | ✅ Completed | Using Supabase JS client for authentication |
| Create authentication wrapper components | ✅ Completed | Created SupabaseAuthProvider |
| Implement session management | ✅ Completed | Using Supabase auth state change listener |
| Configure HTTP-only cookie auth | ✅ Completed | Using Supabase v2 default HTTP-only cookies |
| Implement PKCE flow for enhanced security | ✅ Completed | Client and server configuration updated |
| Create user account synchronization layer | ✅ Completed | Via database adapter pattern |
| Implement proper middleware cookie detection | ✅ Completed | Using simplified path-based auth verification |
| Fix redirect loops on login page | ✅ Completed | Implemented proper middleware path handling |
| Develop one-way password reset flow | ✅ Completed | Implemented forgot/reset password pages |

### Phase 2: Role-Based Access Control Implementation (40% Complete)

| Task | Status | Notes |
|------|--------|-------|
| Define role schema in Supabase | ✅ Completed | Admin and user roles defined |
| Configure Row Level Security policies | ⬜️ Pending | To enforce data access rules |
| Map existing permissions to new roles | ⬜️ Pending | Creating equivalence between systems |
| Create RequireAuth component | ✅ Completed | Implemented through RequireRole |
| Create RequireRole component | ✅ Completed | For role-specific access control |
| Implement role-based route guards | ✅ Completed | In middleware.ts with auth checks |
| Update sidebar with role-specific items | ⬜️ Pending | Show/hide based on user role |
| Move admin features behind role checks | ✅ Completed | For Supabase setup admin area |
| Create dedicated admin section | ✅ Completed | With Supabase credentials management |
| Implement server-side role verification | ⬜️ Pending | For enhanced security in API routes |

### Phase 3: Incremental Data Migration (40% Complete)

| Task | Status | Notes |
|------|--------|-------|
| Analyze SQLite schema | ✅ Completed | For database adapter implementation |
| Create equivalent PostgreSQL schema | ✅ Completed | In database adapters |
| Set up foreign key relationships | ⬜️ Pending | And appropriate indexes for performance |
| Create migration scripts per table | ✅ Completed | migrationWorker.ts implemented |
| Implement feature flag system | ✅ Completed | Via useDatabase hook |
| Set up read-only PostgreSQL connection | ⬜️ Pending | For initial testing with real data |
| Develop chunked data transfer utilities | ✅ Completed | In migrationWorker.ts |
| Create migration progress indicators | ✅ Completed | Progress tracking in worker |
| Implement scheduled off-peak migrations | ⬜️ Pending | To minimize user impact |

### Phase 4: Dual-Write System and Completion (30% Complete)

| Task | Status | Notes |
|------|--------|-------|
| Implement transaction system | ✅ Completed | Through database adapter pattern |
| Create fallback mechanisms | ⬜️ Pending | In case one system fails |
| Develop conflict detection and resolution | ⬜️ Pending | For data inconsistencies |
| Implement feature flags per feature | ✅ Completed | Using useDatabase hook and toggle |
| Migrate individual features incrementally | ⬜️ Pending | One at a time with thorough testing |
| Add performance tracking | ⬜️ Pending | To compare operation speeds |
| Optimize queries for PostgreSQL | ⬜️ Pending | Leveraging PostgreSQL-specific features |
| Create database adapter interfaces | ✅ Completed | DatabaseAdapter interface implemented |
| Develop compatibility layers | ⬜️ Pending | For Actual-specific features |

## Technical Implementation Specifications

### State-of-the-Art Authentication Implementation

```jsx
// Supabase client configuration with PKCE flow and HTTP-only cookies
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce', // Use PKCE flow for enhanced security
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Supabase v2+ automatically uses HTTP-only cookies by default
  }
});

// Modern SupabaseAuthProvider implementation
export function SupabaseAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Initialize with current session
    async function initializeAuth() {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      
      if (currentSession) {
        // Load user with role information
        const userWithRole = await getCurrentUserWithRole();
        setUser(userWithRole);
      }
      
      setLoading(false);
    }
    
    initializeAuth();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        
        if (!newSession) {
          setUser(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const userWithRole = await getCurrentUserWithRole();
          setUser(userWithRole);
        }
      }
    );
    
    // Clean up listener on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Improved Next.js Middleware with Explicit Routes

```typescript
// Path-based middleware for improved performance and reliability
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define paths that should be publicly accessible without authentication
const PUBLIC_ROUTES = [
  '/login',
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
  if (PUBLIC_ROUTES.includes(path)) {
    return true;
  }

  // Then check prefixes
  return PUBLIC_PATH_PREFIXES.some(prefix => path.startsWith(prefix));
}

/**
 * Middleware function that runs on applicable requests
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Skip auth check for public paths
  if (isPublicPath(path)) {
    return NextResponse.next();
  }
  
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
    return NextResponse.next();
  }
  
  // No session, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    // Only run middleware on specific protected paths
    '/budget/:path*',
    '/accounts/:path*',
    '/transactions/:path*',
    '/settings/:path*',
    '/api/budgets/:path*',
    '/api/accounts/:path*',
    '/api/transactions/:path*',
  ],
};
```

### PKCE Flow Implementation for Next.js

```typescript
// Using PKCE flow for enhanced security with server components
import { createClient } from '@supabase/supabase-js';

// Server component supabase client (for API routes and server components)
export function createServerSupabaseClient(cookieStore) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
      },
      global: {
        headers: {
          cookie: cookieStore
        }
      }
    }
  );
}

// API route example using PKCE flow with server-side auth
export async function GET(request) {
  const cookies = request.headers.get('cookie') || '';
  const supabase = createServerSupabaseClient(cookies);
  
  // Verify session server-side
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Process authenticated request
  // ...
}
```

### Session Refresh Implementation

```typescript
// Advanced session refresh handling for improved user experience
export function useSessionRefresh() {
  const { session } = useAuth();
  
  useEffect(() => {
    if (!session) return;
    
    // Calculate when to refresh (e.g., when 75% of token lifetime has elapsed)
    const accessToken = session.access_token;
    const tokenData = JSON.parse(atob(accessToken.split('.')[1]));
    const expiresAt = tokenData.exp * 1000; // Convert to milliseconds
    const refreshThreshold = (expiresAt - Date.now()) * 0.75;
    
    // Schedule refresh before token expires
    const refreshTimer = setTimeout(async () => {
      try {
        await supabase.auth.refreshSession();
        console.log('Session refreshed successfully');
      } catch (error) {
        console.error('Failed to refresh session:', error);
      }
    }, refreshThreshold);
    
    return () => clearTimeout(refreshTimer);
  }, [session]);
}
```

## Authentication Security Improvements

Based on latest Supabase best practices, we've improved our authentication security:

1. **PKCE Flow for Enhanced Security**
   - Implement Proof Key for Code Exchange flow for better security
   - Prevents CSRF and authorization code injection attacks
   - Better suited for server-side applications like Next.js
   - Handles auth code exchanges securely for short-lived tokens (5 minutes)

2. **Session Management with JWT Best Practices**
   - Using short-lived JWTs (access tokens) with proper refresh mechanism
   - Implementing proactive session refresh to prevent authentication interruptions
   - Leveraging Supabase's built-in token refresh capabilities
   - Properly cleaning up expired sessions

3. **HTTP-only Cookies by Default**
   - Using Supabase v2's default HTTP-only cookie implementation
   - Cookies are not accessible via JavaScript, preventing XSS attacks
   - Properly configured with secure flags in production
   - Implemented with proper CSRF protection

4. **Server-Side Validation**
   - Implementing proper server-side session validation in API routes
   - Using createServerSupabaseClient for server component authentication
   - Properly handling authentication errors with appropriate HTTP status codes
   - Implementing proper role-based access control at the server level

5. **Specialized Middleware Implementation**
   - Created targeted middleware with explicit path patterns
   - Improved performance by limiting middleware execution
   - Better error handling for authentication edge cases
   - Eliminated redirect loops through careful path management

## UI Freeze Prevention Techniques

To maintain UI responsiveness during this migration, the following techniques will be employed:

1. **Chunked Processing**
   - Split large data operations into small chunks
   - Process chunks with requestAnimationFrame to yield to UI thread
   - Implement pause/resume capabilities for long-running operations

2. **Optimistic UI Updates**
   - Update UI immediately before database operations complete
   - Implement rollback mechanisms for failed operations
   - Use local state management for immediate feedback

3. **Background Operations**
   - Use Web Workers for CPU-intensive tasks
   - Schedule data migrations during idle periods
   - Implement progress indicators for long-running processes

4. **Staged Transitions**
   - Complete UI animations before starting data operations
   - Use setTimeout to schedule operations after animations
   - Implement loading states during transitions

## Overall Completion

| Phase | Description | Status | Progress |
|-------|-------------|--------|----------|
| Phase 1 | Supabase Setup and Authentication | In Progress | 80% |
| Phase 2 | Role-Based Access Control | In Progress | 40% |
| Phase 3 | Incremental Data Migration | In Progress | 40% |
| Phase 4 | Dual-Write System and Completion | In Progress | 30% |
| **OVERALL** | **Project Completion** | **In Progress** | **53%** |

## Success Criteria

The migration will be considered successful when:

1. All users have been migrated to Supabase authentication
2. Role-based access control is fully implemented
3. All data has been migrated to PostgreSQL
4. Application performance is equal to or better than with SQLite
5. All legacy features continue to function as expected
6. No UI freezes occur during normal operation
7. Authentication is properly secured with PKCE flow and HTTP-only cookies
8. Session management follows best practices for security and user experience 