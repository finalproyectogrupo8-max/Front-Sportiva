import 'server-only'

import { apiFetch } from './client'

export type Health = { status: string; checks: Record<string, string> }

/** `GET /api/health`: no necesita token. Sirve para verificar que el front llega a la API. */
export function getHealth() {
  return apiFetch<Health>('/health', { auth: 'none' })
}
