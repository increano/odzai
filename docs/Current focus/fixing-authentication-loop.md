# Fixing Authentication Loop Issue

## Problem Description

After successful signup and email verification, users experience an infinite login loop where:
1. Login succeeds and redirects to onboarding
2. Onboarding layout fails authentication check
3. User gets redirected back to login
4. Loop continues indefinitely

## Root Cause Analysis

The issue stems from inconsistent Supabase client configurations between middleware and server components:

1. **Middleware**: Uses custom Supabase client with `autoRefreshToken: false` and `persistSession: false`
2. **Server Components**: Uses `createServerComponentClient` from deprecated `@supabase/auth-helpers-nextjs`
3. **Inconsistent Session Handling**: Different clients read/write cookies differently, causing session mismatch

## Solution: Migrate to @supabase/ssr Package

According to Supabase documentation, we need to migrate from the deprecated `@supabase/auth-helpers-nextjs` to the new `@supabase/ssr` package.

### Step 1: Update Dependencies

```bash
# Remove deprecated package
npm uninstall @supabase/auth-helpers-nextjs

# Install new SSR package
npm install @supabase/ssr
```

### Step 2: Create Proper Supabase Client Utilities

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

Update `src/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Step 3: Remove Authentication Logic from Middleware

**Key Change**: Remove all authentication verification from middleware. Middleware should only handle lightweight routing decisions based on cookie presence, not verify sessions.

Replace the current middleware with a minimal version that only checks for auth cookies:

```typescript
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const pathname = url.pathname

  // Only check for the presence of auth cookies, don't verify them
  const authCookie = request.cookies.get('sb-access-token') || 
                    request.cookies.get('supabase-auth-token') ||
                    request.cookies.get('sb-auth-token')

  // Protected routes that require authentication
  const protectedRoutes = ['/budget', '/settings', '/profile', '/onboarding']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Auth routes where authenticated users shouldn't be
  const authRoutes = ['/login', '/signup', '/forgot-password']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // If no auth cookie and trying to access protected route
  if (!authCookie && isProtectedRoute) {
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // If has auth cookie and trying to access auth route
  if (authCookie && isAuthRoute) {
    url.pathname = '/budget'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

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
}
```

**Why This Approach Works:**
- Middleware stays lightweight and fast
- No session verification in middleware (which was causing the mismatch)
- Actual authentication verification happens in server components using consistent SSR client
- Follows Next.js middleware best practices

### Step 4: Update Server Components

Replace `createServerComponentClient` usage in `src/app/onboarding/layout.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Check if user has already completed onboarding
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('data')
    .single()

  const onboardingCompleted = preferences?.data?.onboarding?.completed

  if (onboardingCompleted) {
    redirect('/budget')
  }

  // Rest of the component...
}
```

### Step 5: Update Login Actions

Update login actions to use proper server client and add revalidation:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding/welcome')
}
```

### Step 6: Update Client Components

Update any client components using Supabase to use the new client:

```typescript
import { createClient } from '@/lib/supabase/client'

// In your components
const supabase = createClient()
```

### Step 7: Implement Proper Cookie-Based Session Management

**Key Addition**: Let Supabase handle session persistence through cookies automatically by using the proper SSR middleware pattern.

**Important Note**: This step provides an alternative to Step 3's simplified middleware. Choose one approach:

**Option A (Step 3)**: Minimal middleware for simple applications
**Option B (Step 7)**: Full SSR middleware for production applications (recommended)

According to the Supabase SSR documentation, we need middleware that refreshes expired Auth tokens and stores them properly. Create `src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // IMPORTANT: This refreshes the Auth token and stores it properly
  await supabase.auth.getUser()

  return response
}
```

**If using Option B (recommended for production)**, replace your main middleware entirely:

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Let Supabase handle session refresh and cookie management
  // This approach handles both authentication and routing automatically
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**This approach ensures:**
- Supabase automatically handles session persistence through cookies
- Expired tokens are refreshed automatically
- Consistent cookie management across the entire application
- Server Components receive properly refreshed tokens
- No authentication loops due to session mismatches

**Choose Option A (Step 3) if:**
- You want minimal middleware overhead
- You're debugging authentication issues
- You prefer explicit route protection in server components

**Choose Option B (Step 7) if:**
- You want production-ready authentication
- You want automatic token refresh
- You want to follow Supabase's official SSR recommendations

## Key Benefits of This Migration

1. **Consistent Session Handling**: Both middleware and server components use the same SSR package
2. **Lightweight Middleware**: Middleware only checks cookie presence, not session validity
3. **Proper Cookie Management**: Automatic cookie handling for session persistence
4. **Future-Proof**: Using the recommended Supabase SSR package
5. **Better Error Handling**: Proper error boundaries and session validation
6. **Follows Best Practices**: Aligns with Next.js middleware recommendations

## Testing the Fix

1. Clear browser cookies and local storage
2. Sign up with a new email
3. Verify email through the confirmation link
4. Log in with verified credentials
5. Should successfully redirect to onboarding without loops

## Additional Considerations

- Ensure all environment variables are properly set
- Test with different browsers to verify cookie behavior
- Monitor server logs for any remaining authentication errors
- Consider adding error boundaries for better user experience
- The middleware now only handles routing, not authentication verification 