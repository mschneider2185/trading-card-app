import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = ['/collections', '/profile']
const authRoutes = ['/login', '/signup']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const pathname = req.nextUrl.pathname

  // Only check auth for protected routes and auth routes
  if (protectedRoutes.some(route => pathname.startsWith(route)) || authRoutes.includes(pathname)) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If user is not signed in and trying to access a protected route,
    // redirect to login
    if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // If user is signed in and trying to access auth routes,
    // redirect to home
    if (session && authRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 