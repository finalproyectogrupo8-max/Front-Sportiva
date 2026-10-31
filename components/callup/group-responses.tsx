'use client'

import { useEffect, useState, useTransition } from 'react'
import { Check, ChevronRight, Loader2, X } from 'lucide-react'
import { respondFromGroupAction } from '@/app/(app)/convocatoria/actions'
import { Textarea } from '@/components/ui/textarea'
import type { CallupAnswer, PublicPlayer } from '@/lib/api/public-callups'
import { cn } from '@/lib/utils'

const LABEL = { going: 'Va', not_going: 'No puede', pending: 'Sin responder' } as const

/**
 * Link del grupo (FRO-36): la lista de convocados. Cada uno toca su nombre y elige "Voy" o
 * "No puedo", como en una encuesta de WhatsApp. El navegador recuerda quién respondió.
 */
export function GroupResponses({ token, initial, closed }: { token: string; initial: PublicPlayer[]; closed: boolean }) {
  const [players, setPlayers] = useState(initial)
  const [open, setOpen] = useState<number | null>(null)
  const [mine, setMine] = useState<number | null>(null)
  const [reasonFor, setReasonFor] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const storageKey = `sportiva:convocatoria:${token}`

  // Quién respondió desde este celular (solo para marcarlo; no es un dato que importe perder).
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(storageKey))
      // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee del navegador después de montar
      if (saved) setMine(saved)
    } catch {}
  }, [storageKey])

  const going = players.filter((p) => p.response === 'going').length
  const notGoing = players.filter((p) => p.response === 'not_going').length
  const waiting = players.length - going - notGoing

  const answer = (id: number, response: CallupAnswer) =>
    startTransition(async () => {
      setError('')
      const result = await respondFromGroupAction(token, id, response, response === 'not_going' ? note : '')
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPlayers(result.players)
      setMine(id)
      setOpen(null)
      setReasonFor(null)
      setNote('')
      try {
        localStorage.setItem(storageKey, String(id))
      } catch {}
    })

  const me = players.find((p) => p.id === mine)

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5" aria-labelledby="group-title">
      <div className="flex flex-col gap-1">
        <h2 id="group-title" className="text-base font-semibold">
          {closed ? 'Convocados' : '¿Vas? Tocá tu nombre'}
        </h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-success">{going} van</span> · <span className="font-medium text-destructive">{notGoing} no pueden</span> ·{' '}
          {waiting} sin responder
        </p>
      </div>

      {me && me.response !== 'pending' && (
        <p role="status" className={cn('rounded-lg p-3 text-sm', me.response === 'going' ? 'bg-success/12 text-success' : 'bg-destructive/10 text-destructive')}>
          {me.response === 'going' ? `¡Listo! ${me.name} va al partido.` : `Avisamos que ${me.name} no puede ir.`} El profe ya lo ve.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {players.map((p) => {
          const isOpen = open === p.id
          return (
            <li key={p.id} className={cn('rounded-lg border transition-colors', isOpen && 'border-primary/50 bg-primary/5', p.id === mine && !isOpen && 'border-primary/30')}>
              <button
                type="button"
                disabled={closed}
                onClick={() => {
                  setOpen(isOpen ? null : p.id)
                  setReasonFor(null)
                  setError('')
                }}
                aria-expanded={isOpen}
                className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left disabled:cursor-default"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-display text-sm font-bold tabular-nums">
                  {p.shirt_number ?? '·'}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                <Status response={p.response} />
                {!closed && <ChevronRight className={cn('size-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-90')} aria-hidden="true" />}
              </button>

              {isOpen && (
                <div className="flex flex-col gap-3 border-t px-3 py-3">
                  {reasonFor === p.id ? (
                    <>
                      <label htmlFor={`note-${p.id}`} className="text-sm font-medium">
                        ¿Por qué no puede? <span className="font-normal text-muted-foreground">(opcional, lo ve solo el profe)</span>
                      </label>
                      <Textarea
                        id={`note-${p.id}`}
                        rows={2}
                        maxLength={255}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="ej. Está lesionado, viaje familiar…"
                        autoFocus
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" disabled={pending} onClick={() => setReasonFor(null)} className="h-11 rounded-lg border text-sm font-medium hover:bg-muted">
                          Volver
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => answer(p.id, 'not_going')}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-destructive text-sm font-semibold text-white disabled:opacity-70"
                        >
                          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                          Avisar
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => answer(p.id, 'going')}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-success text-base font-bold text-white active:scale-[.98] disabled:opacity-70"
                      >
                        {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Check className="size-5" aria-hidden="true" />}
                        Voy
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setReasonFor(p.id)}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-destructive/40 text-base font-bold text-destructive active:scale-[.98] disabled:opacity-70"
                      >
                        <X className="size-5" aria-hidden="true" />
                        No puedo
                      </button>
                    </div>
                  )}
                  {error && (
                    <p role="alert" className="text-sm text-destructive">
                      {error}
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {closed && <p className="text-sm text-muted-foreground">Este partido ya no recibe respuestas.</p>}
    </section>
  )
}

function Status({ response }: { response: PublicPlayer['response'] }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        response === 'going' && 'bg-success/12 text-success',
        response === 'not_going' && 'bg-destructive/10 text-destructive',
        response === 'pending' && 'bg-muted text-muted-foreground',
      )}
    >
      {response === 'going' && <Check className="size-3" aria-hidden="true" />}
      {response === 'not_going' && <X className="size-3" aria-hidden="true" />}
      {LABEL[response]}
    </span>
  )
}
