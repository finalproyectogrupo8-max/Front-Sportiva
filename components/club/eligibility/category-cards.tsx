import Link from 'next/link'
import { CalendarClock, ChevronRight, Clock } from 'lucide-react'
import type { CategoryEligibility } from '@/lib/api/eligibility'
import { cn } from '@/lib/utils'

function deadlineText(days: number | null): string | null {
  if (days == null) return null
  if (days === 0) return 'La inscripción cierra hoy'
  return `Cierre de inscripción en ${days} ${days === 1 ? 'día' : 'días'}`
}

/** Vista del club: una tarjeta por categoría con cuántos están habilitados. */
export function CategoryCards({ club, categories }: { club: string; categories: CategoryEligibility[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {categories.map((c) => {
        const percent = c.players ? Math.round((c.eligible / c.players) * 100) : 0
        const urgent = c.days_to_deadline != null && c.days_to_deadline <= 15 && c.eligible < c.players
        const tone = c.players === 0 ? 'bg-muted-foreground/40' : percent === 100 ? 'bg-success' : percent >= 70 ? 'bg-primary' : 'bg-warning'
        const deadline = deadlineText(c.days_to_deadline)
        return (
          <li key={c.category_id}>
            <Link
              href={`/c/${club}/habilitacion?categoria=${c.category_id}`}
              className="flex h-full flex-col gap-4 rounded-xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-2xl font-bold uppercase leading-none">{c.category_name}</h2>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </div>

              <div className="flex flex-col gap-2">
                <p className="flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-bold leading-none tabular-nums">{c.eligible}</span>
                  <span className="text-sm text-muted-foreground">
                    de {c.players} habilitados
                  </span>
                </p>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${percent}% habilitados`}
                >
                  <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${percent}%` }} />
                </div>
              </div>

              {(deadline || c.expiring_soon > 0 || c.players === 0) && (
                <ul className="mt-auto flex flex-col gap-1.5 border-t pt-3 text-xs">
                  {c.players === 0 && <li className="text-muted-foreground">Todavía no tiene jugadores.</li>}
                  {deadline && (
                    <li className={cn('flex items-center gap-1.5', urgent ? 'font-medium text-destructive' : 'text-muted-foreground')}>
                      <CalendarClock className="size-3.5" aria-hidden="true" />
                      {deadline}
                    </li>
                  )}
                  {c.expiring_soon > 0 && (
                    <li className="flex items-center gap-1.5 text-foreground">
                      <Clock className="size-3.5 text-warning" aria-hidden="true" />
                      {c.expiring_soon} {c.expiring_soon === 1 ? 'papel vence' : 'papeles vencen'} en los próximos 30 días
                    </li>
                  )}
                </ul>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
