'use client'

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from 'react'
import { useParams } from 'next/navigation'
import { Check, CheckCheck, Clock, CloudOff, History, Loader2, Megaphone, Search, ShieldCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { recordAttendanceAction } from '@/app/(app)/c/[club]/partidos/actions'
import { PlayerAvatar } from '@/components/club/players/player-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AttendanceRow, AttendanceStatus } from '@/lib/api/matches'
import { photoUrl } from '@/lib/player-labels'
import { cn } from '@/lib/utils'

const OPTIONS: {
  value: AttendanceStatus
  label: string
  short: string
  icon: React.ComponentType<{ className?: string }>
  on: string
  ring: string
  text: string
}[] = [
  { value: 'present', label: 'Presente', short: 'P', icon: Check, on: 'bg-success text-white border-success', ring: 'ring-success', text: 'text-success' },
  { value: 'late', label: 'Tarde', short: 'T', icon: Clock, on: 'bg-warning text-foreground border-warning', ring: 'ring-warning', text: 'text-warning' },
  { value: 'excused', label: 'Justificado', short: 'J', icon: ShieldCheck, on: 'bg-primary/80 text-primary-foreground border-primary/80', ring: 'ring-primary/80', text: 'text-primary' },
  { value: 'absent', label: 'Ausente', short: 'A', icon: X, on: 'bg-destructive text-white border-destructive', ring: 'ring-destructive', text: 'text-destructive' },
]
const byValue = Object.fromEntries(OPTIONS.map((o) => [o.value, o])) as Record<AttendanceStatus, (typeof OPTIONS)[number]>

/** Respuesta de cada convocado (solo partidos): precarga la lista. */
export type CallupAnswer = { player_id: number; response: string; response_note: string | null }

type Mark = { status: AttendanceStatus | null; notes: string | null }
type Marks = Record<number, Mark>

// Borrador local: si se corta la señal en la cancha, lo marcado no se pierde.
const draftKey = (kind: string, id: number) => `sportiva:asistencia:${kind}:${id}`
function readDraft(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
function writeDraft(key: string, marks: Marks | null) {
  try {
    if (marks) window.localStorage.setItem(key, JSON.stringify({ marks, at: Date.now() }))
    else window.localStorage.removeItem(key)
  } catch {}
}
const noop = () => () => {}

/** Estado inicial: lo guardado; si no hay nada, lo que respondieron en la convocatoria ("No puedo" → justificado). */
function initialMarks(rows: AttendanceRow[], answers: Map<number, CallupAnswer>): { marks: Marks; preloaded: number } {
  let preloaded = 0
  const marks: Marks = {}
  for (const r of rows) {
    const answer = answers.get(r.player_id)
    if (r.status === null && answer?.response === 'not_going') {
      marks[r.player_id] = { status: 'excused', notes: answer.response_note ? `Avisó: ${answer.response_note}` : 'Avisó que no podía' }
      preloaded++
    } else {
      marks[r.player_id] = { status: r.status, notes: r.notes }
    }
  }
  return { marks, preloaded }
}

/**
 * Asistencia en la cancha, pensada para el celular: un toque en el jugador marca presente o
 * ausente; los botones de cada fila permiten tarde o justificado. Se guarda con un solo envío.
 * En partidos llega precargada con la convocatoria. Si no hay señal, queda un borrador en el
 * celular y se reintenta solo al volver la conexión.
 */
export function AttendanceTaker({
  kind,
  eventId,
  rows,
  canRecord,
  callup = [],
  columns = 1,
  inSheet = false,
  onSaved,
}: {
  kind: 'matches' | 'trainings'
  eventId: number
  rows: AttendanceRow[]
  canRecord: boolean
  callup?: CallupAnswer[]
  columns?: 1 | 2
  /** Dentro del panel lateral: la barra de guardar ocupa todo el ancho con el fondo del panel. */
  inSheet?: boolean
  onSaved?: () => void
}) {
  const { club } = useParams<{ club: string }>()
  const answers = new Map(callup.map((c) => [c.player_id, c]))
  const key = draftKey(kind, eventId)
  const [{ marks, preloaded }, setState] = useState(() => initialMarks(rows, answers))
  const [dirty, setDirty] = useState(preloaded > 0)
  const [query, setQuery] = useState('')
  const [offline, setOffline] = useState(false)
  const [draftHandled, setDraftHandled] = useState(false)
  const [pending, startTransition] = useTransition()

  // Un borrador de antes (de otra visita) se ofrece para recuperar; no se aplica solo. Se deja de
  // ofrecer apenas se marca algo, porque desde ahí el borrador es lo de esta visita.
  const storedDraft = useSyncExternalStore(noop, () => readDraft(key), () => null)
  const draft = !draftHandled && canRecord ? parseDraft(storedDraft, rows) : null

  const update = (next: Marks) => {
    setState((prev) => ({ ...prev, marks: next }))
    setDirty(true)
    setDraftHandled(true)
    writeDraft(key, next)
  }
  const set = (playerId: number, status: AttendanceStatus | null) => update({ ...marks, [playerId]: { status, notes: status === marks[playerId]?.status ? marks[playerId].notes : null } })
  const toggle = (playerId: number) => set(playerId, marks[playerId]?.status === 'present' ? 'absent' : 'present')

  const values = Object.values(marks).map((m) => m.status)
  const count = (s: AttendanceStatus) => values.filter((v) => v === s).length
  const present = count('present') + count('late')
  const missing = values.filter((s) => s === null).length
  const marked = rows.length - missing
  const shown = query.trim() ? rows.filter((r) => r.player_name.toLowerCase().includes(query.trim().toLowerCase())) : rows

  const save = () => {
    const records = Object.entries(marks)
      .filter(([, m]) => m.status !== null)
      .map(([id, m]) => ({ player_id: Number(id), status: m.status as AttendanceStatus, notes: m.notes }))
    startTransition(async () => {
      let result: Awaited<ReturnType<typeof recordAttendanceAction>>
      try {
        result = await recordAttendanceAction(kind, eventId, records)
      } catch {
        // Sin red: queda el borrador y se reintenta al volver la conexión.
        writeDraft(key, marks)
        setOffline(true)
        toast.warning('Sin conexión. Lo marcado quedó guardado en este dispositivo y se envía solo cuando vuelva la señal.')
        return
      }
      if (result.ok) {
        toast.success(result.message)
        writeDraft(key, null)
        setDirty(false)
        setOffline(false)
        setDraftHandled(true)
        onSaved?.()
      } else {
        toast.error(result.error ?? 'Revisá la lista: hay jugadores que no son de la categoría.')
      }
    })
  }

  // Reintento automático cuando vuelve la conexión.
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  })
  useEffect(() => {
    if (!offline) return
    const retry = () => saveRef.current()
    window.addEventListener('online', retry)
    return () => window.removeEventListener('online', retry)
  }, [offline])

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
        {kind === 'matches'
          ? 'Todavía no hay convocados. La asistencia del partido se toma a los convocados: armá la convocatoria primero.'
          : 'La categoría no tiene jugadores. Sumalos desde el módulo Jugadores.'}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {draft && (
        <div className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm sm:flex-row sm:items-center">
          <History className="size-5 shrink-0 text-warning" aria-hidden="true" />
          <p className="flex-1">
            <span className="font-medium">Hay una asistencia sin enviar en este dispositivo</span>
            <span className="text-muted-foreground"> ({draft.count} marcados). ¿La recuperás?</span>
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setState((prev) => ({ ...prev, marks: { ...prev.marks, ...draft.marks } }))
                setDirty(true)
                setDraftHandled(true)
              }}
            >
              Recuperar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                writeDraft(key, null)
                setDraftHandled(true)
              }}
            >
              Descartar
            </Button>
          </div>
        </div>
      )}

      {offline && (
        <p className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm" role="status">
          <CloudOff className="size-4 shrink-0 text-destructive" aria-hidden="true" />
          Sin conexión: la asistencia quedó guardada en este dispositivo. Se envía sola cuando vuelva la señal.
        </p>
      )}

      {preloaded > 0 && dirty && !offline && (
        <p className="flex items-center gap-2 rounded-xl bg-primary/5 p-3 text-sm text-muted-foreground">
          <Megaphone className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {preloaded === 1 ? 'Un convocado avisó' : `${preloaded} convocados avisaron`} que no podía{preloaded === 1 ? '' : 'n'}: {preloaded === 1 ? 'quedó' : 'quedaron'} como justificado{preloaded === 1 ? '' : 's'}.
        </p>
      )}

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
            onClick={() =>
              // Los que avisaron que no venían siguen justificados.
              update(Object.fromEntries(rows.map((r) => [r.player_id, marks[r.player_id]?.status === 'excused' ? marks[r.player_id] : { status: 'present', notes: null }])))
            }
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            Todos presentes
          </Button>
        )}
      </div>

      <ul className={cn('grid grid-cols-[minmax(0,1fr)] gap-2', columns === 2 && 'lg:grid-cols-[repeat(2,minmax(0,1fr))]')}>
        {shown.map((row) => {
          const mark = marks[row.player_id]
          const option = mark?.status ? byValue[mark.status] : null
          const answer = answers.get(row.player_id)
          const [first, ...rest] = row.player_name.split(' ')
          return (
            <li key={row.player_id} className={cn('flex items-center gap-2 rounded-xl border bg-card p-2 pl-3 transition-colors', option && 'border-transparent ring-1 ring-border')}>
              <button
                type="button"
                disabled={!canRecord}
                onClick={() => toggle(row.player_id)}
                className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-lg text-left disabled:cursor-default"
                aria-label={`${row.player_name}: ${option?.label ?? 'sin marcar'}. Tocá para cambiar entre presente y ausente.`}
              >
                <span className={cn('rounded-full p-0.5 ring-2 transition-colors', option ? option.ring : 'ring-transparent')}>
                  <PlayerAvatar
                    first={first ?? ''}
                    last={rest.join(' ')}
                    src={photoUrl(club, row.photo_document_id)}
                    number={row.shirt_number}
                    className={cn('size-10', !option && 'opacity-70')}
                  />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{row.player_name}</span>
                  <span className={cn('truncate text-xs', option ? option.text : 'text-muted-foreground')}>
                    {option?.label ?? 'Sin marcar'}
                    {mark?.notes && <span className="text-muted-foreground"> · {mark.notes}</span>}
                    {!mark?.notes && answer?.response === 'going' && <span className="text-muted-foreground"> · Confirmó que iba</span>}
                  </span>
                </span>
              </button>
              {canRecord && (
                <div className="flex shrink-0 gap-1" role="radiogroup" aria-label={`Asistencia de ${row.player_name}`}>
                  {OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={mark?.status === o.value}
                      aria-label={o.label}
                      title={o.label}
                      onClick={() => set(row.player_id, o.value)}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-lg border text-xs font-semibold transition-colors',
                        mark?.status === o.value ? o.on : 'text-muted-foreground hover:bg-muted',
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
      <p className="text-xs text-muted-foreground">Tocá el jugador para pasar entre presente y ausente. T tarde · J justificado.</p>

      {canRecord && (
        <div
          className={cn(
            'sticky bottom-0 flex items-center gap-3 border-t py-3 backdrop-blur',
            inSheet ? '-mx-6 bg-popover/95 px-6' : 'bottom-16 -mx-1 bg-background/95 px-1 md:bottom-0',
          )}
        >
          <span className="hidden text-sm text-muted-foreground sm:block">
            {offline ? 'Esperando conexión…' : dirty ? 'Hay cambios sin guardar' : marked > 0 ? 'Asistencia guardada' : 'Marcá a los jugadores'}
          </span>
          <Button size="lg" className="h-12 flex-1 gap-2 text-base sm:ml-auto sm:flex-none sm:px-8" disabled={pending || !dirty} onClick={save}>
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {pending ? 'Guardando…' : offline ? 'Reintentar' : dirty ? 'Guardar asistencia' : 'Guardada'}
          </Button>
        </div>
      )}
    </div>
  )
}

/** El borrador guardado, solo con jugadores de la lista actual. null si no hay o no sirve. */
function parseDraft(raw: string | null, rows: AttendanceRow[]): { marks: Marks; count: number } | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { marks?: Marks }
    const ids = new Set(rows.map((r) => r.player_id))
    const marks = Object.fromEntries(
      Object.entries(parsed.marks ?? {}).filter(([id, m]) => ids.has(Number(id)) && m && (m.status === null || m.status in byValue)),
    ) as Marks
    const count = Object.values(marks).filter((m) => m.status !== null).length
    return count > 0 ? { marks, count } : null
  } catch {
    return null
  }
}
