'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import { respondAction } from '@/app/(app)/convocatoria/actions'
import { Textarea } from '@/components/ui/textarea'
import type { PublicMe } from '@/lib/api/public-callups'
import { cn } from '@/lib/utils'

/** Confirmación del jugador: "Voy" en un toque; "No puedo" con motivo opcional. Se puede cambiar. */
export function ResponseForm({ token, initial, closed }: { token: string; initial: PublicMe; closed: boolean }) {
  const [me, setMe] = useState(initial)
  const [askingReason, setAskingReason] = useState(false)
  const [note, setNote] = useState(initial.note ?? '')
  const [changing, setChanging] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const send = (response: 'going' | 'not_going') =>
    startTransition(async () => {
      setError('')
      const result = await respondAction(token, response, response === 'not_going' ? note : '')
      if (result.ok) {
        setMe(result.me)
        setAskingReason(false)
        setChanging(false)
      } else setError(result.error)
    })

  const answered = me.response !== 'pending' && !changing

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm" aria-labelledby="response-title">
      {answered ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center" role="status">
          <span
            className={cn(
              'flex size-14 items-center justify-center rounded-full text-white',
              me.response === 'going' ? 'bg-success' : 'bg-destructive',
            )}
          >
            {me.response === 'going' ? <Check className="size-7" aria-hidden="true" /> : <X className="size-7" aria-hidden="true" />}
          </span>
          <h2 id="response-title" className="text-lg font-semibold">
            {me.response === 'going' ? `¡Listo! ${me.name} va al partido.` : `Avisamos que ${me.name} no puede ir.`}
          </h2>
          {me.response === 'not_going' && me.note && <p className="text-sm text-muted-foreground">“{me.note}”</p>}
          <p className="text-sm text-muted-foreground">El profe ya lo ve en la convocatoria.</p>
          {!closed && (
            <button type="button" onClick={() => setChanging(true)} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Cambiar respuesta
            </button>
          )}
        </div>
      ) : closed ? (
        <p id="response-title" className="text-center text-sm text-muted-foreground">
          Este partido ya no recibe respuestas.
        </p>
      ) : (
        <>
          <h2 id="response-title" className="text-center text-lg font-semibold">
            ¿{me.name} va al partido?
          </h2>
          {askingReason ? (
            <div className="flex flex-col gap-3">
              <label htmlFor="callup-note" className="text-sm font-medium">
                ¿Por qué no puede? <span className="font-normal text-muted-foreground">(opcional)</span>
              </label>
              <Textarea
                id="callup-note"
                rows={2}
                maxLength={255}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ej. Está lesionado, viaje familiar…"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setAskingReason(false)}
                  className="h-12 rounded-xl border text-sm font-medium hover:bg-muted"
                >
                  Volver
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => send('not_going')}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-destructive text-sm font-semibold text-white disabled:opacity-70"
                >
                  {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  Avisar que no puede
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => send('going')}
                className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl bg-success text-lg font-bold text-white shadow-sm active:scale-[.98] disabled:opacity-70"
              >
                {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Check className="size-6" aria-hidden="true" />}
                Voy
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setAskingReason(true)}
                className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border-2 border-destructive/40 text-lg font-bold text-destructive active:scale-[.98] disabled:opacity-70"
              >
                <X className="size-6" aria-hidden="true" />
                No puedo
              </button>
            </div>
          )}
          {changing && (
            <button type="button" onClick={() => setChanging(false)} className="text-sm text-muted-foreground hover:underline">
              Dejar como estaba
            </button>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
