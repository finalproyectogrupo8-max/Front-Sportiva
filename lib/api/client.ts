import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PLATFORM_COOKIE, SESSION_COOKIE, SESSION_EXPIRED_PATH } from '@/lib/session-cookies'
import type { components } from './schema'

// Cliente de la API de Laravel. Solo corre en el servidor de Next.js (patrón BFF):
// el browser nunca ve el token ni la URL de la API. No importar desde client components.
// Contrato de errores: docs/integracion-api-laravel.md §3.6 y §5.4.

/** Schemas del contrato OpenAPI (generados con `pnpm api:types`). */
export type Schemas = components['schemas']

/**
 * Qué token manda el request:
 * - `session`: pre-tenant o de club (cookie SESSION_COOKIE).
 * - `platform`: token de plataforma de los admins (cookie PLATFORM_COOKIE).
 * - `none`: sin token (login, health).
 */
export type ApiAuth = 'session' | 'platform' | 'none'

export type ApiFailure =
  | { ok: false; kind: 'unauthorized'; status: 401; message: string }
  | { ok: false; kind: 'forbidden'; status: 403; message: string }
  | { ok: false; kind: 'validation'; status: 422; message: string; errors: Record<string, string[]> }
  | { ok: false; kind: 'rate_limited'; status: 429; message: string; retryAfter: number | null }
  | { ok: false; kind: 'error'; status: number; message: string; code?: string }

export type ApiResult<T> = { ok: true; status: number; data: T } | ApiFailure

export type ApiRequest = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  auth?: ApiAuth
  /**
   * `redirect` (por defecto): un 401 borra la sesión y manda a `/`, y un 403 de club manda a `/clubes`.
   * `return`: devuelve el error sin redirigir (lo usan el login y el logout).
   */
  sessionErrors?: 'redirect' | 'return'
}

// 403 que significan "no estás dentro de un club válido": se vuelve al selector.
const TENANT_CODES = new Set(['tenant_required', 'membership_inactive', 'tenant_inactive'])

const COOKIE_BY_AUTH = { session: SESSION_COOKIE, platform: PLATFORM_COOKIE } as const

function buildUrl(path: string, query: ApiRequest['query']): string {
  const base = process.env.API_URL
  if (!base) {
    throw new Error('Falta la variable API_URL (ver .env.example).')
  }

  const url = new URL(base.replace(/\/+$/, '') + path)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue
    // La regla `boolean` de Laravel acepta 1/0 en la query, no "true"/"false".
    url.searchParams.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value))
  }
  return url.toString()
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

/**
 * Llama a la API de Laravel. `path` es relativo a `API_URL`, igual que en el contrato
 * (por ejemplo `/auth/login`, `/admin/users`).
 *
 * Errores de sesión (401 y 403 de club) redirigen; el resto vuelve como `ApiFailure`
 * para que la pantalla decida qué mostrar. Si la API no responde, lanza un Error.
 */
export async function apiFetch<T>(path: string, request: ApiRequest = {}): Promise<ApiResult<T>> {
  const { method = 'GET', body, query, auth = 'session', sessionErrors = 'redirect' } = request
  const redirectOnSessionErrors = auth !== 'none' && sessionErrors === 'redirect'

  // FormData (archivos) va como multipart: el boundary del Content-Type lo pone fetch.
  const isForm = body instanceof FormData
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'

  if (auth !== 'none') {
    const token = (await cookies()).get(COOKIE_BY_AUTH[auth])?.value
    if (!token) {
      if (redirectOnSessionErrors) redirect(SESSION_EXPIRED_PATH)
      return { ok: false, kind: 'unauthorized', status: 401, message: 'No hay sesión.' }
    }
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      // Nada que dependa del usuario se cachea entre usuarios.
      cache: 'no-store',
    })
  } catch (cause) {
    throw new Error('No se pudo conectar con la API.', { cause })
  }

  if (response.status === 204) {
    return { ok: true, status: 204, data: undefined as T }
  }

  if (response.ok) {
    return { ok: true, status: response.status, data: (await response.json()) as T }
  }

  const payload = await readJson(response)
  const message = typeof payload.message === 'string' ? payload.message : 'Error inesperado de la API.'
  const code = typeof payload.code === 'string' ? payload.code : undefined

  // redirect() corta la ejecución lanzando una excepción: tiene que quedar fuera de cualquier try/catch.
  if (response.status === 401) {
    if (redirectOnSessionErrors) redirect(SESSION_EXPIRED_PATH)
    return { ok: false, kind: 'unauthorized', status: 401, message }
  }

  if (response.status === 403) {
    if (code && TENANT_CODES.has(code)) {
      if (redirectOnSessionErrors) redirect('/clubes')
      return { ok: false, kind: 'error', status: 403, message, code }
    }
    return { ok: false, kind: 'forbidden', status: 403, message }
  }

  if (response.status === 422) {
    const errors = (payload.errors ?? {}) as Record<string, string[]>
    return { ok: false, kind: 'validation', status: 422, message, errors }
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After'))
    return {
      ok: false,
      kind: 'rate_limited',
      status: 429,
      message,
      retryAfter: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
    }
  }

  return { ok: false, kind: 'error', status: response.status, message, code }
}

/**
 * Pide un archivo a la API y devuelve la respuesta tal cual, para reenviarla al navegador. Por
 * defecto con el token del club (fotos y documentos); `auth: 'none'` para los públicos (el .ics de
 * la convocatoria). null si hace falta sesión y no hay, o si la API no responde.
 */
export async function apiFetchFile(path: string, { auth = 'session' }: { auth?: 'session' | 'none' } = {}): Promise<Response | null> {
  const token = auth === 'session' ? (await cookies()).get(SESSION_COOKIE)?.value : null
  if (auth === 'session' && !token) return null
  try {
    return await fetch(buildUrl(path, undefined), {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), Accept: '*/*' },
      cache: 'no-store',
    })
  } catch {
    return null
  }
}
