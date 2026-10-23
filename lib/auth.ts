'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { apiFetch, type Schemas } from '@/lib/api/client'
import { cookieOptions, PLATFORM_COOKIE, SESSION_COOKIE } from '@/lib/session-cookies'

// Server Actions de sesión: son las únicas funciones que escriben las cookies.
// La lectura de la sesión (requireSession) está en lib/session.ts.

export type LoginState = {
  error?: string
  fieldErrors?: { email?: string; password?: string }
  email?: string
}

export type SelectTenantState = {
  error?: string
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  let result
  try {
    result = await apiFetch<Schemas['LoginResource']>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: 'none',
    })
  } catch {
    return { error: 'No pudimos conectar con el servidor. Probá de nuevo en unos minutos.', email }
  }

  if (!result.ok) {
    switch (result.kind) {
      case 'unauthorized':
        // Mismo mensaje para email inexistente y contraseña incorrecta.
        return { error: 'Credenciales inválidas.', email }
      case 'rate_limited':
        return {
          error: result.retryAfter
            ? `Demasiados intentos. Probá de nuevo en ${result.retryAfter} segundos.`
            : 'Demasiados intentos. Probá de nuevo en un minuto.',
          email,
        }
      case 'validation':
        return {
          fieldErrors: { email: result.errors.email?.[0], password: result.errors.password?.[0] },
          email,
        }
      default:
        return { error: 'No pudimos iniciar sesión. Probá de nuevo en unos minutos.', email }
    }
  }

  const { token, expires_at, user, platform_token, platform_expires_at, tenants } = result.data
  const store = await cookies()

  store.set(SESSION_COOKIE, token, cookieOptions(expires_at))

  // Solo los admins reciben token de plataforma. Si no vino, se borra el de una sesión anterior.
  if (platform_token) {
    store.set(PLATFORM_COOKIE, platform_token, cookieOptions(platform_expires_at))
  } else {
    store.delete(PLATFORM_COOKIE)
  }

  if (user?.is_platform_admin) {
    redirect('/admin')
  }

  // Si tiene un solo club, entra directo a /c/<slug> sin ver el selector (§3.1 paso 4).
  if (tenants && tenants.length === 1) {
    const res = await selectTenant(tenants[0].slug)
    if (res?.error) {
      redirect(`/clubes?error=${encodeURIComponent(res.error)}`)
    }
  }

  redirect('/clubes')
}

/**
 * Revalida la membresía y cambia el token actual por uno atado al club.
 * Reemplaza la cookie de sesión con el token del club y redirige a /c/<slug>.
 */
export async function selectTenant(
  slugOrState: string | SelectTenantState,
  formData?: FormData,
): Promise<SelectTenantState> {
  const slug =
    typeof slugOrState === 'string'
      ? slugOrState
      : String(formData?.get('slug') ?? formData?.get('tenant') ?? '').trim()

  if (!slug) {
    return { error: 'Club inválido.' }
  }

  let result
  try {
    result = await apiFetch<Schemas['SelectTenantResource']>('/auth/select-tenant', {
      method: 'POST',
      body: { tenant: slug },
      auth: 'session',
      sessionErrors: 'return',
    })
  } catch {
    return { error: 'No pudimos conectar con el servidor. Probá de nuevo en unos minutos.' }
  }

  if (!result.ok) {
    if (result.status === 401) {
      const store = await cookies()
      store.delete(SESSION_COOKIE)
      store.delete(PLATFORM_COOKIE)
      redirect('/')
    }

    if (result.status === 403) {
      const code = 'code' in result ? result.code : undefined
      if (code === 'membership_inactive') {
        return { error: 'No tenés acceso a este club.' }
      }
      if (code === 'tenant_inactive') {
        return { error: 'El club no está activo.' }
      }
      return { error: 'No tenés acceso a este club.' }
    }

    return { error: 'No pudimos seleccionar el club. Probá de nuevo en unos minutos.' }
  }

  const { token, expires_at } = result.data
  const store = await cookies()
  store.set(SESSION_COOKIE, token, cookieOptions(expires_at))

  redirect(`/c/${slug}`)
}

/** Revoca los tokens en la API y borra las cookies, aunque la API falle. */
export async function logout() {
  const store = await cookies()

  for (const [auth, name] of [
    ['session', SESSION_COOKIE],
    ['platform', PLATFORM_COOKIE],
  ] as const) {
    if (!store.has(name)) continue

    try {
      await apiFetch('/auth/logout', { method: 'POST', auth, sessionErrors: 'return' })
    } catch {
      // Si la API no responde, igual se cierra la sesión del lado del front.
    }
    store.delete(name)
  }

  redirect('/')
}
