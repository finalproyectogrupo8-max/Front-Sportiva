// Período de Análisis en la URL (?periodo=30|90|180). Por defecto, los últimos 3 meses.
const PERIODS = ['30', '90', '180'] as const

export function resolvePeriod(value: string | undefined) {
  const period = (PERIODS as readonly string[]).includes(value ?? '') ? (value as (typeof PERIODS)[number]) : '90'
  const to = new Date()
  const from = new Date(to.getTime() - Number(period) * 86_400_000)
  return { period, range: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) } }
}
