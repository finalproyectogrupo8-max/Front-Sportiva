import { NextResponse, type NextRequest } from 'next/server'
import { PLATFORM_COOKIE, SESSION_COOKIE } from '@/lib/session-cookies'

// Gate optimista (docs/integracion-api-laravel.md §4): sin cookie de sesión, al login.
// No llama a la API ni valida el token: eso lo hace requireSession() en cada página.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE) || request.cookies.has(PLATFORM_COOKIE)
  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/clubes/:path*', '/c/:path*', '/admin/:path*'],
}
