'use client'

import { useState } from 'react'
import { Pencil, Plus, Power, Trophy } from 'lucide-react'
import {
  deleteSportAction,
  saveSportAction,
  setSportActiveAction,
} from '@/app/(app)/c/[club]/configuracion/actions'
import { Pill } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { SheetFooter } from '@/components/ui/sheet'
import type { Sport } from '@/lib/api/club'
import {
  ConfigSheet,
  ConfigTable,
  ConfirmDialog,
  EmptyConfig,
  Field,
  FormError,
  RowActions,
  SubmitButton,
  useConfigAction,
} from './shared'

export type SportRow = Sport & { categories: number }

export function SportsSection({
  sports,
  can,
}: {
  sports: SportRow[]
  can: { create: boolean; update: boolean; delete: boolean }
}) {
  const [editing, setEditing] = useState<Sport | 'new' | null>(null)
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
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3 text-right">Acciones</th>
            </tr>
          }
        >
          {sports.map((sport) => (
            <tr key={sport.id} className="transition-colors hover:bg-muted/40">
              <td className="px-4 py-3 font-medium">{sport.name}</td>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">{sport.categories}</td>
              <td className="px-4 py-3">
                <Pill tone={sport.is_active ? 'ok' : 'neutral'}>{sport.is_active ? 'Activo' : 'Inactivo'}</Pill>
              </td>
              <td className="px-4 py-3">
                <RowActions>
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
