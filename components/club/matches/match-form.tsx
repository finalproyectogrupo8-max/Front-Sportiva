'use client'

import { useState } from 'react'
import { saveMatchAction } from '@/app/(app)/c/[club]/partidos/actions'
import { AddressPicker, MapPreview, type Place } from '@/components/club/address-picker'
import { Field, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { FormSelect, Segmented } from '@/components/club/shared'
import { Label } from '@/components/ui/label'
import { SheetFooter } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { Match } from '@/lib/api/matches'
import { toLocalInput } from '@/lib/club-time'

export type CategoryOption = { id: number; label: string }
export type CompetitionOption = { id: number; label: string; category_ids: number[] }
export type VenueOption = { id: number; name: string; address: string; latitude: number | null; longitude: number | null }

const OTHER = 'otro'

/** Link de Google Maps del punto elegido en el buscador (sin coordenadas, lo arma la API con la dirección). */
function mapsUrlFor(place: Place): string {
  return place.latitude != null && place.longitude != null
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.latitude},${place.longitude}`)}`
    : ''
}

const NONE = 'ninguna'

/** Alta y edición de un partido: lo que después ve el jugador en la convocatoria. */
export function MatchForm({
  club,
  match,
  categories,
  competitions,
  venues,
  onDone,
}: {
  club: string
  match: Match | null
  categories: CategoryOption[]
  competitions: CompetitionOption[]
  /** Sedes del club: las activas y la del partido si ya tenía una. */
  venues: VenueOption[]
  onDone: (id?: number) => void
}) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [categoryId, setCategoryId] = useState(String(match?.category_id ?? categories[0]?.id ?? ''))
  const [competitionId, setCompetitionId] = useState(match?.competition_id ? String(match.competition_id) : NONE)
  const [home, setHome] = useState<'1' | '0'>(match ? (match.is_home ? '1' : '0') : '1')
  const [uniform, setUniform] = useState(match?.uniform ?? 'home')
  // De local: una sede del club u "otro lugar". De visitante: la dirección del rival.
  const [venueId, setVenueId] = useState(
    match?.venue_id ? String(match.venue_id) : match && match.venue ? OTHER : String(venues[0]?.id ?? OTHER),
  )
  const [place, setPlace] = useState<Place>({ address: match && !match.venue_id ? match.venue ?? '' : '', latitude: null, longitude: null })
  const useVenue = home === '1' && venueId !== OTHER
  const chosenVenue = venues.find((v) => String(v.id) === venueId)

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
        data.set('venue_id', useVenue ? venueId : '')
        data.set('venue', useVenue ? '' : place.address)
        // Si el lugar no cambió, se conserva el link que ya tenía; si se eligió un punto, sale de ahí.
        data.set('maps_url', useVenue ? '' : mapsUrlFor(place) || (match && !match.venue_id && place.address === match.venue ? match.maps_url ?? '' : ''))
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

        {/* Lugar: de local, una sede del club; si no, se busca la dirección (FRO-39). */}
        {home === '1' && venues.length > 0 && (
          <FormSelect
            id="match-venue-site"
            label="Sede"
            value={venueId}
            onChange={setVenueId}
            options={[...venues.map((v) => ({ value: String(v.id), label: v.name })), { value: OTHER, label: 'Otro lugar…' }]}
          />
        )}
        {useVenue && chosenVenue ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">{chosenVenue.address}</p>
            <MapPreview place={chosenVenue} />
          </div>
        ) : (
          <AddressPicker
            club={club}
            label={home === '1' ? 'Lugar' : 'Dónde se juega (cancha del rival)'}
            placeholder={home === '1' ? 'Calle y número, ciudad' : 'ej. Peña 1501, Banfield'}
            value={place}
            onChange={setPlace}
            error={fieldErrors.venue ?? fieldErrors.maps_url ?? fieldErrors.venue_id}
          />
        )}
        {home === '1' && venues.length === 0 && (
          <p className="-mt-2 text-xs text-muted-foreground">Tip: cargá las sedes del club en Configuración → Sedes y elegilas sin escribir la dirección.</p>
        )}

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
