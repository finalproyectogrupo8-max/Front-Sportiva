'use client'

import { useState, useTransition } from 'react'
import { Check, CheckCheck, Clock, Loader2, Search, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { recordAttendanceAction } from '@/app/(app)/c/[club]/partidos/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AttendanceRow, AttendanceStatus } from '@/lib/api/matches'
import { cn } from '@/lib/utils'

const OPTIONS: {
  value: AttendanceStatus
  label: string
  short: string
  icon: React.ComponentType<{ className?: string }>
  on: string
  text: string
}[] = [
  { value: 'present', label: 'Presente', short: 'P', icon: Check, on: 'bg-success text-white border-success', text: 'text-success' },
  { value: 'late', label: 'Tarde', short: 'T', icon: Clock, on: 'bg-warning text-foreground border-warning', text: 'text-warning' },
  { value: 'excused', label: 'Justificado', short: 'J', icon: ShieldCheck, on: 'bg-primary/80 text-primary-foreground border-primary/80', text: 'text-primary' },
  { value: 'absent', label: 'Ausente', short: 'A', icon: X, on: 'bg-destructive text-white border-destructive', text: 'text-destructive' },
]
const byValue = Object.fromEntries(OPTIONS.map((o) => [o.value, o])) as Record<AttendanceStatus, (typeof OPTIONS)[number]>

/**
 * Asistencia en la cancha, pensada para el celular: un toque en el nombre marca presente o
 * ausente; los botones de cada fila permiten tarde o justificado. Se guarda con un solo envío.
 * `columns`: en la página ancha, la lista va en dos columnas.
 */
export function AttendanceTaker({
  kind,
  eventId,
  rows,
  canRecord,
  columns = 1,
  inSheet = false,
  onSaved,
}: {
  kind: 'matches' | 'trainings'
  eventId: number
  rows: AttendanceRow[]
  canRecord: boolean
  columns?: 1 | 2
  /** Dentro del panel lateral: la barra de guardar ocupa todo el ancho con el fondo del panel. */
  inSheet?: boolean
  onSaved?: () => void
}) {
  const [marks, setMarks] = useState<Record<number, AttendanceStatus | null>>(() => Object.fromEntries(rows.map((r) => [r.player_id, r.status])))
  const [dirty, setDirty] = useState(false)
  const [query, setQuery] = useState('')
  const [pending, startTransition] = useTransition()

  const set = (playerId: number, status: AttendanceStatus | null) => {
    setMarks((prev) => ({ ...prev, [playerId]: status }))
    setDirty(true)
  }
  const toggle = (playerId: number) => set(playerId, marks[playerId] === 'present' ? 'absent' : 'present')

  const values = Object.values(marks)
  const count = (s: AttendanceStatus) => values.filter((v) => v === s).length
  const present = count('present') + count('late')
  const missing = values.filter((s) => s === null).length
  const marked = rows.length - missing
  const shown = query.trim() ? rows.filter((r) => r.player_name.toLowerCase().includes(query.trim().toLowerCase())) : rows

  const save = () => {
    const records = Object.entries(marks)
      .filter(([, status]) => status !== null)
      .map(([id, status]) => ({ player_id: Number(id), status: status as AttendanceStatus }))
    startTransition(async () => {
      const result = await recordAttendanceAction(kind, eventId, records).catch(() => ({ ok: false as const, error: 'No se pudo guardar. Probá de nuevo.' }))
      if (result.ok) {
        toast.success(result.message)
        setDirty(false)
        onSaved?.()
      } else {
        toast.error(result.error ?? 'Revisá la lista: hay jugadores que no son de la categoría.')
      }
    })
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
        La categoría no tiene jugadores. Sumalos desde el módulo Jugadores.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <div className="flex items-end justify-between gap-3">
          <p>
            <span className="font-display text-4xl font-bold tabular-nums leading-none">{present}</span>
            <span className="text-sm text-muted-foreground"> de {rows.length} presentes</span>
          </p>
          <span className="text-xs text-muted-foreground">{missing > 0 ? `${missing} sin marcar` : 'Todos marcados'}</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-muted" role="presentation">
          {OPTIONS.map((o) => (
            <span key={o.value} className={cn('h-full transition-all', o.on.split(' ')[0])} style={{ width: `${(count(o.value) / rows.length) * 100}%` }} />
          ))}
        </div>
        <ul className="grid grid-cols-4 gap-2 text-center">
          {OPTIONS.map((o) => (
            <li key={o.value} className="flex flex-col rounded-lg bg-muted/50 py-1.5">
              <span className={cn('font-display text-lg font-bold tabular-nums leading-tight', o.text)}>{count(o.value)}</span>
              <span className="text-[11px] text-muted-foreground">{o.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Herramientas */}
      <div className="flex items-center gap-2">
        {rows.length > 8 && (
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar jugador" aria-label="Buscar jugador" className="pl-9" />
          </div>
        )}
        {canRecord && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-9 gap-1.5"
            onClick={() => {
              setMarks(Object.fromEntries(rows.map((r) => [r.player_id, 'present'])))
              setDirty(true)
            }}
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            Todos presentes
          </Button>
        )}
      </div>

      <ul className={cn('grid gap-2', columns === 2 && 'lg:grid-cols-2')}>
        {shown.map((row) => {
          const status = marks[row.player_id]
          const option = status ? byValue[status] : null
          return (
            <li key={row.player_id} className={cn('flex items-center gap-2 rounded-xl border bg-card p-2 pl-3 transition-colors', option && 'border-transparent ring-1 ring-border')}>
              <button
                type="button"
                disabled={!canRecord}
                onClick={() => toggle(row.player_id)}
                className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg text-left disabled:cursor-default"
                aria-label={`${row.player_name}: ${option?.label ?? 'sin marcar'}. Tocá para cambiar entre presente y ausente.`}
              >
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full border-2 font-display text-sm font-bold tabular-nums transition-colors',
                    option ? option.on : 'border-dashed border-muted-foreground/40 text-muted-foreground',
                  )}
                  aria-hidden="true"
                >
                  {row.shirt_number ?? '·'}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{row.player_name}</span>
                  <span className={cn('text-xs', option ? option.text : 'text-muted-foreground')}>{option?.label ?? 'Sin marcar'}</span>
                </span>
              </button>
              {canRecord && (
                <div className="flex shrink-0 gap-1" role="radiogroup" aria-label={`Asistencia de ${row.player_name}`}>
                  {OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={status === o.value}
                      aria-label={o.label}
                      title={o.label}
                      onClick={() => set(row.player_id, o.value)}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-lg border text-xs font-semibold transition-colors',
                        status === o.value ? o.on : 'text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {o.short}
                    </button>
                  ))}
                </div>
              )}
            </li>
          )
        })}
        {shown.length === 0 && <li className="p-4 text-center text-sm text-muted-foreground">Nadie con ese nombre.</li>}
      </ul>
      <p className="text-xs text-muted-foreground">Tocá el nombre para pasar entre presente y ausente. T tarde · J justificado.</p>

      {canRecord && (
        <div
          className={cn(
            'sticky bottom-0 flex items-center gap-3 border-t py-3 backdrop-blur',
            inSheet ? '-mx-6 bg-popover/95 px-6' : '-mx-1 bg-background/95 px-1',
          )}
        >
          <span className="hidden text-sm text-muted-foreground sm:block">
            {dirty ? 'Hay cambios sin guardar' : marked > 0 ? 'Asistencia guardada' : 'Marcá a los jugadores'}
          </span>
          <Button size="lg" className="h-12 flex-1 gap-2 text-base sm:ml-auto sm:flex-none sm:px-8" disabled={pending || !dirty} onClick={save}>
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {pending ? 'Guardando…' : dirty ? 'Guardar asistencia' : 'Guardada'}
          </Button>
        </div>
      )}
    </div>
  )
}
