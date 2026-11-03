import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'

// Proyecto (FRO-20): objetivos de la temporada y tabla de posiciones cargada a mano (TIZ-20).

export type Objective = Schemas['SeasonObjectiveResource']
export type StandingRow = {
  id: number
  category_id: number
  position: number
  team_name: string
  is_own: boolean
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  points: number
}
export type StandingInput = Omit<StandingRow, 'id' | 'category_id' | 'position'>

export type ObjectiveInput = {
  season_id: number
  category_id: number | null
  title: string
  description: string | null
  target_value: number | null
  current_value: number | null
  unit: string | null
  status: string
  due_date: string | null
}

type One<T> = { data: T }
type List<T> = { data: T[] }

export function listObjectives(query: { season_id?: number } = {}): Promise<ApiResult<List<Objective>>> {
  return apiFetch('/season-objectives', { query })
}
export function createObjective(input: ObjectiveInput): Promise<ApiResult<One<Objective>>> {
  return apiFetch('/season-objectives', { method: 'POST', body: input })
}
export function updateObjective(id: number, input: Partial<ObjectiveInput>): Promise<ApiResult<One<Objective>>> {
  return apiFetch(`/season-objectives/${id}`, { method: 'PATCH', body: input })
}
export function deleteObjective(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/season-objectives/${id}`, { method: 'DELETE' })
}

export function listStandings(competitionId: number): Promise<ApiResult<List<StandingRow>>> {
  return apiFetch(`/competitions/${competitionId}/standings`)
}
export function saveStandings(competitionId: number, categoryId: number, rows: StandingInput[]): Promise<ApiResult<List<StandingRow>>> {
  return apiFetch(`/competitions/${competitionId}/standings`, { method: 'PUT', body: { category_id: categoryId, rows } })
}
