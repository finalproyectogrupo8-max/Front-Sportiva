import type { Tone } from '@/components/club/shared'
import { CLUB_TZ } from '@/lib/club-time'

// Tipos y formatos del módulo Análisis (FRO-20). Los datos los calcula la API (TIZ-20).

export type Rate = { recorded: number; present: number; rate: number | null }
export type ByStatus = { present: number; late: number; excused: number; absent: number }
export type Results = { played: number; won: number; drawn: number; lost: number; goals_for: number; goals_against: number; form: ('W' | 'D' | 'L')[] }

export type CategoryStats = {
  category_id: number
  category_name: string
  players: number
  attendance: Rate
  sessions: number
  results: Results
  evaluations: number
}
export type CategoryDetail = Omit<CategoryStats, 'results'> & {
  results: Results
  by_status: ByStatus
  weekly: (Rate & { week_start: string })[]
  matches: { id: number; date: string; opponent: string; is_home: boolean; our_score: number; opponent_score: number; result: 'W' | 'D' | 'L' }[]
}
export type PlayerStats = {
  player_id: number
  player_name: string
  attendance: Rate
  by_status: ByStatus
  absent_streak: number
  evaluations: number
  last_evaluated_at: string | null
}
export type Measurement = { metric_key: string; metric_name: string; numeric_value: number | null; unit: string | null; text_value: string | null }
export type Evaluation = {
  id: number
  player_id: number
  player_name?: string
  evaluator_coach_id: number | null
  evaluator_name?: string | null
  evaluated_at: string
  summary: string | null
  recommendations: string | null
  measurements?: Measurement[]
}
export type Named = { id: number; name: string }
export type Can = { create: boolean; update: boolean; delete: boolean }

export const PERIODS = [
  { value: '30', label: '30 días' },
  { value: '90', label: '3 meses' },
  { value: '180', label: '6 meses' },
] as const

export const RESULT: Record<'W' | 'D' | 'L', { short: string; label: string; tone: Tone }> = {
  W: { short: 'G', label: 'Ganado', tone: 'ok' },
  D: { short: 'E', label: 'Empatado', tone: 'neutral' },
  L: { short: 'P', label: 'Perdido', tone: 'bad' },
}

/** Estados de asistencia, en el orden en que se leen. Usan los colores de estado de la app. */
export const STATUS = [
  { key: 'present', label: 'Presente', color: 'var(--success)' },
  { key: 'late', label: 'Tarde', color: 'var(--warning)' },
  { key: 'excused', label: 'Faltó con aviso', color: 'var(--muted-foreground)' },
  { key: 'absent', label: 'Faltó sin aviso', color: 'var(--destructive)' },
] as const

export const rateTone = (rate: number | null): Tone => (rate === null ? 'neutral' : rate >= 80 ? 'ok' : rate >= 60 ? 'warn' : 'bad')

/** Jugadores a mirar: faltan seguido o asisten poco (con al menos 3 registros). */
export const needsAttention = (p: PlayerStats) => p.absent_streak >= 2 || (p.attendance.recorded >= 3 && (p.attendance.rate ?? 100) < 60)

export const shortDate = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { timeZone: CLUB_TZ, day: 'numeric', month: 'short' })
export const longDate = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { timeZone: CLUB_TZ, day: 'numeric', month: 'long', year: 'numeric' })

/** Código estable de la prueba a partir del nombre: "Velocidad 30 m" → "velocidad_30_m". */
export const metricKey = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80)
