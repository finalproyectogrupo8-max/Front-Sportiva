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
