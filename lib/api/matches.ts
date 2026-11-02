import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'

// Partidos, entrenamientos, calendario y asistencia (FRO-18). Token del club activo; el profe
// solo ve y carga lo de sus categorías (la API aplica el alcance).

export type Match = Schemas['MatchResource']
export type Training = Schemas['TrainingResource']
export type CalendarEvent = Schemas['CalendarEventResource']
export type MatchStatus = 'scheduled' | 'played' | 'postponed' | 'cancelled'
export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late'

export type AttendanceRow = {
  player_id: number
  player_name: string
  shirt_number: number | null
  /** Documento con la foto del jugador (null si no tiene). */
  photo_document_id?: number | null
  /** null: todavía no se tomó. */
  status: AttendanceStatus | null
  notes: string | null
}

export type MatchInput = {
  category_id: number
  competition_id: number | null
  opponent: string
  match_date: string
  meet_at: string | null
  /** Sede del club (de local): la API completa `venue` y `maps_url`. */
  venue_id: number | null
  venue: string | null
  maps_url: string | null
  is_home: boolean
  uniform: 'home' | 'away' | null
  uniform_color: string | null
  what_to_bring: string | null
  notes: string | null
}

export type TrainingInput = {
  category_id: number
  coach_id?: number | null
  starts_at: string
  ends_at: string
  location: string | null
  objectives: string | null
  notes: string | null
}

type One<T> = { data: T }
type List<T> = { data: T[] }

/** Partidos y entrenamientos entre dos días (hasta 62 días por consulta). */
export function calendar(query: { from: string; to: string; category_id?: number }): Promise<ApiResult<List<CalendarEvent>>> {
  return apiFetch('/calendar', { query })
}

export function getMatch(id: number): Promise<ApiResult<One<Match>>> {
  return apiFetch(`/matches/${id}`)
}

export function createMatch(input: MatchInput): Promise<ApiResult<One<Match>>> {
  return apiFetch('/matches', { method: 'POST', body: input })
}

export function updateMatch(
  id: number,
  input: Partial<MatchInput> & { our_score?: number | null; opponent_score?: number | null; status?: MatchStatus },
): Promise<ApiResult<One<Match>>> {
  return apiFetch(`/matches/${id}`, { method: 'PATCH', body: input })
}

export function deleteMatch(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/matches/${id}`, { method: 'DELETE' })
}

export function getTraining(id: number): Promise<ApiResult<One<Training>>> {
  return apiFetch(`/trainings/${id}`)
}

export function createTraining(input: TrainingInput): Promise<ApiResult<One<Training>>> {
  return apiFetch('/trainings', { method: 'POST', body: input })
}

export function updateTraining(id: number, input: Partial<TrainingInput>): Promise<ApiResult<One<Training>>> {
  return apiFetch(`/trainings/${id}`, { method: 'PATCH', body: input })
}

export function deleteTraining(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/trainings/${id}`, { method: 'DELETE' })
}

type EventKind = 'matches' | 'trainings'

/** Lista de la categoría con lo que ya se cargó (jugadores activos y los que tienen registro). */
export function getAttendance(kind: EventKind, id: number): Promise<ApiResult<List<AttendanceRow>>> {
  return apiFetch(`/${kind}/${id}/attendance`)
}

export function recordAttendance(
  kind: EventKind,
  id: number,
  records: { player_id: number; status: AttendanceStatus; notes?: string | null }[],
): Promise<ApiResult<List<AttendanceRow>>> {
  return apiFetch(`/${kind}/${id}/attendance`, { method: 'PUT', body: { records } })
}

// Convocatoria (FRO-35): el profe elige entre los habilitados, publica y comparte por WhatsApp.

export type CallupSheet = Schemas['CallupSheetResource']
export type CallupRow = Schemas['CallupRowResource']
export type SquadOption = Schemas['SquadOptionResource']
export type CallupResponse = 'pending' | 'going' | 'not_going'

export function getCallup(matchId: number): Promise<ApiResult<One<CallupSheet>>> {
  return apiFetch(`/matches/${matchId}/callup`)
}

/** Reemplaza la lista de convocados. Sin número, la API usa el del plantel. */
export function updateCallup(
  matchId: number,
  players: { player_id: number; shirt_number: number | null }[],
): Promise<ApiResult<One<CallupSheet>>> {
  return apiFetch(`/matches/${matchId}/callup`, { method: 'PUT', body: { players } })
}

/** Publica (o vuelve a publicar después de un cambio): genera la página pública y los mensajes. */
export function publishCallup(matchId: number): Promise<ApiResult<One<CallupSheet>>> {
  return apiFetch(`/matches/${matchId}/callup/publish`, { method: 'POST' })
}
