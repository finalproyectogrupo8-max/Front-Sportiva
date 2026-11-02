import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'

// Análisis (FRO-20): indicadores calculados por la API y evaluaciones físicas (TIZ-20).

export type Evaluation = Schemas['PhysicalEvaluationResource']
export type Measurement = { metric_key: string; metric_name: string; numeric_value: number | null; unit: string | null; text_value: string | null; notes: string | null }

export type Rate = { recorded: number; present: number; rate: number | null }
export type CategoryStats = {
  category_id: number
  category_name: string
  players: number
  attendance: Rate
  sessions: number
  results: { played: number; won: number; drawn: number; lost: number; goals_for: number; goals_against: number; form: ('W' | 'D' | 'L')[] }
  evaluations: number
}
export type PlayerStats = {
  player_id: number
  player_name: string
  attendance: Rate
  by_status: { present: number; late: number; excused: number; absent: number }
  absent_streak: number
  evaluations: number
  last_evaluated_at: string | null
}
export type CategoryDetail = {
  category_id: number
  category_name: string
  players: number
  attendance: Rate
  sessions: number
  by_status: { present: number; late: number; excused: number; absent: number }
  weekly: (Rate & { week_start: string })[]
  results: CategoryStats['results']
  matches: { id: number; date: string; opponent: string; is_home: boolean; our_score: number; opponent_score: number; result: 'W' | 'D' | 'L' }[]
  evaluations: number
}
type Period = { from: string; to: string }
type WithPeriod<T> = { data: T[]; meta: Period }
type Page<T> = { data: T[]; meta: { total: number; current_page: number; last_page: number } }
type One<T> = { data: T }

export type EvaluationInput = {
  player_id: number
  evaluator_coach_id: number | null
  evaluated_at: string
  summary: string | null
  recommendations: string | null
  measurements: Omit<Measurement, 'notes'>[]
}

export function categoryStats(period: Period): Promise<ApiResult<WithPeriod<CategoryStats>>> {
  return apiFetch('/analytics/categories', { query: period })
}
export function categoryDetail(categoryId: number, period: Period): Promise<ApiResult<{ data: CategoryDetail; meta: Period }>> {
  return apiFetch(`/analytics/categories/${categoryId}`, { query: period })
}
export function playerStats(categoryId: number, period: Period): Promise<ApiResult<WithPeriod<PlayerStats>>> {
  return apiFetch(`/analytics/categories/${categoryId}/players`, { query: period })
}

export function listEvaluations(query: { category_id?: number; player_id?: number; per_page?: number }): Promise<ApiResult<Page<Evaluation>>> {
  return apiFetch('/physical-evaluations', { query: { per_page: 100, sort: '-evaluated_at', ...query } })
}
export function createEvaluation(input: EvaluationInput): Promise<ApiResult<One<Evaluation>>> {
  return apiFetch('/physical-evaluations', { method: 'POST', body: input })
}
export function updateEvaluation(id: number, input: Partial<EvaluationInput>): Promise<ApiResult<One<Evaluation>>> {
  return apiFetch(`/physical-evaluations/${id}`, { method: 'PATCH', body: input })
}
export function deleteEvaluation(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/physical-evaluations/${id}`, { method: 'DELETE' })
}
