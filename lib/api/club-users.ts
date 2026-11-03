import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'
import type { ClubRole } from './admin'

export type ClubTeamUser = {
  id: number
  display_name: string
  email: string | null
  status: 'active' | 'disabled' | 'invited'
  roles: Pick<ClubRole, 'slug' | 'name'>[]
  sport_ids: number[]
  is_self: boolean
  created_at: string | null
}

export type ClubTeamUsers = { data: ClubTeamUser[] }
export type CreateClubTeamUserData = Schemas['StoreClubUserRequest']

/** `GET /club-users?team=1` devuelve el equipo completo del club actual. */
export function getClubTeamUsers(): Promise<ApiResult<ClubTeamUsers>> {
  return apiFetch<ClubTeamUsers>('/club-users', {
    auth: 'session',
    query: { team: 1 },
  })
}

/** `GET /roles` devuelve los roles que el usuario puede consultar en el club actual. */
export function getClubRoles(): Promise<ApiResult<{ data: ClubRole[] }>> {
  return apiFetch<{ data: ClubRole[] }>('/roles', { auth: 'session' })
}

/** `POST /club-users` invita o habilita a una persona y le asigna roles. */
export function createClubTeamUser(
  data: CreateClubTeamUserData,
): Promise<ApiResult<{ data: ClubTeamUser; meta: { invited: boolean } }>> {
  return apiFetch<{ data: ClubTeamUser; meta: { invited: boolean } }>('/club-users', {
    method: 'POST',
    auth: 'session',
    body: data,
  })
}

/** `POST /club-users/{id}/resend-invite` */
export function resendClubTeamInvite(userId: number): Promise<ApiResult<{ message: string }>> {
  return apiFetch<{ message: string }>(`/club-users/${userId}/resend-invite`, {
    method: 'POST',
    auth: 'session',
  })
}
