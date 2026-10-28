import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { apiFetch, type Schemas } from '@/lib/api/client'
import { cookieOptions, PLATFORM_COOKIE, SESSION_COOKIE } from '@/lib/session-cookies'

// Route Handler para selección automática en el servidor (un solo club sin parpadeo).
// Como los Server Components no pueden escribir cookies durante el render, /clubes redirige
// acá cuando hay un único club, se setea la cookie del club y se redirige a /c/<slug>.
export async function GET(request: NextRequest) {
  const tenant = request.nextUrl.searchParams.get('tenant')
  if (!tenant) {
    return NextResponse.redirect(new URL('/clubes', request.url))
  }

  const result = await apiFetch<Schemas['SelectTenantResource']>('/auth/select-tenant', {
    method: 'POST',
    body: { tenant },
    auth: 'session',
    sessionErrors: 'return',
  })

  if (!result.ok) {
    if (result.status === 401) {
      const store = await cookies()
      store.delete(SESSION_COOKIE)
      store.delete(PLATFORM_COOKIE)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const code = 'code' in result ? result.code : undefined
    const errorMsg =
      code === 'tenant_inactive'
        ? 'El club no está activo.'
        : code === 'membership_inactive'
          ? 'No tenés acceso a este club.'
          : 'No tenés acceso a este club.'

    return NextResponse.redirect(new URL(`/clubes?error=${encodeURIComponent(errorMsg)}`, request.url))
  }

  const { token, expires_at } = result.data
  const store = await cookies()
  store.set(SESSION_COOKIE, token, cookieOptions(expires_at))

  return NextResponse.redirect(new URL(`/c/${tenant}`, request.url))
}

