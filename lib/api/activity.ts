import 'server-only'

import { apiFetch, type ApiResult } from './client'

// Registro de actividad (FRO-30). Dos registros distintos:
// - plataforma: altas y cambios de clubes, usuarios, membresías y documentos.
// - club: pedidos, jugadores, equipo y comunicados, visible con `audit.view`.

/* ==========================================================================
   PLATAFORMA
   ========================================================================== */

export type PlatformActivitySubjectType = 'tenant' | 'user' | 'membership' | 'document' | 'auth'

/**
 * Un cambio de campo. La API manda `{from, to}` cuando el valor cambió, `{changed: true}` para
 * eventos sin antes/después (por ejemplo una contraseña) y un escalar en los documentos.
 */
export type ActivityChangeValue =
  | { from?: unknown; to?: unknown; changed?: boolean }
  | string
  | number
  | boolean
  | null

export type ActivityChanges = Record<string, ActivityChangeValue>

export type PlatformActivityActor = {
  id: number
  name: string
  email: string
}

export type PlatformActivityEvent = {
  id: number
  action: string
  subject_type: PlatformActivitySubjectType | string
  subject_id: number
  subject_label: string | null
  actor: PlatformActivityActor | null
  changes: ActivityChanges | null
  created_at: string
}

export type PlatformActivityMeta = {
  total: number
  current_page: number
  last_page: number
  from: number | null
  to: number | null
}

export type PlatformActivityResponse = {
  data: PlatformActivityEvent[]
  meta: PlatformActivityMeta
}

export type PlatformActivityQuery = {
  subject_type?: PlatformActivitySubjectType
  actor_id?: number
  from?: string
  to?: string
  per_page?: number
  page?: number
}

/**
 * `GET /admin/audit-logs`
 * Listado paginado de la actividad de la plataforma, con el token de plataforma.
 */
export function listPlatformActivity(
  query: PlatformActivityQuery = {},
): Promise<ApiResult<PlatformActivityResponse>> {
  return apiFetch<PlatformActivityResponse>('/admin/audit-logs', {
    method: 'GET',
    auth: 'platform',
    query: query as Record<string, string | number | boolean | undefined | null>,
  })
}

/* ==========================================================================
   CLUB
   ========================================================================== */

export type ClubActivityType = 'order' | 'player' | 'club_user' | 'announcement'

export type ClubActivityActor = {
  id: number
  name: string
}

export type ClubActivityEvent = {
  id: number
  action: string
  entity_type: string
  entity_id: number | null
  actor: ClubActivityActor | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export type ClubActivityMeta = {
  total: number
  current_page: number
  last_page: number
}

export type ClubActivityResponse = {
  data: ClubActivityEvent[]
  meta: ClubActivityMeta
}

export type ClubActivityQuery = {
  type?: ClubActivityType
  club_user_id?: number
  from?: string
  to?: string
  per_page?: number
  page?: number
}

/**
 * `GET /audit-logs`
 * Actividad del club, paginada. La API exige el permiso `audit.view`.
 */
export function listClubActivity(
  query: ClubActivityQuery = {},
): Promise<ApiResult<ClubActivityResponse>> {
  return apiFetch<ClubActivityResponse>('/audit-logs', {
    method: 'GET',
    query: query as Record<string, string | number | boolean | undefined | null>,
  })
}
