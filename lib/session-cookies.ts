// Nombres de las cookies de sesión. Están en un archivo aparte, sin 'server-only',
// porque también los lee proxy.ts.

/** Token pre-tenant (después del login) o token del club (después de elegirlo). */
export const SESSION_COOKIE = 'sportiva_session'

/** Token de plataforma: solo lo tienen los admins y sirve únicamente para /api/admin/*. */
export const PLATFORM_COOKIE = 'sportiva_platform'

/** Route Handler que borra las cookies cuando la API responde 401. */
export const SESSION_EXPIRED_PATH = '/sesion-expirada'

/** Cookie según el contrato (§3.5): solo el token, httpOnly, lax, y vence junto con el token. */
export function cookieOptions(expiresAt: string | null | undefined) {
  const maxAge = expiresAt ? Math.max(Math.floor((Date.parse(expiresAt) - Date.now()) / 1000), 0) : undefined

  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }
}
