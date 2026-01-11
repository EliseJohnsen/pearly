import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/patterns', '/preview']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Get session token from cookie
  const sessionToken = request.cookies.get('session_token')?.value

  if (!sessionToken) {
    // No session token, redirect to login
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token with backend
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      // Invalid or expired token, redirect to login
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Token is valid, allow access
    return NextResponse.next()
  } catch (error) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/patterns/:path*',
    '/preview/:path*',
  ],
}
