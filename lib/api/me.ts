import 'server-only'

import { cookies } from 'next/headers'
import { PLATFORM_COOKIE, SESSION_COOKIE } from '@/lib/session-cookies'
import { apiFetch, type ApiAuth, type ApiResult, type Schemas } from './client'

// Mi perfil (FRO-28). Sirve con el token del club, el previo al club o el de plataforma.

export type MyClub = Schemas['TenantSummaryResource'] & { roles: string[] }

async function auth(): Promise<ApiAuth> {
  const store = await cookies()
  return store.has(SESSION_COOKIE) ? 'session' : store.has(PLATFORM_COOKIE) ? 'platform' : 'session'
}

export async function myClubs(): Promise<ApiResult<{ data: MyClub[] }>> {
  return apiFetch('/me/clubs', { auth: await auth() })
}
export async function updateMyName(name: string): Promise<ApiResult<{ data: { name: string } }>> {
  return apiFetch('/me', { method: 'PATCH', body: { name }, auth: await auth() })
}
export async function changeMyPassword(input: { current_password: string; password: string; password_confirmation: string }): Promise<ApiResult<{ data: { closed_sessions: number } }>> {
  return apiFetch('/me/password', { method: 'PUT', body: input, auth: await auth() })
}
export async function logoutOtherSessions(): Promise<ApiResult<{ data: { closed_sessions: number } }>> {
  return apiFetch('/me/logout-all', { method: 'POST', auth: await auth() })
}
