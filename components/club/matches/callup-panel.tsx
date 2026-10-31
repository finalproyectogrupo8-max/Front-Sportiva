'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Copy, Loader2, MessageCircle, Pencil, RefreshCw, Send, Users } from 'lucide-react'
import { toast } from 'sonner'
import { publishCallupAction, saveCallupAction } from '@/app/(app)/c/[club]/partidos/actions'
import { Pill, type Tone } from '@/components/club/shared'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ActionResult } from '@/lib/action-result'
import type { CallupResponse, CallupRow, CallupSheet } from '@/lib/api/matches'
import { cn } from '@/lib/utils'

const RESPONSE: Record<CallupResponse, { label: string; tone: Tone }> = {
  going: { label: 'Va', tone: 'ok' },
  not_going: { label: 'No puede', tone: 'bad' },
  pending: { label: 'Sin respuesta', tone: 'neutral' },
}

type Filter = 'all' | CallupResponse

/**
 * Convocatoria del partido (FRO-35). Antes de publicar: elegir entre los habilitados y ajustar
 * números. Publicada: compartir en el grupo o a cada familia por WhatsApp y seguir las respuestas.
 */
export function CallupPanel({ sheet, can }: { sheet: CallupSheet; can: { update: boolean; publish: boolean } }) {
  const published = sheet.published_at !== null
  const [editing, setEditing] = useState(!published && can.update)

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5" aria-labelledby="match-callup">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="match-callup" className="text-sm font-semibold">
          Convocatoria
        </h2>
        {published ? <Pill tone="ok">Publicada</Pill> : <Pill tone="neutral">Sin publicar</Pill>}
        {published && can.update && !editing && (
          <Button variant="ghost" size="sm" className="ml-auto gap-1.5" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" aria-hidden="true" />
            Editar convocados
          </Button>
        )}
      </div>

      {editing ? (
        <CallupEditor sheet={sheet} canPublish={can.publish} onDone={() => setEditing(false)} onCancel={published ? () => setEditing(false) : undefined} />
      ) : published ? (
        <CallupTracker sheet={sheet} canPublish={can.publish} />
      ) : (
        <p className="text-sm text-muted-foreground">
          {sheet.callups.length > 0
            ? `${sheet.callups.length} convocados. Falta publicarla para avisar a los jugadores.`
            : 'Todavía no se armó la convocatoria.'}
        </p>
      )}
    </section>
  )
}

/** Elegir convocados entre los habilitados del plantel, con su número de camiseta. */
function CallupEditor({
  sheet,
  canPublish,
  onDone,
  onCancel,
}: {
  sheet: CallupSheet
  canPublish: boolean
  onDone: () => void
  onCancel?: () => void
}) {
  const router = useRouter()
  const current = useMemo(() => new Map(sheet.callups.map((c) => [c.player_id, c.shirt_number])), [sheet.callups])
  // Número como texto mientras se edita; vacío usa el del plantel.
  const [picked, setPicked] = useState<Map<number, string>>(
    () =>
      new Map(
        sheet.squad
          .filter((p) => p.called_up)
          .map((p) => [p.player_id, String(current.get(p.player_id) ?? p.shirt_number ?? '')]),
      ),
  )
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [pending, startTransition] = useTransition()

  const eligible = sheet.squad.filter((p) => p.is_eligible)
  const blocked = sheet.squad.filter((p) => !p.is_eligible)

  const toggle = (id: number, shirt: number | null) => {
    setPicked((prev) => {
      const next = new Map(prev)
      if (next.has(id)) next.delete(id)
      else next.set(id, shirt != null ? String(shirt) : '')
      return next
    })
    setErrors((prev) => ({ ...prev, [id]: '' }))
  }

  // Números repetidos: se marcan antes de mandar.
  const repeated = new Set<number>()
  const seen = new Map<string, number>()
  for (const [id, n] of picked) {
    if (!n.trim()) continue
    if (seen.has(n.trim())) {
      repeated.add(id)
      repeated.add(seen.get(n.trim())!)
    } else seen.set(n.trim(), id)
  }

  const save = (publish: boolean) => {
    const order = eligible.filter((p) => picked.has(p.player_id))
    const players = order.map((p) => {
      const n = picked.get(p.player_id)!.trim()
      return { player_id: p.player_id, shirt_number: n === '' ? null : Number(n) }
    })
    if (players.some((p) => p.shirt_number !== null && (!Number.isInteger(p.shirt_number) || p.shirt_number < 0 || p.shirt_number > 999))) {
      toast.error('Los números de camiseta van de 0 a 999.')
      return
    }
    startTransition(async () => {
      const result: ActionResult = await saveCallupAction(sheet.match_id, players, publish).catch(() => ({ ok: false, error: 'No se pudo guardar. Probá de nuevo.' }))
      if (result.ok) {
        toast.success(result.message)
        setErrors({})
        onDone()
        router.refresh()
        return
      }
      // La API marca `players.<índice>.campo`: se lo muestra al jugador de esa posición.
      const byPlayer: Record<number, string> = {}
      for (const [key, message] of Object.entries(result.fieldErrors ?? {})) {
        const index = Number(key.split('.')[1])
        const player = order[index]
        if (player) byPlayer[player.player_id] = message
      }
      setErrors(byPlayer)
      toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? 'Revisá la lista.')
    })
  }

  if (sheet.squad.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        La categoría no tiene jugadores. Sumalos desde el módulo Jugadores.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>
          <span className="font-display text-2xl font-bold tabular-nums">{picked.size}</span>
          <span className="text-muted-foreground"> convocados de {eligible.length} habilitados</span>
        </span>
        {eligible.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5"
            onClick={() =>
              setPicked(
                picked.size === eligible.length
                  ? new Map()
                  : new Map(eligible.map((p) => [p.player_id, picked.get(p.player_id) ?? (p.shirt_number != null ? String(p.shirt_number) : '')])),
              )
            }
          >
            <Users className="size-4" aria-hidden="true" />
            {picked.size === eligible.length ? 'Ninguno' : 'Todos los habilitados'}
          </Button>
        )}
      </div>

      <ul className="flex flex-col divide-y overflow-hidden rounded-lg border">
        {eligible.map((p) => {
          const on = picked.has(p.player_id)
          const error = errors[p.player_id] || (repeated.has(p.player_id) ? 'Número repetido.' : '')
          return (
            <li key={p.player_id} className={cn('flex items-center gap-3 p-2 pl-3', on && 'bg-primary/5')}>
              <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(p.player_id, p.shirt_number)}
                  className="size-5 shrink-0 accent-primary"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{p.player_name}</span>
                  {error && <span className="text-xs text-destructive">{error}</span>}
                </span>
              </label>
              {on && (
                <Input
                  aria-label={`Número de ${p.player_name}`}
                  inputMode="numeric"
                  value={picked.get(p.player_id)}
                  placeholder="N°"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 3)
                    setPicked((prev) => new Map(prev).set(p.player_id, value))
                  }}
                  aria-invalid={error ? true : undefined}
                  className="h-9 w-16 text-center tabular-nums"
                />
              )}
            </li>
          )
        })}
        {blocked.map((p) => (
          <li key={p.player_id} className="flex items-center gap-3 p-2 pl-3 text-muted-foreground">
            <input type="checkbox" disabled className="size-5 shrink-0" aria-label={`${p.player_name}: no habilitado`} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{p.player_name}</span>
              <span className="text-xs">No habilitado: falta {p.missing.join(', ') || 'completar requisitos'}</span>
            </span>
          </li>
        ))}
      </ul>
      {blocked.length > 0 && (
        <p className="text-xs text-muted-foreground">Los no habilitados se pueden convocar cuando completen los papeles en Habilitación.</p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="ghost" disabled={pending} onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button variant="outline" disabled={pending || repeated.size > 0} onClick={() => save(false)}>
          Guardar
        </Button>
        {canPublish && (
          <Button className="h-11 gap-2" disabled={pending || picked.size === 0 || repeated.size > 0} onClick={() => save(true)}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
            {sheet.published_at ? 'Guardar y volver a publicar' : 'Guardar y publicar'}
          </Button>
        )}
      </div>
    </div>
  )
}

/** Convocatoria publicada: compartir y ver quién confirmó. */
function CallupTracker({ sheet, canPublish }: { sheet: CallupSheet; canPublish: boolean }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [refreshing, startRefresh] = useTransition()
  const [publishing, startPublish] = useTransition()

  const groupUrl = sheet.group_message ? `https://wa.me/?text=${encodeURIComponent(sheet.group_message)}` : null
  const rows = filter === 'all' ? sheet.callups : sheet.callups.filter((c) => c.response === filter)

  const republish = () =>
    startPublish(async () => {
      const result = await publishCallupAction(sheet.match_id).catch(() => ({ ok: false as const, error: 'No se pudo publicar. Probá de nuevo.' }))
      if (result.ok) {
        toast.success('Listo. Avisá en el grupo con los datos nuevos.')
        router.refresh()
      } else toast.error(result.error ?? 'No se pudo publicar.')
    })

  return (
    <div className="flex flex-col gap-4">
      {sheet.updated_after_publish && (
        <div className="flex flex-col gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm sm:flex-row sm:items-center">
          <AlertTriangle className="size-5 shrink-0 text-warning" aria-hidden="true" />
          <p className="flex-1">
            <strong className="font-semibold">Hubo cambios: volvé a avisar.</strong> Cambió la fecha, la hora o el lugar después de publicar.
          </p>
          {canPublish && (
            <Button size="sm" variant="outline" className="gap-1.5" disabled={publishing} onClick={republish}>
              {publishing && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
              Actualizar mensaje
            </Button>
          )}
        </div>
      )}

      {/* Compartir */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {groupUrl && (
          <a href={groupUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: 'lg' }), 'h-12 gap-2 bg-[#25D366] text-base text-white hover:bg-[#1ebe5b]')}>
            <MessageCircle className="size-5" aria-hidden="true" />
            Compartir en el grupo
          </a>
        )}
        {sheet.public_url && (
          <Button variant="outline" size="lg" className="h-12 gap-2" onClick={() => copy(sheet.public_url!, 'Link de la convocatoria copiado.')}>
            <Copy className="size-4" aria-hidden="true" />
            Copiar link
          </Button>
        )}
      </div>

      {/* Respuestas */}
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Filtrar por respuesta">
        <Counter label="Van" value={sheet.going} tone="ok" active={filter === 'going'} onClick={() => setFilter(filter === 'going' ? 'all' : 'going')} />
        <Counter label="No pueden" value={sheet.not_going} tone="bad" active={filter === 'not_going'} onClick={() => setFilter(filter === 'not_going' ? 'all' : 'not_going')} />
        <Counter label="Sin respuesta" value={sheet.pending} tone="neutral" active={filter === 'pending'} onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {sheet.pending > 0 && filter !== 'pending' && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setFilter('pending')}>
            <Send className="size-3.5" aria-hidden="true" />
            Recordar a los que no respondieron
          </Button>
        )}
        {filter !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>
            Ver todos
          </Button>
        )}
        <Button variant="ghost" size="sm" className="ml-auto gap-1.5" disabled={refreshing} onClick={() => startRefresh(() => router.refresh())}>
          <RefreshCw className={cn('size-3.5', refreshing && 'animate-spin')} aria-hidden="true" />
          Actualizar
        </Button>
      </div>
      {filter === 'pending' && sheet.pending > 0 && (
        <p className="text-xs text-muted-foreground">Mandale a cada familia su link por WhatsApp con el botón verde. Si no tiene teléfono, copiá el link y mandáselo.</p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Nadie en esta lista.</p>
      ) : (
        <ul className="flex flex-col divide-y overflow-hidden rounded-lg border">
          {rows.map((row) => (
            <CallupItem key={row.player_id} row={row} />
          ))}
        </ul>
      )}
    </div>
  )
}

function CallupItem({ row }: { row: CallupRow }) {
  const response = RESPONSE[(row.response as CallupResponse) ?? 'pending'] ?? RESPONSE.pending
  return (
    <li className="flex items-center gap-3 p-2 pl-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border font-display text-sm font-bold tabular-nums" aria-hidden="true">
        {row.shirt_number ?? '·'}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{row.player_name}</span>
        <span className="flex flex-wrap items-center gap-1.5">
          <Pill tone={response.tone}>{response.label}</Pill>
          {row.response_note && <span className="truncate text-xs text-muted-foreground">“{row.response_note}”</span>}
        </span>
      </span>
      <div className="flex shrink-0 gap-1">
        {row.whatsapp_url ? (
          <a
            href={row.whatsapp_url}
            target="_blank"
            rel="noopener noreferrer"
            title="Enviar por WhatsApp"
            aria-label={`Enviar a la familia de ${row.player_name} por WhatsApp`}
            className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'size-9 text-[#1ebe5b]')}
          >
            <MessageCircle className="size-4" aria-hidden="true" />
          </a>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          title={row.whatsapp_url ? 'Copiar su link' : 'Sin teléfono: copiar su link'}
          aria-label={`Copiar el link de ${row.player_name}`}
          onClick={() => copy(row.personal_url, `Link de ${row.player_name} copiado.`)}
        >
          <Copy className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </li>
  )
}

function Counter({ label, value, tone, active, onClick }: { label: string; value: number; tone: Tone; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors hover:bg-muted',
        active && 'border-primary ring-1 ring-primary',
      )}
    >
      <span
        className={cn(
          'font-display text-2xl font-bold tabular-nums leading-none',
          tone === 'ok' && 'text-success',
          tone === 'bad' && 'text-destructive',
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </button>
  )
}

function copy(text: string, done: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(done),
    () => toast.error('No se pudo copiar. Mantené apretado el link para copiarlo.'),
  )
}
