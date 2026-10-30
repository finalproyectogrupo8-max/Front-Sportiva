import 'server-only'

import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { apiFetch, type Schemas } from '@/lib/api/client'
import { PLATFORM_COOKIE, SESSION_COOKIE, SESSION_EXPIRED_PATH } from '@/lib/session-cookies'

// Lectura de la sesión para Server Components. No es 'use server' a propósito:
// así no queda expuesta como Server Action que cualquiera pueda invocar.

export type Session = {
  user: Schemas['UserResource']
  tenants: Schemas['TenantSummaryResource'][]
  tenant?: Schemas['TenantSummaryResource']
  /** Perfil del usuario en el club activo, con sus roles. null si no tiene perfil en el club. */
  profile?: Schemas['ClubProfileResource'] | null
  /** Permisos en el club activo (`<recurso>.<acción>`). La API los vuelve a validar en cada request. */
  permissions?: string[]
  /** Alcance de cada permiso: `all` (todo el club) u `own` (sus categorías). */
  permissionScopes?: Record<string, string>
}

export type ClubSession = Schemas['MeResource']

/**
 * Valida la sesión contra la API y devuelve el usuario, sus clubes y el club activo (si lo hay).
 * - Si hay token de club activo, consulta `GET /api/me` (que devuelve user y tenant) y `GET /api/me/tenants`.
 * - Si es pre-tenant o plataforma, consulta `GET /api/me/tenants`.
 * Sin cookie redirige al login; un token vencido lo resuelve el cliente (401 → /sesion-expirada).
 * `cache` evita repetir la llamada si layout y página la piden en el mismo request.
 */
export const requireSession = cache(async (): Promise<Session> => {
  const store = await cookies()
  const auth = store.has(SESSION_COOKIE) ? 'session' : store.has(PLATFORM_COOKIE) ? 'platform' : null
  if (!auth) redirect('/login')

  if (auth === 'session') {
    const meResult = await apiFetch<Schemas['MeResource']>('/me', {
      auth: 'session',
      sessionErrors: 'return',
    })

    if (meResult.ok) {
      const tenantsResult = await apiFetch<Schemas['MeTenantsResource']>('/me/tenants', {
        auth: 'session',
        sessionErrors: 'return',
      })

      return {
        user: meResult.data.user,
        tenant: meResult.data.tenant,
        profile: meResult.data.profile,
        permissions: meResult.data.permissions,
        permissionScopes: meResult.data.permission_scopes,
        tenants: tenantsResult.ok ? tenantsResult.data.tenants : [meResult.data.tenant],
      }
    }
  }

  const result = await apiFetch<Schemas['MeTenantsResource']>('/me/tenants', { auth })
  if (!result.ok) throw new Error(result.message)

  return {
    user: result.data.user,
    tenants: result.data.tenants,
  }
})

/**
 * Valida la sesión del club contra `GET /api/me`.
 * Requiere un token atado a un club. Si es pre-tenant o el token no coincide
 * con el club esperado en la URL, redirige a `/clubes`.
 */
export const requireClubSession = cache(async (expectedClub?: string): Promise<ClubSession> => {
  const store = await cookies()
  if (!store.has(SESSION_COOKIE)) redirect('/login')

  const result = await apiFetch<ClubSession>('/me', {
    auth: 'session',
    sessionErrors: 'return',
  })

  if (!result.ok) {
    if (result.status === 401) {
      redirect(SESSION_EXPIRED_PATH)
    }
    // Si no es un token de club válido (403 tenant_required, membership_inactive, etc.)
    redirect('/clubes')
  }

  if (expectedClub && result.data.tenant.slug !== expectedClub) {
    // El [club] de la URL es solo navegación: si no coincide con el de la sesión, a /clubes.
    redirect('/clubes')
  }

  return result.data
})

/** Como `requireSession`, pero un usuario que no es admin de plataforma vuelve a `/clubes`. */
export async function requirePlatformAdmin(): Promise<Session> {
  const session = await requireSession()
  if (!session.user.is_platform_admin) redirect('/clubes')

  return session
}

/** A dónde mandar a alguien que ya tiene sesión y abre el login. No llama a la API. */
export async function landingPath(): Promise<string | null> {
  const store = await cookies()
  if (store.has(PLATFORM_COOKIE)) return '/admin'
  if (store.has(SESSION_COOKIE)) return '/clubes'

  return null
}

/** Indica si el usuario tiene al menos una cookie de sesión o plataforma (sin llamar a la API). */
export async function hasSession(): Promise<boolean> {
  const store = await cookies()
  return store.has(SESSION_COOKIE) || store.has(PLATFORM_COOKIE)
}
