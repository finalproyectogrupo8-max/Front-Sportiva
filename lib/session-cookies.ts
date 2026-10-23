// Nombres de las cookies de sesión. Están en un archivo aparte, sin 'server-only',
// porque también los lee proxy.ts.

/** Token pre-tenant (después del login) o token del club (después de elegirlo). */
export const SESSION_COOKIE = 'sportiva_session'

/** Token de plataforma: solo lo tienen los admins y sirve únicamente para /api/admin/*. */
export const PLATFORM_COOKIE = 'sportiva_platform'

/** Route Handler que borra las cookies cuando la API responde 401. */
export const SESSION_EXPIRED_PATH = '/sesion-expirada'
