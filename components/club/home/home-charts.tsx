import { cn } from '@/lib/utils'

// Gráficos del inicio: barras simples con el valor escrito al lado (nunca solo color).
// Colores del módulo Análisis, validados para daltonismo en modo claro y oscuro:
// terracota para lo propio y azul para el rival.
const COLORS = '[--hc-own:#ad4c2b] [--hc-rival:#2f6aa3] dark:[--hc-own:#d36f45] dark:[--hc-rival:#5d8fd0]'

export type CategoryRow = {
  name: string
  rate: number | null
  present: number
  recorded: number
  goalsFor: number
  goalsAgainst: number
  played: number
  won: number
  drawn: number
  lost: number
}

/** Asistencia de cada categoría en el período, de mayor a menor, con una línea fina de referencia. */
export function AttendanceByCategory({ rows }: { rows: CategoryRow[] }) {
  if (rows.length === 0) return <p className="py-2 text-sm text-muted-foreground">No hay categorías activas.</p>
  const sorted = [...rows].sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1))
  return (
    <ul className={cn('flex flex-col divide-y', COLORS)}>
      {sorted.map((r) => (
        <li key={r.name} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm font-medium">{r.name}</span>
            {r.rate === null ? (
              <span className="shrink-0 text-xs text-muted-foreground">Sin registros</span>
            ) : (
              <span className="shrink-0 tabular-nums">
                <span className="text-xs text-muted-foreground">
                  {r.present} de {r.recorded} ·{' '}
                </span>
                <span className={cn('font-display text-lg font-bold', r.rate < 60 && 'text-destructive')}>{r.rate}%</span>
              </span>
            )}
          </div>
          <div className="h-1 rounded-full bg-muted" aria-hidden="true">
            {r.rate !== null && <div className="h-full rounded-full bg-[var(--hc-own)]" style={{ width: `${Math.max(r.rate, 2)}%` }} />}
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Campaña de cada categoría: ganados, empatados y perdidos, y una línea partida con los tantos
 * a favor y en contra. Cada categoría tiene su propia escala: básquet y fútbol no se comparan.
 */
export function CampaignByCategory({ rows }: { rows: CategoryRow[] }) {
  const played = rows.filter((r) => r.played > 0)
  if (played.length === 0) return <p className="py-2 text-sm text-muted-foreground">Todavía no hay partidos jugados en los últimos 90 días.</p>
  return (
    <ul className={cn('flex flex-col divide-y', COLORS)}>
      {played.map((r) => {
        const total = r.goalsFor + r.goalsAgainst
        const share = total > 0 ? (r.goalsFor / total) * 100 : 50
        return (
          <li key={r.name} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium">{r.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                <span className="font-semibold text-foreground">{r.won}</span> G · <span className="font-semibold text-foreground">{r.drawn}</span> E ·{' '}
                <span className="font-semibold text-foreground">{r.lost}</span> P
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs tabular-nums">
              <span className="w-8 shrink-0">
                <span className="sr-only">A favor: </span>
                {r.goalsFor}
              </span>
              <div className="flex h-1 flex-1 gap-0.5" aria-hidden="true" title={`${r.goalsFor} a favor · ${r.goalsAgainst} en contra`}>
                <div className="h-full rounded-full bg-[var(--hc-own)]" style={{ width: `${share}%` }} />
                <div className="h-full flex-1 rounded-full bg-[var(--hc-rival)]" />
              </div>
              <span className="w-8 shrink-0 text-right text-muted-foreground">
                <span className="sr-only">En contra: </span>
                {r.goalsAgainst}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Referencia de colores de la campaña, para el encabezado de la tarjeta. */
export function CampaignLegend() {
  return (
    <span className={cn('flex items-center gap-3 text-xs font-normal text-muted-foreground', COLORS)}>
      <span className="flex items-center gap-1.5">
        <span className="h-1 w-3 rounded-full bg-[var(--hc-own)]" aria-hidden="true" />A favor
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1 w-3 rounded-full bg-[var(--hc-rival)]" aria-hidden="true" />
        En contra
      </span>
    </span>
  )
}
