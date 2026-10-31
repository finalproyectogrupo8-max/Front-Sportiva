'use client'

import { useState, useTransition } from 'react'
import { Check, CheckCheck, Clock, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { recordAttendanceAction } from '@/app/(app)/c/[club]/partidos/actions'
import { Button } from '@/components/ui/button'
import type { AttendanceRow, AttendanceStatus } from '@/lib/api/matches'
import { cn } from '@/lib/utils'

const OPTIONS: { value: AttendanceStatus; label: string; short: string; icon: React.ComponentType<{ className?: string }>; on: string }[] = [
  { value: 'present', label: 'Presente', short: 'P', icon: Check, on: 'bg-success text-white border-success' },
  { value: 'late', label: 'Tarde', short: 'T', icon: Clock, on: 'bg-warning text-foreground border-warning' },
  { value: 'excused', label: 'Justificado', short: 'J', icon: Check, on: 'bg-primary/80 text-primary-foreground border-primary/80' },
  { value: 'absent', label: 'Ausente', short: 'A', icon: X, on: 'bg-destructive text-white border-destructive' },
]

/**
 * Asistencia en la cancha, pensada para el celular: un toque en el nombre marca presente o
 * ausente; los botones de la derecha permiten tarde o justificado. Se guarda con un solo envío.
 */
export function AttendanceTaker({
  kind,
  eventId,
  rows,
  canRecord,
}: {
  kind: 'matches' | 'trainings'
  eventId: number
  rows: AttendanceRow[]
  canRecord: boolean
}) {
  const [marks, setMarks] = useState<Record<number, AttendanceStatus | null>>(() =>
    Object.fromEntries(rows.map((r) => [r.player_id, r.status])),
  )
  const [dirty, setDirty] = useState(false)
  const [pending, startTransition] = useTransition()

  const set = (playerId: number, status: AttendanceStatus | null) => {
    setMarks((prev) => ({ ...prev, [playerId]: status }))
    setDirty(true)
  }
  const toggle = (playerId: number) => {
    const current = marks[playerId]
    set(playerId, current === 'present' ? 'absent' : 'present')
  }

  const values = Object.values(marks)
  const present = values.filter((s) => s === 'present' || s === 'late').length
  const missing = values.filter((s) => s === null).length

  const save = () => {
    const records = Object.entries(marks)
      .filter(([, status]) => status !== null)
      .map(([id, status]) => ({ player_id: Number(id), status: status as AttendanceStatus }))
    startTransition(async () => {
      const result = await recordAttendanceAction(kind, eventId, records).catch(() => ({ ok: false as const, error: 'No se pudo guardar. Probá de nuevo.' }))
      if (result.ok) {
        toast.success(result.message)
        setDirty(false)
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
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm">
          <span className="font-display text-2xl font-bold tabular-nums">{present}</span>
          <span className="text-muted-foreground"> de {rows.length} presentes</span>
          {missing > 0 && <span className="text-muted-foreground"> · {missing} sin marcar</span>}
        </p>
        {canRecord && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5"
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

      <ul className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
        {rows.map((row) => {
          const status = marks[row.player_id]
          return (
            <li key={row.player_id} className="flex items-center gap-2 p-2 pl-3">
              <button
                type="button"
                disabled={!canRecord}
                onClick={() => toggle(row.player_id)}
                className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg text-left disabled:cursor-default"
                aria-label={`${row.player_name}: ${status ? OPTIONS.find((o) => o.value === status)?.label : 'sin marcar'}. Tocá para cambiar entre presente y ausente.`}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full border-2 font-display text-sm font-bold tabular-nums transition-colors',
                    status ? OPTIONS.find((o) => o.value === status)?.on : 'border-dashed border-muted-foreground/40 text-muted-foreground',
                  )}
                  aria-hidden="true"
                >
                  {row.shirt_number ?? '·'}
                </span>
                <span className="truncate font-medium">{row.player_name}</span>
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
              {!canRecord && status && <span className="text-xs text-muted-foreground">{OPTIONS.find((o) => o.value === status)?.label}</span>}
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted-foreground">P presente · T tarde · J justificado · A ausente. Tocá el nombre para pasar entre presente y ausente.</p>

      {canRecord && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 p-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0">
          <Button size="lg" className="h-12 w-full gap-2 text-base sm:w-auto" disabled={pending || (!dirty && missing === rows.length)} onClick={save}>
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {pending ? 'Guardando…' : dirty ? 'Guardar asistencia' : 'Guardada'}
          </Button>
        </div>
      )}
    </div>
  )
}
