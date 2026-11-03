'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { deleteMatchAction, saveResultAction } from '@/app/(app)/c/[club]/partidos/actions'
import { ConfigSheet, ConfirmDialog, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { FormSelect } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Match } from '@/lib/api/matches'
import { MatchForm, type CategoryOption, type CompetitionOption, type VenueOption } from './match-form'

/** Resultado y estado del partido. */
export function ResultForm({ match }: { match: Match }) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [status, setStatus] = useState(match.status)

  return (
    <form
      className="flex flex-col gap-4 rounded-xl border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('status', status)
        execute(() => saveResultAction(match.id, data))
      }}
    >
      <h2 className="text-sm font-semibold">Resultado</h2>
      <fieldset disabled={pending} className="flex flex-col gap-4">
        <FormSelect
          id="match-status"
          label="Estado"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'scheduled', label: 'Programado' },
            { value: 'played', label: 'Jugado' },
            { value: 'postponed', label: 'Postergado' },
            { value: 'cancelled', label: 'Suspendido' },
          ]}
        />
        {status === 'played' && (
          <div className="flex items-end gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="our-score">Nosotros</Label>
              <Input id="our-score" name="our_score" type="number" inputMode="numeric" min={0} max={999} defaultValue={match.our_score ?? ''} className="h-12 text-center font-display text-2xl" aria-invalid={fieldErrors.our_score ? true : undefined} />
            </div>
            <span className="pb-3 text-muted-foreground" aria-hidden="true">–</span>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="their-score" className="truncate">{match.opponent}</Label>
              <Input id="their-score" name="opponent_score" type="number" inputMode="numeric" min={0} max={999} defaultValue={match.opponent_score ?? ''} className="h-12 text-center font-display text-2xl" />
            </div>
          </div>
        )}
        {(fieldErrors.our_score || fieldErrors.opponent_score || fieldErrors.status) && (
          <p className="text-xs text-destructive">{fieldErrors.our_score ?? fieldErrors.opponent_score ?? fieldErrors.status}</p>
        )}
        <FormError message={error} />
        <SubmitButton pending={pending}>Guardar</SubmitButton>
      </fieldset>
    </form>
  )
}

/** Editar y eliminar el partido. */
export function MatchActions({
  club,
  match,
  backHref,
  categories,
  competitions,
  venues,
  can,
}: {
  club: string
  venues: VenueOption[]
  match: Match
  backHref: string
  categories: CategoryOption[]
  competitions: CompetitionOption[]
  can: { update: boolean; delete: boolean }
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  if (!can.update && !can.delete) return null

  return (
    <div className="flex gap-1">
      {can.update && (
        <Button variant="outline" className="gap-1.5" onClick={() => setEditing(true)}>
          <Pencil className="size-4" aria-hidden="true" />
          Editar datos
        </Button>
      )}
      {can.delete && (
        <Button variant="ghost" className="ml-auto gap-1.5 text-destructive hover:text-destructive" onClick={() => setRemoving(true)}>
          <Trash2 className="size-4" aria-hidden="true" />
          Eliminar
        </Button>
      )}
      <ConfigSheet open={editing} onOpenChange={setEditing} title="Editar partido" wide>
        <MatchForm club={club} venues={venues} match={match} categories={categories} competitions={competitions} onDone={() => setEditing(false)} />
      </ConfigSheet>
      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title={`¿Eliminar el partido contra ${match.opponent}?`}
        description="Deja de aparecer en el calendario. Si solo se pasó de fecha, mejor marcalo como Postergado."
        confirmLabel="Eliminar"
        onConfirm={async () => {
          const result = await deleteMatchAction(match.id)
          if (result.ok) router.replace(backHref)
          return result
        }}
      />
    </div>
  )
}
