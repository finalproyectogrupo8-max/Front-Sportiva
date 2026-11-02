import { listPlayers } from '@/lib/api/players'
import { calendar, getAttendance, type AttendanceStatus } from '@/lib/api/matches'
import { csvResponse } from '@/lib/csv'
import { allPages } from '@/lib/exports'
import { CLUB_TZ } from '@/lib/club-time'

// Planilla de asistencia del mes de una categoría (FRO-29): un jugador por fila y una columna por
// entrenamiento o partido, más los totales. `?mes=2026-11` (por defecto, el mes actual).
const MARK: Record<AttendanceStatus, string> = { present: 'P', late: 'T', excused: 'J', absent: 'A' }

export async function GET(request: Request, { params }: { params: Promise<{ categoria: string }> }): Promise<Response> {
  const categoryId = Number((await params).categoria)
  const month = new URL(request.url).searchParams.get('mes') ?? new Date().toISOString().slice(0, 7)
  if (!categoryId || !/^\d{4}-\d{2}$/.test(month)) return new Response('Parámetros inválidos.', { status: 400 })

  const [year, m] = month.split('-').map(Number)
  const from = `${month}-01`
  const to = new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10)

  const [events, players] = await Promise.all([
    calendar({ from, to, category_id: categoryId }),
    allPages((page) => listPlayers({ category_id: categoryId, status: 'active', per_page: 100, page })),
  ])
  if (!events.ok || !players) return new Response('No se pudo leer la asistencia.', { status: 502 })

  const sessions = events.data.data
    .filter((e) => e.category_id === categoryId && e.status !== 'cancelled' && new Date(e.starts_at) <= new Date())
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const sheets = await Promise.all(sessions.map((e) => getAttendance(e.type === 'match' ? 'matches' : 'trainings', e.id)))

  const label = (iso: string, type: string) =>
    `${new Date(iso).toLocaleDateString('es-AR', { timeZone: CLUB_TZ, day: '2-digit', month: '2-digit' })} ${type === 'match' ? 'Partido' : 'Entren.'}`
  const marks = sheets.map((s) => new Map((s.ok ? s.data.data : []).map((r) => [r.player_id, r.status])))

  const rows = [...players]
    .sort((a, b) => a.last_name.localeCompare(b.last_name, 'es'))
    .map((p) => {
      const cells = marks.map((mk) => (mk.get(p.id) ? MARK[mk.get(p.id) as AttendanceStatus] : ''))
      const recorded = cells.filter(Boolean).length
      const present = cells.filter((c) => c === 'P' || c === 'T').length
      return [`${p.last_name}, ${p.first_name}`, ...cells, present, recorded, recorded ? `${Math.round((present / recorded) * 100)}%` : '']
    })

  return csvResponse(
    [
      ['Jugador', ...sessions.map((e) => label(e.starts_at, e.type)), 'Presentes', 'Registrados', 'Asistencia'],
      ...rows,
      [],
      ['P: presente · T: tarde · J: faltó con aviso · A: faltó sin aviso'],
    ],
    `asistencia-${categoryId}-${month}.csv`,
  )
}
