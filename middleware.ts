import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE = 'admin-session'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let the login page through
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  const session = request.cookies.get(SESSION_COOKIE)
  if (!session || session.value !== 'authenticated') {
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
