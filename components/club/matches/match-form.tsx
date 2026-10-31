'use client'

import { useState } from 'react'
import { saveMatchAction } from '@/app/(app)/c/[club]/partidos/actions'
import { Field, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { FormSelect, Segmented } from '@/components/club/shared'
import { Label } from '@/components/ui/label'
import { SheetFooter } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { Match } from '@/lib/api/matches'
import { toLocalInput } from '@/lib/club-time'

export type CategoryOption = { id: number; label: string }
export type CompetitionOption = { id: number; label: string; category_ids: number[] }

const NONE = 'ninguna'

/** Alta y edición de un partido: lo que después ve el jugador en la convocatoria. */
export function MatchForm({
  match,
  categories,
  competitions,
  onDone,
}: {
  match: Match | null
  categories: CategoryOption[]
  competitions: CompetitionOption[]
  onDone: (id?: number) => void
}) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [categoryId, setCategoryId] = useState(String(match?.category_id ?? categories[0]?.id ?? ''))
  const [competitionId, setCompetitionId] = useState(match?.competition_id ? String(match.competition_id) : NONE)
  const [home, setHome] = useState<'1' | '0'>(match ? (match.is_home ? '1' : '0') : '1')
  const [uniform, setUniform] = useState(match?.uniform ?? 'home')

  // Las competencias que juega la categoría elegida.
  const options = competitions.filter((c) => c.category_ids.includes(Number(categoryId)) || String(c.id) === competitionId)

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('category_id', categoryId)
        data.set('competition_id', competitionId === NONE ? '' : competitionId)
        data.set('is_home', home)
        data.set('uniform', uniform === NONE ? '' : uniform)
        execute(() => saveMatchAction(match?.id ?? null, data), (result) => onDone(result.id))
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <FormSelect
              id="match-category"
              label="Categoría"
              value={categoryId}
              onChange={(v) => {
                setCategoryId(v)
                setCompetitionId(NONE)
              }}
              options={categories.map((c) => ({ value: String(c.id), label: c.label }))}
            />
            {fieldErrors.category_id && <p className="text-xs text-destructive">{fieldErrors.category_id}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <FormSelect
              id="match-competition"
              label="Competencia"
              value={competitionId}
              onChange={setCompetitionId}
              options={[{ value: NONE, label: options.length ? 'Amistoso / sin competencia' : 'Sin competencias para esta categoría' }, ...options.map((c) => ({ value: String(c.id), label: c.label }))]}
            />
            {fieldErrors.competition_id && <p className="text-xs text-destructive">{fieldErrors.competition_id}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field id="match-opponent" name="opponent" label="Rival" placeholder="ej. Club Atlético Banfield" defaultValue={match?.opponent} maxLength={120} required autoFocus error={fieldErrors.opponent} />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Condición</span>
            <Segmented
              label="Condición"
              value={home}
              onChange={setHome}
              options={[
                { value: '1', label: 'Local' },
                { value: '0', label: 'Visitante' },
              ]}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="match-date"
            name="match_date"
            type="datetime-local"
            label="Día y hora del partido"
            defaultValue={toLocalInput(match?.match_date)}
            required
            error={fieldErrors.match_date}
          />
          <Field
            id="match-meet"
            name="meet_at"
            type="datetime-local"
            label="Presentación"
            hint="Opcional. A qué hora tienen que estar."
            defaultValue={toLocalInput(match?.meet_at)}
            error={fieldErrors.meet_at}
          />
        </div>

        <Field id="match-venue" name="venue" label="Lugar" placeholder="ej. Estadio Florencio Sola, Banfield" defaultValue={match?.venue ?? ''} maxLength={200} error={fieldErrors.venue} />
        <Field
          id="match-maps"
          name="maps_url"
          // Texto y no "url": se acepta el link pegado sin https:// (lo agrega la acción).
          type="text"
          inputMode="url"
          autoComplete="off"
          label="Link de Google Maps"
          hint="Opcional. Es el botón «Cómo llegar» que ven los jugadores."
          placeholder="https://maps.app.goo.gl/…"
          defaultValue={match?.maps_url ?? ''}
          maxLength={500}
          error={fieldErrors.maps_url}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormSelect
            id="match-uniform"
            label="Camiseta"
            value={uniform}
            onChange={setUniform}
            options={[
              { value: 'home', label: 'Titular' },
              { value: 'away', label: 'Alternativa' },
              { value: NONE, label: 'Sin definir' },
            ]}
          />
          <Field id="match-color" name="uniform_color" label="Color" placeholder="ej. Azul y blanco" defaultValue={match?.uniform_color ?? ''} maxLength={50} error={fieldErrors.uniform_color} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match-bring">Qué llevar</Label>
          <Textarea id="match-bring" name="what_to_bring" rows={2} maxLength={1000} defaultValue={match?.what_to_bring ?? ''} placeholder="ej. Medias azules, canilleras, DNI y agua." />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="match-notes">Notas internas</Label>
          <Textarea id="match-notes" name="notes" rows={2} maxLength={2000} defaultValue={match?.notes ?? ''} placeholder="Solo las ve el cuerpo técnico." />
        </div>
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{match ? 'Guardar cambios' : 'Cargar partido'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}
