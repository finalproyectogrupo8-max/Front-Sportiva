'use client'

import { useState } from 'react'
import { saveTrainingAction } from '@/app/(app)/c/[club]/partidos/actions'
import { Field, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { FormSelect } from '@/components/club/shared'
import { Label } from '@/components/ui/label'
import { SheetFooter } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { Training } from '@/lib/api/matches'
import { toLocalInput } from '@/lib/club-time'
import type { CategoryOption } from './match-form'

export function TrainingForm({
  training,
  categories,
  onDone,
}: {
  training: Training | null
  categories: CategoryOption[]
  onDone: () => void
}) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [categoryId, setCategoryId] = useState(String(training?.category_id ?? categories[0]?.id ?? ''))
  const start = toLocalInput(training?.starts_at)
  const end = toLocalInput(training?.ends_at)

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('category_id', categoryId)
        execute(() => saveTrainingAction(training?.id ?? null, data), () => onDone())
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <div className="flex flex-col gap-1.5">
          <FormSelect
            id="training-category"
            label="Categoría"
            value={categoryId}
            onChange={setCategoryId}
            options={categories.map((c) => ({ value: String(c.id), label: c.label }))}
          />
          {fieldErrors.category_id && <p className="text-xs text-destructive">{fieldErrors.category_id}</p>}
        </div>
        <div className="grid grid-cols-[1fr_6.5rem_6.5rem] gap-3">
          <Field id="training-day" name="day" type="date" label="Día" defaultValue={start.slice(0, 10)} required autoFocus error={fieldErrors.day} />
          <Field id="training-from" name="from" type="time" label="Desde" defaultValue={start.slice(11, 16)} required error={fieldErrors.from} />
          <Field id="training-to" name="to" type="time" label="Hasta" defaultValue={end.slice(11, 16)} required error={fieldErrors.to} />
        </div>
        <Field id="training-location" name="location" label="Lugar" placeholder="ej. Cancha 2" defaultValue={training?.location ?? ''} maxLength={150} error={fieldErrors.location} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="training-objectives">Objetivos</Label>
          <Textarea id="training-objectives" name="objectives" rows={3} maxLength={2000} defaultValue={training?.objectives ?? ''} placeholder="ej. Salida desde el fondo, pelota parada." />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="training-notes">Notas</Label>
          <Textarea id="training-notes" name="notes" rows={2} maxLength={2000} defaultValue={training?.notes ?? ''} />
        </div>
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{training ? 'Guardar cambios' : 'Cargar entrenamiento'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}
