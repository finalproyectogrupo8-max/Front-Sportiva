import Link from 'next/link'
import { CalendarDays, Dumbbell, Swords } from 'lucide-react'
import { EmptyConfig } from '@/components/club/empty-state'
import type { CalendarEvent } from '@/lib/api/matches'
import { addDays, dayKey, formatDayHeader, formatTime, today } from '@/lib/club-time'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  played: 'Jugado',
  postponed: 'Postergado',
  cancelled: 'Suspendido',
}

/** Calendario de partidos y entrenamientos. Semana: lista por día. Mes: grilla de 7 columnas. */
export function CalendarView({
  club,
  view,
  from,
  to,
  anchor,
  events,
}: {
  club: string
  view: 'semana' | 'mes'
  from: string
  to: string
  anchor: string
  events: CalendarEvent[]
}) {
  const days: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d)
  const byDay = new Map<string, CalendarEvent[]>()
  for (const e of [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at))) {
    const key = dayKey(e.starts_at)
    byDay.set(key, [...(byDay.get(key) ?? []), e])
  }
  const now = today()

  if (view === 'semana') {
    if (events.length === 0) {
      return (
        <EmptyConfig
          icon={CalendarDays}
          title="No hay partidos ni entrenamientos esta semana"
          description="Cargalos con los botones de arriba, o mirá otra semana."
        />
      )
    }
    return (
      <ol className="grid gap-3 md:grid-cols-7">
        {days.map((day) => {
          const list = byDay.get(day) ?? []
          return (
            <li key={day} className={cn('flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-3', day === now && 'border-primary/50 ring-1 ring-primary/20', list.length === 0 && 'max-md:hidden')}>
              <h3 className={cn('text-xs font-semibold uppercase tracking-wide', day === now ? 'text-primary' : 'text-muted-foreground')}>
                {formatDayHeader(day)}
                {day === now && ' · hoy'}
              </h3>
              {list.length === 0 ? (
                <p className="text-xs text-muted-foreground/70">—</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {list.map((e) => (
                    <li key={`${e.type}-${e.id}`}>
                      <EventCard club={club} event={e} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ol>
    )
  }

  const month = anchor.slice(0, 7)
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="grid grid-cols-7 border-b bg-muted/50 text-center text-xs font-medium text-muted-foreground">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <ol className="grid grid-cols-7">
        {days.map((day) => {
          const list = byDay.get(day) ?? []
          const inMonth = day.slice(0, 7) === month
          return (
            <li key={day} className={cn('flex min-h-20 flex-col gap-1 border-b border-r p-1 sm:min-h-28 sm:p-1.5', !inMonth && 'bg-muted/30')}>
              <span
                className={cn(
                  'flex size-6 items-center justify-center rounded-full text-xs tabular-nums',
                  day === now ? 'bg-primary font-semibold text-primary-foreground' : inMonth ? 'text-foreground' : 'text-muted-foreground/60',
                )}
              >
                {Number(day.slice(8))}
              </span>
              <ul className="flex flex-col gap-1">
                {list.slice(0, 3).map((e) => (
                  <li key={`${e.type}-${e.id}`}>
                    <EventCard club={club} event={e} compact />
                  </li>
                ))}
                {list.length > 3 && <li className="px-1 text-[11px] text-muted-foreground">+{list.length - 3} más</li>}
              </ul>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function EventCard({ club, event: e, compact = false }: { club: string; event: CalendarEvent; compact?: boolean }) {
  const isMatch = e.type === 'match'
  const href = isMatch ? `/c/${club}/partidos/${e.id}` : `?${new URLSearchParams({ entrenamiento: String(e.id) })}`
  const Icon = isMatch ? Swords : Dumbbell
  const status = e.status ? STATUS_LABEL[e.status] : null
  const off = e.status === 'cancelled' || e.status === 'postponed'

  if (compact) {
    return (
      <Link
        href={href}
        scroll={false}
        className={cn(
          'flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] leading-tight transition-colors',
          isMatch ? 'bg-primary/12 text-foreground hover:bg-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/70',
          off && 'line-through opacity-60',
        )}
        title={`${formatTime(e.starts_at)} · ${e.title} · ${e.category_name}`}
      >
        <Icon className="size-3 shrink-0 max-sm:hidden" aria-hidden="true" />
        <span className="tabular-nums max-sm:hidden">{formatTime(e.starts_at)}</span>
        <span className="truncate">{isMatch ? e.title.replace(/^(vs|en)\s+/i, '') : e.category_name}</span>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        'flex min-w-0 flex-col gap-1 rounded-lg border p-2 text-sm transition-colors',
        isMatch ? 'border-primary/30 bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted',
        off && 'opacity-60',
      )}
    >
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className={cn('size-3.5', isMatch && 'text-primary')} aria-hidden="true" />
        <span className="tabular-nums">{formatTime(e.starts_at)}</span>
        <span className="truncate">· {e.category_name}</span>
      </span>
      <span className={cn('font-medium leading-tight', off && 'line-through')}>{isMatch ? e.title : 'Entrenamiento'}</span>
      {(e.location || status) && (
        <span className="truncate text-xs text-muted-foreground">{[status, e.location].filter(Boolean).join(' · ')}</span>
      )}
    </Link>
  )
}
