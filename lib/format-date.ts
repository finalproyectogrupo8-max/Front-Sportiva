// Fecha corta en hora de Argentina ("27 oct 2026").
// La zona horaria va fija: si no, el servidor (UTC) y el navegador formatean distinto
// cerca de la medianoche y React tira un error de hidratación.
const SHORT_DATE = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Argentina/Buenos_Aires',
})

export function formatShortDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return Number.isNaN(date.getTime()) ? dateString : SHORT_DATE.format(date)
}

// Fecha y hora en Argentina, 24 h ("29 oct 2026, 16:59").
// Con 12 h, Node y el navegador ponen espacios distintos antes de "p. m." y React
// tira un error de hidratación aunque el texto se vea igual.
const DATE_TIME = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'America/Argentina/Buenos_Aires',
})

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return Number.isNaN(date.getTime()) ? dateString : DATE_TIME.format(date)
}

// Fecha sin hora de la API ("2027-03-01"). `new Date` la toma como medianoche UTC: en Argentina
// sería el día anterior, así que se formatea en UTC.
const DAY = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })

export function formatDay(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const date = new Date(`${dateString.slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? dateString : DAY.format(date)
}
