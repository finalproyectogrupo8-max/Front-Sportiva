'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Loader2, RotateCcw, ScrollText } from 'lucide-react'
import { EmptyConfig } from '@/components/club/empty-state'
import { Segmented } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { clubActionLabel, describeClubActivity } from '@/lib/activity-labels'
import { formatDateTime } from '@/lib/format-date'
import type { ClubActivityResponse } from '@/lib/api/activity'

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'order', label: 'Pedidos' },
  { value: 'player', label: 'Jugadores' },
  { value: 'club_user', label: 'Equipo' },
  { value: 'announcement', label: 'Comunicados' },
] as const

type TypeValue = (typeof TYPE_OPTIONS)[number]['value']

const PARAM_TYPE = 'actividad_tipo'
const PARAM_FROM = 'actividad_desde'
const PARAM_TO = 'actividad_hasta'

function currentType(value: string | null): TypeValue {
  return TYPE_OPTIONS.find((option) => option.value === value)?.value ?? 'all'
}

export function TeamActivity({ activity }: { activity: ClubActivityResponse | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const type = currentType(searchParams.get(PARAM_TYPE))
  const from = searchParams.get(PARAM_FROM) ?? ''
  const to = searchParams.get(PARAM_TO) ?? ''

  const updateFilter = (key: string, value: string | null) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (!value || (key === PARAM_TYPE && value === 'all')) {
      sp.delete(key)
    } else {
      sp.set(key, value)
    }

    const qs = sp.toString()
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  const handleReset = () => {
    const sp = new URLSearchParams(searchParams.toString())
    sp.delete(PARAM_TYPE)
    sp.delete(PARAM_FROM)
    sp.delete(PARAM_TO)

    const qs = sp.toString()
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    })
  }

  const filtered = type !== 'all' || Boolean(from) || Boolean(to)
  const events = activity?.data ?? []

  return (
    <section className="flex flex-col gap-2" aria-label="Registro de actividad">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-muted-foreground">Registro de actividad</h2>
        <p className="text-xs text-muted-foreground">
          Quién aprobó pedidos, cambió roles o dio de baja jugadores. Solo se puede consultar.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <Segmented
            label="Filtrar actividad por tipo"
            options={TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            value={type}
            onChange={(value) => updateFilter(PARAM_TYPE, value)}
          />

          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="activity-club-from" className="text-xs font-medium text-muted-foreground">
                Desde
              </label>
              <Input
                id="activity-club-from"
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) => updateFilter(PARAM_FROM, event.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="activity-club-to" className="text-xs font-medium text-muted-foreground">
                Hasta
              </label>
              <Input
                id="activity-club-to"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) => updateFilter(PARAM_TO, event.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {filtered && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Limpiar
              </Button>
            )}

            {isPending && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                <span className="sr-only">Actualizando actividad...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {activity === null ? (
        <div className="rounded-xl border border-dashed bg-card/50 p-6 text-center text-sm text-muted-foreground">
          No pudimos cargar el registro de actividad. Probá recargar la página.
        </div>
      ) : events.length === 0 ? (
        <EmptyConfig
          icon={ScrollText}
          title={filtered ? 'No hay actividad con esos filtros' : 'Todavía no hay actividad'}
          description={
            filtered
              ? 'Probá con otro tipo de registro o ampliá el rango de fechas.'
              : 'Cuando alguien del equipo haga algo, el evento va a aparecer acá.'
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <caption className="sr-only">Registro de actividad del club</caption>
                <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="whitespace-nowrap px-4 py-2.5 font-medium">
                      Fecha
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Quién
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Acción
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Detalle
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {events.map((event) => {
                    const detail = describeClubActivity(event.action, event.metadata)
                    return (
                      <tr key={event.id} className="align-top">
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground tabular-nums">
                          {formatDateTime(event.created_at)}
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground">
                          {event.actor?.name ?? <span className="text-muted-foreground">Sistema</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{clubActionLabel(event.action)}</td>
                        <td className="max-w-[24rem] px-4 py-3 text-xs text-muted-foreground">
                          {detail ?? '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {activity.meta.total > events.length && (
            <p className="px-1 text-xs text-muted-foreground">
              Mostrando los últimos {events.length} eventos de {activity.meta.total}. Achicá el rango de
              fechas para ver menos.
            </p>
          )}
        </>
      )}
    </section>
  )
}
