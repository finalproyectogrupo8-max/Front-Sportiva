import 'server-only'

import { apiFetch, type ApiResult } from './client'

// Equipo del club (FRO-14 / TIZ-34): el administrador suma gente, cambia sus roles o les quita el acceso.

export type TeamMember = {
  id: number
  display_name: string
  email: string | null
  status: 'active' | 'disabled'
  roles: { slug: string; name: string }[]
  sport_ids: number[]
  is_self: boolean
  created_at: string | null
}
export type TeamRole = { slug: string; name: string; description: string | null; is_system: boolean }
export type InviteInput = { email: string; name: string | null; roles: string[]; sport_ids?: number[] }
export type MemberUpdate = { roles?: string[]; sport_ids?: number[]; status?: 'active' | 'disabled' }

export function listTeam(): Promise<ApiResult<{ data: TeamMember[] }>> {
  return apiFetch('/club-users', { query: { team: 1 } })
}
export function listTeamRoles(): Promise<ApiResult<{ data: TeamRole[] }>> {
  return apiFetch('/roles', { query: { per_page: 100 } })
}
export function inviteMember(input: InviteInput): Promise<ApiResult<{ data: TeamMember; meta: { invited: boolean } }>> {
  return apiFetch('/club-users', { method: 'POST', body: input })
}
export function updateMember(id: number, input: MemberUpdate): Promise<ApiResult<{ data: TeamMember }>> {
  return apiFetch(`/club-users/${id}`, { method: 'PATCH', body: input })
}
