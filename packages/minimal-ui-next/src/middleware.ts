import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Get pathname for auth page check
  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname === '/login' || 
                    pathname === '/signup' || 
                    pathname.startsWith('/onboarding')

  // Initialize response headers with the pathname
  const responseHeaders = new Headers(request.headers)
  responseHeaders.set('x-pathname', pathname)

  // Create response object
  let response = NextResponse.next({
    request: {
      headers: responseHeaders
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
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // Use getUser instead of getSession as recommended by Supabase
    const { data: { user }, error } = await supabase.auth.getUser()

    // If we're on an auth page and user is logged in, redirect to home
    if (user && isAuthPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // If we're not on an auth page and user is not logged in, redirect to login
    if (!user && !isAuthPage) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // For all other cases, proceed with the request
    return response
  } catch (error) {
    console.error('Auth error in middleware:', error)
    // On error, redirect to login for safety
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 