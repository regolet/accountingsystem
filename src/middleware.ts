import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Allow access to auth pages without authentication
    if (pathname.startsWith('/auth/')) {
      return NextResponse.next()
    }

    // Redirect to signin if not authenticated
    if (!token && pathname !== '/') {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Role-based access control
    if (token) {
      const userRole = token.role as string

      // Admin-only routes
      if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }

      // Accountant and Admin can access most features
      if (pathname.startsWith('/settings') && !['ADMIN', 'ACCOUNTANT'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to home page and auth pages
        if (pathname === '/' || pathname.startsWith('/auth/')) {
          return true
        }
        
        // Require authentication for all other pages
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}