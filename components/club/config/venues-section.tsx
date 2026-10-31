'use client'

import { useState } from 'react'
import { ExternalLink, MapPinned, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteVenueAction, saveVenueAction } from '@/app/(app)/c/[club]/configuracion/actions'
import { AddressPicker, MapPreview, type Place } from '@/components/club/address-picker'
import { EmptyConfig } from '@/components/club/empty-state'
import { ConfigSheet, ConfirmDialog, Field, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { Pill } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { SheetFooter } from '@/components/ui/sheet'
import type { Venue } from '@/lib/api/club'

/** Sedes del club: dónde juega de local. Con dirección y punto en el mapa. */
export function VenuesSection({
  club,
  venues,
  can,
}: {
  club: string
  venues: Venue[]
  can: { create: boolean; update: boolean; delete: boolean }
}) {
  const [editing, setEditing] = useState<Venue | 'new' | null>(null)
  const [removing, setRemoving] = useState<Venue | null>(null)

  const addButton = can.create && (
    <Button onClick={() => setEditing('new')} className="gap-2">
      <Plus className="size-4" aria-hidden="true" />
      Nueva sede
    </Button>
  )

  return (
    <section className="flex flex-col gap-4" aria-label="Sedes">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Los lugares donde el club juega de local: la sede principal, un parque deportivo, otra cancha. Al cargar un partido
          de local se elige la sede, y el lugar y el link de Google Maps se completan solos.
        </p>
        {venues.length > 0 && addButton}
      </div>

      {venues.length === 0 ? (
        <EmptyConfig
          icon={MapPinned}
          title="Todavía no cargaste sedes"
          description="Cargá la dirección de la cancha principal y de los otros lugares donde juega el club."
          action={addButton}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {venues.map((v) => (
            <li key={v.id} className="flex flex-col overflow-hidden rounded-xl border bg-card">
              <MapPreview place={{ address: v.address, latitude: v.latitude, longitude: v.longitude }} className="h-40 rounded-none border-0 border-b" />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{v.name}</h3>
                  {!v.is_active && <Pill tone="neutral">Inactiva</Pill>}
                </div>
                <p className="text-sm text-muted-foreground">{v.address}</p>
                <div className="mt-auto flex flex-wrap items-center gap-1 pt-2">
                  {v.maps_url && (
                    <a href={v.maps_url} target="_blank" rel="noopener noreferrer" className="mr-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      Abrir en Google Maps
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  )}
                  {can.update && (
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing(v)}>
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Editar
                    </Button>
                  )}
                  {can.delete && (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setRemoving(v)}>
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      <span className="sr-only sm:not-sr-only">Eliminar</span>
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfigSheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Nueva sede' : 'Editar sede'} wide>
        {editing !== null && <VenueForm club={club} venue={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}
      </ConfigSheet>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`¿Eliminar la sede ${removing?.name ?? ''}?`}
        description="Los partidos ya jugados conservan su lugar. Si tiene partidos programados, primero cambiales el lugar."
        confirmLabel="Eliminar"
        onConfirm={() => deleteVenueAction(removing!.id)}
      />
    </section>
  )
}

function VenueForm({ club, venue, onDone }: { club: string; venue: Venue | null; onDone: () => void }) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [place, setPlace] = useState<Place>({
    address: venue?.address ?? '',
    latitude: venue?.latitude ?? null,
    longitude: venue?.longitude ?? null,
  })
  const [active, setActive] = useState(venue?.is_active ?? true)

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const name = String(new FormData(e.currentTarget).get('name') ?? '')
        execute(() => saveVenueAction(venue?.id ?? null, { name, ...place, is_active: active }), onDone)
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <Field id="venue-name" name="name" label="Nombre" placeholder="ej. Sede principal, Parque deportivo" defaultValue={venue?.name} maxLength={120} required autoFocus error={fieldErrors.name} />
        <AddressPicker club={club} value={place} onChange={setPlace} error={fieldErrors.address ?? fieldErrors.latitude} required />
        {venue && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-primary" />
            Activa (aparece al cargar un partido de local)
          </label>
        )}
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{venue ? 'Guardar cambios' : 'Crear sede'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}
