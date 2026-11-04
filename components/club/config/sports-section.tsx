'use client'

import { useState, useTransition } from 'react'
import { Check, ListOrdered, Loader2, Pencil, Plus, Power, Trophy, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  deleteSportAction,
  savePositionAction,
  saveSportAction,
  setPositionActiveAction,
  setSportActiveAction,
} from '@/app/(app)/c/[club]/configuracion/actions'
import { Pill } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { SheetFooter } from '@/components/ui/sheet'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import type { ActionResult } from '@/lib/action-result'
import type { Position, Sport } from '@/lib/api/club'
import { ConfigSheet, ConfigTable, ConfirmDialog, Field, FormError, RowActions, SubmitButton, useConfigAction } from '@/components/club/forms'
import { EmptyConfig } from '@/components/club/empty-state'

/** `positions` es null si el usuario no ve las posiciones. */
export type SportRow = Sport & { categories: number | null; positions: Position[] | null }

type Crud = { create: boolean; update: boolean; delete: boolean }

export function SportsSection({
  sports,
  can,
  canPositions,
}: {
  sports: SportRow[]
  can: Crud
  canPositions: Crud
}) {
  const [editing, setEditing] = useState<Sport | 'new' | null>(null)
  const [positionsOf, setPositionsOf] = useState<number | null>(null)
  const showPositions = sports.some((s) => s.positions !== null)
  const managing = sports.find((s) => s.id === positionsOf) ?? null
  const [removing, setRemoving] = useState<Sport | null>(null)
  const toggle = useConfigAction()

  const addButton = can.create && (
    <Button onClick={() => setEditing('new')} className="gap-2">
      <Plus className="size-4" aria-hidden="true" />
      Nuevo deporte
    </Button>
  )

  return (
    <section className="flex flex-col gap-4" aria-label="Deportes">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Los deportes que tiene el club. Cada categoría pertenece a uno. Un deporte desactivado no aparece en los selectores.
          {showPositions && ' Cada deporte tiene sus posiciones: son las que se eligen en la ficha de cada jugador.'}
        </p>
        {sports.length > 0 && addButton}
      </div>

      {sports.length === 0 ? (
        <EmptyConfig
          icon={Trophy}
          title="Todavía no cargaste deportes"
          description="Empezá por los deportes del club, por ejemplo Fútbol o Básquet."
          action={addButton}
        />
      ) : (
        <ConfigTable
          caption="Deportes del club"
          head={
            <tr>
              <th scope="col" className="px-4 py-3">Deporte</th>
              <th scope="col" className="px-4 py-3">Categorías activas</th>
              {showPositions && <th scope="col" className="px-4 py-3">Posiciones</th>}
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3 text-right">Acciones</th>
            </tr>
          }
        >
          {sports.map((sport) => (
            <tr key={sport.id} className="transition-colors hover:bg-muted/40">
              <td className="px-4 py-3 font-medium">{sport.name}</td>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">{sport.categories ?? '—'}</td>
              {showPositions && (
                <td className="px-4 py-3">
                  <PositionChips positions={(sport.positions ?? []).filter((p) => p.is_active)} />
                </td>
              )}
              <td className="px-4 py-3">
                <Pill tone={sport.is_active ? 'ok' : 'neutral'}>{sport.is_active ? 'Activo' : 'Inactivo'}</Pill>
              </td>
              <td className="px-4 py-3">
                <RowActions>
                  {sport.positions !== null && (
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setPositionsOf(sport.id)}>
                      <ListOrdered className="size-3.5" aria-hidden="true" />
                      <span className="sr-only sm:not-sr-only">Posiciones</span>
                    </Button>
                  )}
                  {can.update && (
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing(sport)}>
                      <Pencil className="size-3.5" aria-hidden="true" />
                      <span className="sr-only sm:not-sr-only">Editar</span>
                    </Button>
                  )}
                  {sport.is_active
                    ? can.delete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-destructive hover:text-destructive"
                          onClick={() => setRemoving(sport)}
                        >
                          <Power className="size-3.5" aria-hidden="true" />
                          <span className="sr-only sm:not-sr-only">Desactivar</span>
                        </Button>
                      )
                    : can.update && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5"
                          disabled={toggle.pending}
                          onClick={() => toggle.execute(() => setSportActiveAction(sport.id, true))}
                        >
                          <Power className="size-3.5" aria-hidden="true" />
                          <span className="sr-only sm:not-sr-only">Activar</span>
                        </Button>
                      )}
                </RowActions>
              </td>
            </tr>
          ))}
        </ConfigTable>
      )}

      <ConfigSheet
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === 'new' ? 'Nuevo deporte' : 'Editar deporte'}
      >
        {editing !== null && (
          <SportForm sport={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
        )}
      </ConfigSheet>

      <ConfigSheet
        open={managing !== null}
        onOpenChange={(open) => !open && setPositionsOf(null)}
        title={`Posiciones de ${managing?.name ?? ''}`}
        description="Las que se eligen en la ficha de cada jugador de este deporte. Una posición desactivada deja de aparecer, pero no se borra de los jugadores que ya la tienen."
      >
        {managing && <PositionsManager key={managing.id} sport={managing} can={canPositions} />}
      </ConfigSheet>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`¿Desactivar ${removing?.name ?? 'el deporte'}?`}
        description="Deja de aparecer en los selectores. Los datos se conservan y lo podés volver a activar."
        confirmLabel="Desactivar"
        onConfirm={() => deleteSportAction(removing!.id)}
      />
    </section>
  )
}

function SportForm({ sport, onDone }: { sport: Sport | null; onDone: () => void }) {
  const { pending, fieldErrors, error, execute } = useConfigAction()

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        execute(() => saveSportAction(sport?.id ?? null, data), onDone)
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <Field
          id="sport-name"
          name="name"
          label="Nombre"
          placeholder="ej. Fútbol"
          defaultValue={sport?.name}
          maxLength={80}
          required
          autoFocus
          error={fieldErrors.name}
        />
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{sport ? 'Guardar cambios' : 'Crear deporte'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}

function PositionChips({ positions }: { positions: Position[] }) {
  if (positions.length === 0) return <span className="text-sm text-muted-foreground">Sin cargar</span>
  const shown = positions.slice(0, 5)
  return (
    <ul className="flex flex-wrap gap-1">
      {shown.map((p) => (
        <li key={p.id} className="rounded-md bg-muted px-2 py-0.5 text-xs">
          {p.name}
        </li>
      ))}
      {positions.length > shown.length && <li className="px-1 py-0.5 text-xs text-muted-foreground">+{positions.length - shown.length}</li>}
    </ul>
  )
}

/** Lista de posiciones de un deporte: agregar, renombrar, desactivar y volver a activar. */
function PositionsManager({ sport, can }: { sport: SportRow; can: Crud }) {
  const positions = [...(sport.positions ?? [])].sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name))
  const [adding, setAdding] = useState('')
  const [renaming, setRenaming] = useState<{ id: number; name: string } | null>(null)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const run = (action: () => Promise<ActionResult>, after?: () => void) =>
    startTransition(async () => {
      setError(undefined)
      const result: ActionResult = await action().catch(() => ({ ok: false, error: 'No se pudo guardar. Probá de nuevo.' }))
      if (result.ok) {
        if (result.message) toast.success(result.message)
        after?.()
        router.refresh()
      } else {
        setError(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? 'No se pudo guardar.')
      }
    })

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      {can.create && (
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            run(() => savePositionAction(null, sport.id, adding), () => setAdding(''))
          }}
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="new-position" className="text-sm font-medium">
              Nueva posición
            </label>
            <Input id="new-position" value={adding} onChange={(e) => setAdding(e.target.value)} maxLength={80} placeholder={sport.name === 'Básquet' ? 'ej. Base' : 'ej. Arquero'} autoFocus />
          </div>
          <Button type="submit" className="gap-1.5" disabled={pending || !adding.trim()}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
            Agregar
          </Button>
        </form>
      )}
      <FormError message={error} />

      {positions.length === 0 ? (
        <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">Todavía no hay posiciones para {sport.name}.</p>
      ) : (
        <ul className="flex flex-col divide-y rounded-xl border">
          {positions.map((p) => (
            <li key={p.id} className="flex min-h-12 items-center gap-2 px-3 py-2">
              {renaming?.id === p.id ? (
                <form
                  className="flex flex-1 items-center gap-1.5"
                  onSubmit={(e) => {
                    e.preventDefault()
                    run(() => savePositionAction(p.id, sport.id, renaming.name), () => setRenaming(null))
                  }}
                >
                  <Input value={renaming.name} onChange={(e) => setRenaming({ id: p.id, name: e.target.value })} maxLength={80} aria-label={`Nuevo nombre de ${p.name}`} className="h-8" autoFocus />
                  <Button type="submit" size="icon" variant="ghost" className="size-8" disabled={pending} aria-label="Guardar nombre">
                    <Check className="size-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="size-8" onClick={() => setRenaming(null)} aria-label="Cancelar">
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </form>
              ) : (
                <>
                  <span className={p.is_active ? 'flex-1 text-sm font-medium' : 'flex-1 text-sm text-muted-foreground line-through'}>{p.name}</span>
                  {!p.is_active && <Pill tone="neutral">Inactiva</Pill>}
                  {can.update && p.is_active && (
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5" disabled={pending} onClick={() => setRenaming({ id: p.id, name: p.name })}>
                      <Pencil className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">Renombrar {p.name}</span>
                    </Button>
                  )}
                  {p.is_active
                    ? can.delete && (
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-destructive hover:text-destructive" disabled={pending} onClick={() => run(() => setPositionActiveAction(p.id, false))}>
                          <Power className="size-3.5" aria-hidden="true" />
                          <span className="sr-only sm:not-sr-only">Desactivar</span>
                        </Button>
                      )
                    : can.update && (
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5" disabled={pending} onClick={() => run(() => setPositionActiveAction(p.id, true))}>
                          <Power className="size-3.5" aria-hidden="true" />
                          <span className="sr-only sm:not-sr-only">Activar</span>
                        </Button>
                      )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
