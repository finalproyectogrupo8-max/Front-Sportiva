'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { apiFetch, type Schemas } from '@/lib/api/client'
import { PLATFORM_COOKIE, SESSION_COOKIE } from '@/lib/session-cookies'

// Server Actions de sesión: son las únicas funciones que escriben las cookies.
// La lectura de la sesión (requireSession) está en lib/session.ts.

export type LoginState = {
  error?: string
  fieldErrors?: { email?: string; password?: string }
  email?: string
}

/** Cookie según el contrato (§3.5): solo el token, httpOnly, lax, y vence junto con el token. */
function cookieOptions(expiresAt: string | null | undefined) {
  const maxAge = expiresAt ? Math.max(Math.floor((Date.parse(expiresAt) - Date.now()) / 1000), 0) : undefined

  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }
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

  const { token, expires_at, user, platform_token, platform_expires_at } = result.data
  const store = await cookies()

  store.set(SESSION_COOKIE, token, cookieOptions(expires_at))

  // Solo los admins reciben token de plataforma. Si no vino, se borra el de una sesión anterior.
  if (platform_token) {
    store.set(PLATFORM_COOKIE, platform_token, cookieOptions(platform_expires_at))
  } else {
    store.delete(PLATFORM_COOKIE)
  }

  redirect(user?.is_platform_admin ? '/admin' : '/clubes')
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
