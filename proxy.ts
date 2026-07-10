import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'
import {
  getUmamiRequestHeaders,
  getUmamiRewriteUrl,
} from '@/lib/analytics/umami-proxy'

const SESSION_COOKIE = 'admin-session'

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // 1. Interceptar peticiones de analytics (/stats/*) para reenviar la IP normalizada por el ingress confiable
  if (pathname.startsWith('/stats/')) {
    // This header must be created by a trusted ingress. Never derive it from
    // client-controlled forwarding headers here.
    const requestHeaders = getUmamiRequestHeaders(request.headers)

    const umamiUrl =
      process.env.NEXT_PUBLIC_UMAMI_URL || 'https://analytics.adogrz.com'

    return NextResponse.rewrite(
      getUmamiRewriteUrl(umamiUrl, pathname, search),
      {
        request: {
          headers: requestHeaders,
        },
      },
    )
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
