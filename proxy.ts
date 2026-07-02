import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'

const SESSION_COOKIE = 'admin-session'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Dejar pasar la página de login
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  const session = request.cookies.get(SESSION_COOKIE)
  const isValid = await verifySession(session?.value)

  if (!isValid) {
    const loginUrl = new URL('/admin/login', request.url)
    // Limpiar cookie corrupta/expirada si existe
    const response = NextResponse.redirect(loginUrl)
    if (session) {
      response.cookies.delete(SESSION_COOKIE)
    }
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
