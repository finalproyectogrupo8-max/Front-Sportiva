'use client'

import { useState } from 'react'
import { CalendarRange, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteSeasonAction, saveSeasonAction } from '@/app/(app)/c/[club]/configuracion/actions'
import { FormSelect, Pill, type Tone } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { SheetFooter } from '@/components/ui/sheet'
import type { Season, SportOption } from '@/lib/api/club'
import { formatDay } from '@/lib/format-date'
import { ConfigSheet, ConfigTable, ConfirmDialog, Field, FormError, RowActions, SubmitButton, useConfigAction } from '@/components/club/forms'
import { EmptyConfig } from '@/components/club/empty-state'

export const SEASON_STATUS: Record<string, { label: string; tone: Tone }> = {
  active: { label: 'En curso', tone: 'ok' },
  planned: { label: 'Planificada', tone: 'info' },
  closed: { label: 'Cerrada', tone: 'neutral' },
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'En curso (la actual)' },
  { value: 'planned', label: 'Planificada' },
  { value: 'closed', label: 'Cerrada' },
]

export type SeasonRow = Season & { categories: number }

/** Valor del selector para una temporada de todo el club (sin deporte). */
const CLUB = 'club'

export function SeasonsSection({
  seasons,
  sports,
  sportRequired,
  can,
}: {
  seasons: SeasonRow[]
  /** Deportes que puede elegir al crear o editar. */
  sports: SportOption[]
  /** Con alcance "sus deportes" (coordinador) no puede crear temporadas de todo el club. */
  sportRequired: boolean
  can: { create: boolean; update: boolean; delete: boolean }
}) {
  const [editing, setEditing] = useState<Season | 'new' | null>(null)
  const [removing, setRemoving] = useState<Season | null>(null)

  const addButton = can.create && (
    <Button onClick={() => setEditing('new')} className="gap-2">
      <Plus className="size-4" aria-hidden="true" />
      Nueva temporada
    </Button>
  )

  return (
    <section className="flex flex-col gap-4" aria-label="Temporadas">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Cada deporte arma sus temporadas con sus categorías y competencias. Una temporada de todo el club la puede usar cualquier deporte.
        </p>
        {seasons.length > 0 && addButton}
      </div>

      {seasons.length === 0 ? (
        <EmptyConfig
          icon={CalendarRange}
          title="Todavía no cargaste temporadas"
          description="Creá la temporada en curso con sus fechas de inicio y fin."
          action={addButton}
        />
      ) : (
        <ConfigTable
          caption="Temporadas del club"
          head={
            <tr>
              <th scope="col" className="px-4 py-3">Temporada</th>
              <th scope="col" className="px-4 py-3">Deporte</th>
              <th scope="col" className="hidden px-4 py-3 sm:table-cell">Fechas</th>
              <th scope="col" className="hidden px-4 py-3 md:table-cell">Categorías</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3 text-right">Acciones</th>
            </tr>
          }
        >
          {seasons.map((season) => {
            const status = SEASON_STATUS[season.status] ?? { label: season.status, tone: 'neutral' as Tone }
            // El coordinador ve las temporadas de todo el club, pero solo cambia las de su deporte.
            const changeable = !sportRequired || season.sport_id != null
            return (
              <tr key={season.id} className="transition-colors hover:bg-muted/40">
                <td className="px-4 py-3">
                  <span className="font-medium">{season.name}</span>
                  <span className="block text-xs text-muted-foreground sm:hidden">
                    {formatDay(season.start_date)} – {formatDay(season.end_date)}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{season.sport?.name ?? 'Todo el club'}</td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground sm:table-cell">
                  {formatDay(season.start_date)} – {formatDay(season.end_date)}
                </td>
                <td className="hidden px-4 py-3 tabular-nums text-muted-foreground md:table-cell">{season.categories}</td>
                <td className="px-4 py-3">
                  <Pill tone={status.tone}>{status.label}</Pill>
                </td>
                <td className="px-4 py-3">
                  <RowActions>
                    {can.update && changeable && (
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing(season)}>
                        <Pencil className="size-3.5" aria-hidden="true" />
                        <span className="sr-only sm:not-sr-only">Editar</span>
                      </Button>
                    )}
                    {can.delete && changeable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => setRemoving(season)}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        <span className="sr-only sm:not-sr-only">Eliminar</span>
                      </Button>
                    )}
                  </RowActions>
                </td>
              </tr>
            )
          })}
        </ConfigTable>
      )}

      <ConfigSheet
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === 'new' ? 'Nueva temporada' : 'Editar temporada'}
      >
        {editing !== null && (
          <SeasonForm
            season={editing === 'new' ? null : editing}
            sports={sports}
            sportRequired={sportRequired}
            onDone={() => setEditing(null)}
          />
        )}
      </ConfigSheet>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`¿Eliminar la temporada ${removing?.name ?? ''}?`}
        description="Solo se puede eliminar una temporada sin categorías. Si ya terminó, conviene marcarla como cerrada."
        confirmLabel="Eliminar"
        onConfirm={() => deleteSeasonAction(removing!.id)}
      />
    </section>
  )
}

function SeasonForm({
  season,
  sports,
  sportRequired,
  onDone,
}: {
  season: Season | null
  sports: SportOption[]
  sportRequired: boolean
  onDone: () => void
}) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [status, setStatus] = useState(season?.status ?? 'active')
  const [sportId, setSportId] = useState(
    season?.sport_id ? String(season.sport_id) : sportRequired ? String(sports[0]?.id ?? '') : CLUB,
  )
  const sportOptions = [
    ...(sportRequired ? [] : [{ value: CLUB, label: 'Todo el club' }]),
    ...sports.map((s) => ({ value: String(s.id), label: s.name })),
  ]
  const year = new Date().getFullYear()

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('status', status)
        data.set('sport_id', sportId === CLUB ? '' : sportId)
        execute(() => saveSeasonAction(season?.id ?? null, data), onDone)
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <div className="flex flex-col gap-1.5">
          <FormSelect id="season-sport" label="Deporte" value={sportId} onChange={setSportId} options={sportOptions} />
          {fieldErrors.sport_id && <p className="text-xs text-destructive">{fieldErrors.sport_id}</p>}
        </div>
        <Field
          id="season-name"
          name="name"
          label="Nombre"
          placeholder={`ej. Temporada ${year}`}
          defaultValue={season?.name}
          maxLength={80}
          required
          autoFocus
          error={fieldErrors.name}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="season-start"
            name="start_date"
            type="date"
            label="Inicio"
            defaultValue={season?.start_date}
            required
            error={fieldErrors.start_date}
          />
          <Field
            id="season-end"
            name="end_date"
            type="date"
            label="Fin"
            defaultValue={season?.end_date}
            required
            error={fieldErrors.end_date}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <FormSelect id="season-status" label="Estado" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          {fieldErrors.status && <p className="text-xs text-destructive">{fieldErrors.status}</p>}
        </div>
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{season ? 'Guardar cambios' : 'Crear temporada'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}
