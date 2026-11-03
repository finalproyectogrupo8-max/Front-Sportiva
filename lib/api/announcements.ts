import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'

// Comunicados por mail (FRO-23 / TIZ-24): borradores, vista previa de la audiencia, envío e historial.

export type Announcement = Omit<Schemas['AnnouncementResource'], 'audience'> & { audience: Audience }
export type AnnouncementRecipient = Schemas['AnnouncementRecipientResource']

export type Audience = {
  categories?: { category_id: number; players?: boolean; tutors?: boolean; coaches?: boolean }[]
  players?: { player_ids: number[]; players?: boolean; tutors?: boolean }
  role_slugs?: string[]
  club_user_ids?: number[]
}
export type AnnouncementInput = { subject: string; body: string; audience: Audience }
export type AudiencePreview = { recipients_count: number; without_email_count: number; without_email: string[]; sample: string[] }
export type RoleOption = { slug: string; name: string }

type One<T> = { data: T }
type Page<T> = { data: T[]; meta: { total: number; current_page: number; last_page: number } }

export function listAnnouncements(): Promise<ApiResult<Page<Announcement>>> {
  return apiFetch('/announcements', { query: { per_page: 50 } })
}
export function getAnnouncement(id: number): Promise<ApiResult<One<Announcement>>> {
  return apiFetch(`/announcements/${id}`)
}
export function createAnnouncement(input: AnnouncementInput): Promise<ApiResult<One<Announcement>>> {
  return apiFetch('/announcements', { method: 'POST', body: input })
}
export function updateAnnouncement(id: number, input: AnnouncementInput): Promise<ApiResult<One<Announcement>>> {
  return apiFetch(`/announcements/${id}`, { method: 'PATCH', body: input })
}
export function deleteAnnouncement(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/announcements/${id}`, { method: 'DELETE' })
}
export function previewAudience(audience: Audience): Promise<ApiResult<One<AudiencePreview>>> {
  return apiFetch('/announcements/preview-audience', { method: 'POST', body: { audience } })
}
export function sendAnnouncement(id: number): Promise<ApiResult<One<Announcement>>> {
  return apiFetch(`/announcements/${id}/send`, { method: 'POST' })
}
export function listRecipients(id: number): Promise<ApiResult<Page<AnnouncementRecipient>>> {
  return apiFetch(`/announcements/${id}/recipients`, { query: { per_page: 100 } })
}

/** Roles del club, para escribirle al staff. Solo los ve quien tiene `roles.view`. */
export function listRoles(): Promise<ApiResult<{ data: RoleOption[] }>> {
  return apiFetch('/roles', { query: { per_page: 100 } })
}
