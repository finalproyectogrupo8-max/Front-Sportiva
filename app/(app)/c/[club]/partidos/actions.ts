'use server'

import { failure, optionalInt, revalidateClub, runApiAction, runCall, text, type ActionResult } from '@/lib/action-result'
import {
  createMatch,
  createTraining,
  deleteMatch,
  deleteTraining,
  publishCallup,
  recordAttendance,
  updateCallup,
  updateMatch,
  updateTraining,
  type AttendanceStatus,
  type MatchInput,
  type MatchStatus,
  type TrainingInput,
} from '@/lib/api/matches'
import { toApiDateTime } from '@/lib/club-time'

// Partidos, entrenamientos y asistencia (FRO-18). La API valida permisos y alcance.

const MATCH_FIELDS = [
  'venue_id',
  'category_id',
  'competition_id',
  'opponent',
  'match_date',
  'meet_at',
  'venue',
  'maps_url',
  'is_home',
  'uniform',
  'uniform_color',
  'what_to_bring',
  'notes',
]
const TRAINING_FIELDS = ['category_id', 'starts_at', 'ends_at', 'location', 'objectives', 'notes']
const STATUSES: MatchStatus[] = ['scheduled', 'played', 'postponed', 'cancelled']
const ATTENDANCE: AttendanceStatus[] = ['present', 'absent', 'excused', 'late']

export async function saveMatchAction(id: number | null, formData: FormData): Promise<ActionResult> {
  const uniform = text(formData, 'uniform')
  const matchDate = text(formData, 'match_date')
  const meetAt = text(formData, 'meet_at')
  const mapsUrl = text(formData, 'maps_url')
  const input: MatchInput = {
    category_id: Number(text(formData, 'category_id')),
    competition_id: Number(text(formData, 'competition_id')) || null,
    opponent: text(formData, 'opponent'),
    match_date: toApiDateTime(matchDate),
    meet_at: meetAt ? toApiDateTime(meetAt) : null,
    // Con sede del club, la API completa el lugar y el link (FRO-39).
    venue_id: Number(text(formData, 'venue_id')) || null,
    venue: text(formData, 'venue') || null,
    maps_url: mapsUrl ? (/^https?:\/\//i.test(mapsUrl) ? mapsUrl : `https://${mapsUrl}`) : null,
    is_home: text(formData, 'is_home') !== '0',
    uniform: uniform === 'home' || uniform === 'away' ? uniform : null,
    uniform_color: text(formData, 'uniform_color') || null,
    what_to_bring: text(formData, 'what_to_bring') || null,
    notes: text(formData, 'notes') || null,
  }

  const errors: Record<string, string> = {}
  if (!input.category_id) errors.category_id = 'Elegí la categoría.'
  if (!input.opponent) errors.opponent = 'Poné el rival.'
  if (!matchDate) errors.match_date = 'Elegí el día y la hora del partido.'
  if (meetAt && matchDate && meetAt > matchDate) errors.meet_at = 'La presentación tiene que ser antes del partido.'
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors }

  if (id) return runApiAction(() => updateMatch(id, input), 'Partido actualizado.', MATCH_FIELDS)

  const created = await runCall(() => createMatch(input))
  if (!created.ok) return 'kind' in created ? failure(created, MATCH_FIELDS) : created
  await revalidateClub()
  return { ok: true, id: created.data.data.id, message: `Partido contra ${input.opponent} cargado.` }
}

/** Resultado y estado del partido (jugado, postergado, suspendido). */
export async function saveResultAction(id: number, formData: FormData): Promise<ActionResult> {
  const status = text(formData, 'status') as MatchStatus
  if (!STATUSES.includes(status)) return { ok: false, fieldErrors: { status: 'Elegí el estado.' } }

  const ours = optionalInt(formData, 'our_score')
  const theirs = optionalInt(formData, 'opponent_score')
  if (status === 'played' && (ours == null || theirs == null)) {
    return { ok: false, fieldErrors: { our_score: 'Cargá los dos tantos para marcarlo como jugado.' } }
  }

  return runApiAction(
    () =>
      updateMatch(id, {
        status,
        our_score: status === 'played' ? ours : null,
        opponent_score: status === 'played' ? theirs : null,
      }),
    status === 'played' ? 'Resultado guardado.' : 'Estado del partido actualizado.',
    ['status', 'our_score', 'opponent_score'],
  )
}

export async function deleteMatchAction(id: number): Promise<ActionResult> {
  return runApiAction(() => deleteMatch(id), 'Partido eliminado.', [])
}

export async function saveTrainingAction(id: number | null, formData: FormData): Promise<ActionResult> {
  const day = text(formData, 'day')
  const from = text(formData, 'from')
  const to = text(formData, 'to')
  const input: TrainingInput = {
    category_id: Number(text(formData, 'category_id')),
    starts_at: day && from ? toApiDateTime(`${day}T${from}`) : '',
    ends_at: day && to ? toApiDateTime(`${day}T${to}`) : '',
    location: text(formData, 'location') || null,
    objectives: text(formData, 'objectives') || null,
    notes: text(formData, 'notes') || null,
  }

  const errors: Record<string, string> = {}
  if (!input.category_id) errors.category_id = 'Elegí la categoría.'
  if (!day) errors.day = 'Elegí el día.'
  if (!from) errors.from = 'Elegí la hora de inicio.'
  if (!to) errors.to = 'Elegí la hora de fin.'
  else if (from && to <= from) errors.to = 'Tiene que terminar después de empezar.'
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors }

  const done = id ? 'Entrenamiento actualizado.' : 'Entrenamiento cargado.'
  return runApiAction(() => (id ? updateTraining(id, input) : createTraining(input)), done, TRAINING_FIELDS).then((result) =>
    // La API valida starts_at / ends_at; en el formulario son el día y las horas.
    !result.ok && result.fieldErrors
      ? {
          ok: false,
          fieldErrors: {
            ...result.fieldErrors,
            ...(result.fieldErrors.starts_at ? { from: result.fieldErrors.starts_at } : {}),
            ...(result.fieldErrors.ends_at ? { to: result.fieldErrors.ends_at } : {}),
          },
        }
      : result,
  )
}

export async function deleteTrainingAction(id: number): Promise<ActionResult> {
  return runApiAction(() => deleteTraining(id), 'Entrenamiento eliminado.', [])
}

export async function recordAttendanceAction(
  kind: 'matches' | 'trainings',
  id: number,
  records: { player_id: number; status: AttendanceStatus; notes?: string | null }[],
): Promise<ActionResult> {
  const valid = records
    .filter((r) => Number.isInteger(r.player_id) && ATTENDANCE.includes(r.status))
    .map((r) => ({ player_id: r.player_id, status: r.status, notes: r.notes?.trim().slice(0, 255) || null }))
  if (valid.length === 0) return { ok: false, error: 'Marcá al menos a un jugador.' }
  const present = valid.filter((r) => r.status === 'present' || r.status === 'late').length
  return runApiAction(() => recordAttendance(kind, id, valid), `Asistencia guardada: ${present} de ${valid.length} presentes.`, ['*'])
}

/** Guarda la lista de convocados; con `publish`, además la publica para compartirla. */
export async function saveCallupAction(
  matchId: number,
  players: { player_id: number; shirt_number: number | null }[],
  publish: boolean,
): Promise<ActionResult> {
  const valid = players.filter((p) => Number.isInteger(p.player_id) && (p.shirt_number === null || (Number.isInteger(p.shirt_number) && p.shirt_number >= 0)))
  if (publish && valid.length === 0) return { ok: false, error: 'Convocá al menos un jugador antes de publicar.' }

  const saved = await runCall(() => updateCallup(matchId, valid))
  if (!saved.ok) return 'kind' in saved ? failure(saved, ['*']) : saved
  if (!publish) {
    await revalidateClub()
    return { ok: true, message: `Convocatoria guardada: ${valid.length} convocados.` }
  }
  return publishCallupAction(matchId)
}

export async function publishCallupAction(matchId: number): Promise<ActionResult> {
  return runApiAction(() => publishCallup(matchId), 'Convocatoria publicada. Compartila en el grupo.', ['*'])
}
