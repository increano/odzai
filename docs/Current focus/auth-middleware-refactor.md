# Auth Middleware Refactor

## Issue

Our initial implementation of authentication using Next.js middleware had several issues:

1. **Heavy Session Management in Middleware**
   - We were doing extensive session checks in middleware
   - Performing database queries for workspace access
   - This is against Next.js best practices as middleware should be lightweight

2. **Unreliable Session Validation**
   - Using `getSession()` in middleware which Supabase warns against
   - Session cookies could be spoofed
   - No proper token refresh handling

3. **Performance Impact**
   - Database queries in middleware affecting all routes
   - Heavy operations causing potential delays in page loads
   - Unnecessary checks on static assets and API routes

## Solution

### 1. Lightweight Middleware

Refactored middleware to only handle token refresh:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession();

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### 2. Server Component Guards

Created dedicated auth guards for proper server-side validation:

```typescript
// AuthGuard for basic authentication
export async function AuthGuard({ children, requireEmailConfirmed = false }) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  if (requireEmailConfirmed && !user.email_confirmed_at) {
    redirect('/login?message=Please confirm your email first');
  }

  return <>{children}</>;
}

// WorkspaceGuard for workspace access
export async function WorkspaceGuard({ children, workspaceId }) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  const { data: workspaceAccess, error: workspaceError } = await supabase
    .from('workspace_users')
    .select('access_level')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (workspaceError || !workspaceAccess) {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
```

### 3. Protected Routes Implementation

Example of how to use the guards in a page:

```typescript
export default async function BudgetPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: preferences, error } = await supabase
    .from('user_preferences')
    .select('workspace_id')
    .single();

  if (error || !preferences?.workspace_id) {
    redirect('/onboarding/workspace');
  }

  return (
    <AuthGuard>
      <WorkspaceGuard workspaceId={preferences.workspace_id}>
        {/* Page content */}
      </WorkspaceGuard>
    </AuthGuard>
  );
}
```

## Benefits

1. **Better Performance**
   - Middleware only handles token refresh
   - Heavy operations moved to Server Components
   - Proper caching of static assets

2. **Enhanced Security**
   - Using `getUser()` for reliable auth checks
   - Auth checks closer to data access
   - Proper session management

3. **Improved Code Organization**
   - Clear separation of concerns
   - Reusable auth guards
   - Better TypeScript support

4. **Following Best Practices**
   - Aligned with Next.js recommendations
   - Following Supabase's SSR guidelines
   - Better error handling and user experience

## References

- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase SSR Auth Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication) 