import { ScrollText } from 'lucide-react'
import { EmptyConfig } from '@/components/club/empty-state'
import { describePlatformChanges, platformActionLabel } from '@/lib/activity-labels'
import type { PlatformActivityEvent } from '@/lib/api/activity'
import { formatDateTime } from '@/lib/format-date'

function Actor({ event }: { event: PlatformActivityEvent }) {
  if (!event.actor) return <span className="text-xs text-muted-foreground">Sistema</span>

  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate font-medium text-foreground">{event.actor.name}</span>
      <span className="break-all text-xs text-muted-foreground">{event.actor.email}</span>
    </span>
  )
}

function Changes({ event }: { event: PlatformActivityEvent }) {
  const lines = describePlatformChanges(event.changes)

  if (lines.length === 0) return <span className="text-xs text-muted-foreground">—</span>

  return (
    <ul className="flex flex-col gap-0.5 text-xs">
      {lines.map((line) => (
        <li key={line.field} className="break-words text-muted-foreground">
          <span className="font-medium text-foreground">{line.field}:</span> {line.text}
        </li>
      ))}
    </ul>
  )
}

export function ActivityTable({
  events,
  filtered = false,
}: {
  events: PlatformActivityEvent[]
  filtered?: boolean
}) {
  if (events.length === 0) {
    return (
      <EmptyConfig
        icon={ScrollText}
        title={filtered ? 'No hay actividad con esos filtros' : 'Todavía no hay actividad'}
        description={
          filtered
            ? 'Probá con otro tipo de registro o ampliá el rango de fechas.'
            : 'Cuando se cree o se modifique algo en la plataforma, el evento va a aparecer acá.'
        }
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* En el celular, cada evento se lee como una ficha. */}
      <ul className="divide-y sm:hidden">
        {events.map((event) => (
          <li key={event.id} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">{platformActionLabel(event.action)}</p>
              <time dateTime={event.created_at} className="shrink-0 text-right text-[11px] leading-tight text-muted-foreground tabular-nums">
                {formatDateTime(event.created_at)}
              </time>
            </div>
            <Actor event={event} />
            {event.subject_label && (
              <p className="break-words text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Qué:</span> {event.subject_label}
              </p>
            )}
            <Changes event={event} />
          </li>
        ))}
      </ul>

      {/* En pantallas grandes, la tabla completa. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">Registro de actividad de la plataforma</caption>
          <thead className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            <tr>
              <th scope="col" className="whitespace-nowrap px-4 py-3">
                Fecha y hora
              </th>
              <th scope="col" className="px-4 py-3">
                Acción
              </th>
              <th scope="col" className="px-4 py-3">
                Quién
              </th>
              <th scope="col" className="px-4 py-3">
                Qué
              </th>
              <th scope="col" className="px-4 py-3">
                Cambios
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.map((event) => (
              <tr key={event.id} className="align-top transition-colors hover:bg-muted/40">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground tabular-nums">
                  {formatDateTime(event.created_at)}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{platformActionLabel(event.action)}</td>
                <td className="max-w-[14rem] px-4 py-3">
                  <Actor event={event} />
                </td>
                <td className="max-w-[18rem] px-4 py-3 text-xs text-foreground">
                  {event.subject_label ?? <span className="text-muted-foreground">—</span>}
                </td>
                <td className="max-w-[22rem] px-4 py-3">
                  <Changes event={event} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
