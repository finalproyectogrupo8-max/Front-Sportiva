// Fechas y horas del club (FRO-18). La API guarda en UTC; el club vive en Argentina (UTC−3, sin
// horario de verano). Todo lo que se muestra o se carga va en hora argentina.

export const CLUB_TZ = 'America/Argentina/Buenos_Aires'
const OFFSET = '-03:00'

const parts = (iso: string, options: Intl.DateTimeFormatOptions) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: CLUB_TZ, hourCycle: 'h23', ...options })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  )

/**
 * Valor de un `<input type="datetime-local">` ("2026-11-07T15:00", hora argentina) → ISO en UTC
 * ("2026-11-07T18:00:00.000Z"). Va en UTC porque Laravel guarda la hora tal como llega, sin
 * pasarla a su zona: con "-03:00" las 15:00 quedaban guardadas como 15:00 UTC (12:00 acá).
 */
export function toApiDateTime(local: string): string {
  if (!local) return ''
  const date = new Date(`${local.length === 16 ? `${local}:00` : local}${OFFSET}`)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

/** ISO de la API → valor para `<input type="datetime-local">`, en hora argentina. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const p = parts(iso, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

/** Día en Argentina ("2026-11-07"), para agrupar en el calendario. */
export function dayKey(iso: string): string {
  const p = parts(iso, { year: 'numeric', month: '2-digit', day: '2-digit' })
  return `${p.year}-${p.month}-${p.day}`
}

/** "15:30". */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const p = parts(iso, { hour: '2-digit', minute: '2-digit' })
  return `${p.hour}:${p.minute}`
}

const LONG_DAY = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: CLUB_TZ })

/** "sábado, 7 de noviembre". */
export function formatLongDay(iso: string): string {
  return LONG_DAY.format(new Date(iso))
}

/* Días como "YYYY-MM-DD" (sin hora): cuentas de calendario en UTC para no depender de la zona. */

const toDate = (day: string) => new Date(`${day}T12:00:00Z`)
const fromDate = (d: Date) => d.toISOString().slice(0, 10)

export function addDays(day: string, n: number): string {
  const d = toDate(day)
  d.setUTCDate(d.getUTCDate() + n)
  return fromDate(d)
}

/** Lunes de la semana del día. */
export function startOfWeek(day: string): string {
  const d = toDate(day)
  const dow = (d.getUTCDay() + 6) % 7 // lunes = 0
  return addDays(day, -dow)
}

export function startOfMonth(day: string): string {
  return `${day.slice(0, 7)}-01`
}

export function addMonths(day: string, n: number): string {
  const d = toDate(startOfMonth(day))
  d.setUTCMonth(d.getUTCMonth() + n)
  return fromDate(d)
}

/** Hoy en Argentina. */
export function today(): string {
  return dayKey(new Date().toISOString())
}

export function isValidDay(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toDate(value).getTime()))
}

const DAY_HEADER = new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', timeZone: 'UTC' })
const MONTH_TITLE = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const RANGE_DAY = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/** "sáb 7". */
export function formatDayHeader(day: string): string {
  return DAY_HEADER.format(toDate(day))
}

/** "noviembre de 2026". */
export function formatMonthTitle(day: string): string {
  return MONTH_TITLE.format(toDate(day))
}

/** "2 nov – 8 nov". */
export function formatRange(from: string, to: string): string {
  return `${RANGE_DAY.format(toDate(from))} – ${RANGE_DAY.format(toDate(to))}`
}
