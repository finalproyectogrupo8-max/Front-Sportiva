'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Check, Plus } from 'lucide-react'
import { createPlayerAction, updatePlayerAction } from '@/app/(app)/c/[club]/jugadores/actions'
import { ConfigSheet, Field, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { FormSelect } from '@/components/club/shared'
import { GENDERS } from '@/lib/branches'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SheetFooter } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { Player } from '@/lib/api/players'
import { cn } from '@/lib/utils'
import { DOMINANT_SIDE, PLAYER_STATUS, POSITION_SUGGESTIONS, playerPositions, type PositionOption } from '@/lib/player-labels'

const NONE = 'ninguno'

/** Botón "Nueva ficha": el alta en un panel. Al crear, abre la ficha del jugador. */
export function NewPlayerButton({ categories, positions = [] }: { categories: CategoryOption[]; positions?: PositionOption[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [open, setOpen] = useState(params.get('nuevo') === '1')

  const close = (id?: number) => {
    setOpen(false)
    const sp = new URLSearchParams(params.toString())
    sp.delete('nuevo')
    if (id) sp.set('id', String(id))
    const qs = sp.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="size-4" aria-hidden="true" />
        Nueva ficha
      </Button>
      <ConfigSheet
        open={open}
        onOpenChange={(o) => (o ? setOpen(true) : close())}
        title="Nueva ficha de jugador"
        description="Con la fecha de nacimiento se sabe qué papeles se le piden (por ejemplo, la autorización de los padres)."
      >
        <PlayerForm player={null} categories={categories} positions={positions} onDone={(id) => close(id)} />
      </ConfigSheet>
    </>
  )
}

type CategoryOption = { id: number; label: string; sport_id?: number }

export function PlayerForm({
  player,
  categories = [],
  positions = [],
  onDone,
}: {
  player: Player | null
  categories?: CategoryOption[]
  positions?: PositionOption[]
  onDone: (id?: number) => void
}) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [side, setSide] = useState(player?.dominant_side ?? NONE)
  const [status, setStatus] = useState(player?.status ?? 'active')
  const [gender, setGender] = useState<string>(player?.gender ?? NONE)
  const [category, setCategory] = useState(NONE)
  const [chosen, setChosen] = useState<number[]>(() => (player ? playerPositions(player).map((p) => p.id) : []))
  const today = new Date().toISOString().slice(0, 10)

  // Deporte del jugador: el de la categoría elegida (alta) o el de sus categorías actuales (edición).
  const sportOf = new Map(categories.map((c) => [c.id, c.sport_id]))
  const playerSports = new Set(
    (player ? (player.memberships ?? []).filter((m) => !m.end_date).map((m) => sportOf.get(m.category_id)) : [sportOf.get(Number(category))]).filter((id): id is number => id !== undefined),
  )
  const offered = positions.filter((p) => playerSports.size === 0 || playerSports.has(p.sport_id) || chosen.includes(p.id))
  const usesPositions = positions.length > 0
  const groups = [...new Set(offered.map((p) => p.sport))].map((sport) => ({ sport, items: offered.filter((p) => p.sport === sport) }))
  const firstChosen = positions.find((p) => p.id === chosen[0])?.name

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('dominant_side', side === NONE ? '' : side)
        data.set('gender', gender === NONE ? '' : gender)
        if (usesPositions) {
          data.set('positions_field', '1')
          data.delete('position_ids')
          chosen.forEach((id) => data.append('position_ids', String(id)))
          // La posición principal (la que se ve en la lista) es la primera que se eligió.
          data.set('preferred_position', firstChosen ?? '')
        }
        if (player) {
          data.set('status', status)
          execute(() => updatePlayerAction(player.id, data), () => onDone())
        } else {
          data.set('category_id', category === NONE ? '' : category)
          execute(() => createPlayerAction(data), (result) => onDone(result.id))
        }
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="player-first" name="first_name" label="Nombre" defaultValue={player?.first_name} maxLength={100} required autoFocus error={fieldErrors.first_name} />
          <Field id="player-last" name="last_name" label="Apellido" defaultValue={player?.last_name} maxLength={100} required error={fieldErrors.last_name} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="player-birth"
            name="birth_date"
            type="date"
            label="Fecha de nacimiento"
            defaultValue={player?.birth_date ?? ''}
            max={today}
            min="1900-01-02"
            required
            error={fieldErrors.birth_date}
          />
          <Field id="player-dni" name="document_number" label="DNI" inputMode="numeric" defaultValue={player?.document_number ?? ''} maxLength={30} error={fieldErrors.document_number} />
        </div>
        {usesPositions && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Posiciones</legend>
            {groups.map((g) => (
              <div key={g.sport} className="flex flex-col gap-1.5">
                {groups.length > 1 && <span className="text-xs text-muted-foreground">{g.sport}</span>}
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((p) => {
                    const on = chosen.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setChosen((prev) => (on ? prev.filter((id) => id !== p.id) : [...prev, p.id]))}
                        className={cn(
                          'inline-flex h-8 items-center gap-1 rounded-full border px-3 text-sm transition',
                          on ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary/40',
                        )}
                      >
                        {on && <Check className="size-3.5" aria-hidden="true" />}
                        {p.name}
                        {on && chosen[0] === p.id && chosen.length > 1 && <span className="text-[10px] uppercase opacity-80">principal</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              {playerSports.size === 0 && !player ? 'Elegí la categoría para ver solo las posiciones de su deporte. ' : ''}La primera que marques es la principal. Se cargan en Configuración → Deportes.
            </p>
            {fieldErrors.position_ids && <p className="text-xs text-destructive">{fieldErrors.position_ids}</p>}
          </fieldset>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {!usesPositions && (
            <>
              <Field
                id="player-position"
                name="preferred_position"
                label="Puesto"
                list="player-positions"
                placeholder="ej. Base, Arquero…"
                defaultValue={player?.preferred_position ?? ''}
                maxLength={50}
                error={fieldErrors.preferred_position}
              />
              <datalist id="player-positions">
                {POSITION_SUGGESTIONS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </>
          )}
          <FormSelect
            id="player-gender"
            label="Género"
            value={gender}
            onChange={setGender}
            options={[{ value: NONE, label: 'Sin dato' }, ...Object.entries(GENDERS).map(([value, label]) => ({ value, label }))]}
          />
          <FormSelect
            id="player-side"
            label="Perfil hábil"
            value={side}
            onChange={setSide}
            options={[{ value: NONE, label: 'Sin dato' }, ...Object.entries(DOMINANT_SIDE).map(([value, label]) => ({ value, label }))]}
          />
        </div>
        <Field
          id="player-registration"
          name="registration_number"
          label="Número de ficha federativa"
          defaultValue={player?.registration_number ?? ''}
          maxLength={50}
          error={fieldErrors.registration_number}
        />

        {player ? (
          <FormSelect
            id="player-status"
            label="Estado"
            value={status}
            onChange={setStatus}
            options={Object.entries(PLAYER_STATUS).map(([value, s]) => ({ value, label: s.label }))}
          />
        ) : (
          categories.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
              <div className="flex flex-col gap-1.5">
                <FormSelect
                  id="player-category"
                  label="Categoría"
                  value={category}
                  onChange={setCategory}
                  options={[{ value: NONE, label: 'Después' }, ...categories.map((c) => ({ value: String(c.id), label: c.label }))]}
                />
              </div>
              <Field
                id="player-number"
                name="shirt_number"
                type="number"
                inputMode="numeric"
                label="Número"
                min={0}
                max={999}
                disabled={category === NONE}
              />
            </div>
          )
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="player-notes">Notas</Label>
          <Textarea
            id="player-notes"
            name="notes"
            rows={3}
            maxLength={2000}
            defaultValue={player?.notes ?? ''}
            placeholder="Datos útiles para el cuerpo técnico. Nada médico: eso va en sus papeles."
          />
          {fieldErrors.notes && <p className="text-xs text-destructive">{fieldErrors.notes}</p>}
        </div>
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{player ? 'Guardar cambios' : 'Crear ficha'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}
