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

/** Asistencia de cada categoría en el período, de mayor a menor. Las que no tienen registros van al final. */
export function AttendanceByCategory({ rows }: { rows: CategoryRow[] }) {
  if (rows.length === 0) return <p className="py-2 text-sm text-muted-foreground">No hay categorías activas.</p>
  const sorted = [...rows].sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1))
  return (
    <ul className={cn('flex flex-col gap-3.5', COLORS)}>
      {sorted.map((r) => (
        <li key={r.name} className="flex flex-col gap-1.5" title={r.rate === null ? undefined : `${r.present} de ${r.recorded} registros`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium">{r.name}</span>
            {r.rate === null ? (
              <span className="shrink-0 text-xs text-muted-foreground">Sin registros</span>
            ) : (
              <span className="shrink-0 tabular-nums">
                <span className={cn('font-semibold', r.rate < 60 && 'text-destructive')}>{r.rate}%</span>
                <span className="text-xs text-muted-foreground">
                  {' '}
                  · {r.present} de {r.recorded}
                </span>
              </span>
            )}
          </div>
          <div className="h-2 rounded-full bg-muted" aria-hidden="true">
            {r.rate !== null && <div className="h-full rounded-full bg-[var(--hc-own)]" style={{ width: `${Math.max(r.rate, 2)}%` }} />}
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Campaña de cada categoría: partidos ganados, empatados y perdidos, y tantos a favor y en contra.
 * Cada categoría tiene su propia escala: un partido de básquet y uno de fútbol no se comparan.
 */
export function CampaignByCategory({ rows }: { rows: CategoryRow[] }) {
  const played = rows.filter((r) => r.played > 0)
  if (played.length === 0) return <p className="py-2 text-sm text-muted-foreground">Todavía no hay partidos jugados en los últimos 90 días.</p>
  return (
    <div className={cn('flex flex-col gap-4', COLORS)}>
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[var(--hc-own)]" />A favor
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-[var(--hc-rival)]" />
          En contra
        </span>
      </div>
      <ul className="flex flex-col gap-4">
        {played.map((r) => {
          const max = Math.max(r.goalsFor, r.goalsAgainst, 1)
          return (
            <li key={r.name} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{r.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{r.won}</span> G · <span className="font-semibold text-foreground">{r.drawn}</span> E ·{' '}
                  <span className="font-semibold text-foreground">{r.lost}</span> P
                </span>
              </div>
              <Bar label="A favor" value={r.goalsFor} max={max} color="bg-[var(--hc-own)]" />
              <Bar label="En contra" value={r.goalsAgainst} max={max} color="bg-[var(--hc-rival)]" />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-2" title={`${label}: ${value}`}>
      <div className="h-2 rounded-full bg-muted" aria-hidden="true">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${Math.max((value / max) * 100, value > 0 ? 3 : 0)}%` }} />
      </div>
      <span className="text-right text-xs tabular-nums">
        <span className="sr-only">{label}: </span>
        {value}
      </span>
    </div>
  )
}
