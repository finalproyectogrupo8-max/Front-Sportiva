import 'server-only'

import { apiFetch, type ApiResult } from './client'

// Páginas públicas de la convocatoria (FRO-36): sin login. La API muestra lo mínimo: de los
// convocados, nombre e inicial del apellido.

export type PublicCallupPage = {
  club: { name: string; short_name: string | null; primary_color: string | null; logo_url: string | null }
  match: {
    category: string
    competition: string | null
    opponent: string
    is_home: boolean
    match_date: string
    meet_at: string | null
    venue: string | null
    maps_url: string | null
    uniform: 'home' | 'away' | null
    uniform_color: string | null
    what_to_bring: string | null
    status: 'scheduled' | 'played' | 'postponed' | 'cancelled'
    /** Cambió la fecha, la hora o el lugar después de publicar. */
    updated: boolean
  }
  players: { name: string; shirt_number: number | null }[]
}

export type CallupAnswer = 'going' | 'not_going'
export type PublicMe = { name: string; response: 'pending' | CallupAnswer; note: string | null }
export type PersonalCallup = { page: PublicCallupPage; me: PublicMe }

const NO_SESSION = { auth: 'none', sessionErrors: 'return' } as const

export function getPublicCallup(token: string): Promise<ApiResult<{ data: PublicCallupPage }>> {
  return apiFetch(`/public/callups/${encodeURIComponent(token)}`, NO_SESSION)
}

export function getPersonalCallup(token: string): Promise<ApiResult<{ data: PersonalCallup }>> {
  return apiFetch(`/public/callups/respond/${encodeURIComponent(token)}`, NO_SESSION)
}

export function respondCallup(token: string, response: CallupAnswer, note: string | null): Promise<ApiResult<{ data: PersonalCallup }>> {
  return apiFetch(`/public/callups/respond/${encodeURIComponent(token)}`, { ...NO_SESSION, method: 'POST', body: { response, note } })
}
