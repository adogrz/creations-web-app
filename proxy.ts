import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'

const SESSION_COOKIE = 'admin-session'

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // 1. Interceptar peticiones de analytics (/stats/*) para inyectar IP real
  if (pathname.startsWith('/stats/')) {
    const ip =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-visitor-ip', ip)

    const umamiUrl =
      process.env.NEXT_PUBLIC_UMAMI_URL || 'https://analytics.adogrz.com'
    const targetPath = pathname.replace(/^\/stats/, '')
    const targetUrl = `${umamiUrl}${targetPath}${search}`

    return NextResponse.rewrite(new URL(targetUrl, request.url), {
      request: {
        headers: requestHeaders,
      },
    })
  }

  // 2. Interceptar rutas de administración (/admin/*) para verificación de sesión
  if (pathname.startsWith('/admin')) {
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
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/stats/:path*'],
}
