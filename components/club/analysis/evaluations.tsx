'use client'

import { useState } from 'react'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import { deleteEvaluationAction, saveEvaluationAction } from '@/app/(app)/c/[club]/analisis/actions'
import { EmptyConfig } from '@/components/club/empty-state'
import { ConfigSheet, ConfirmDialog, Field, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { FormSelect } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { longDate, metricKey, type Can, type Evaluation, type Named } from './shared'

/** Pruebas habituales, para no tipear el nombre y la unidad cada vez. */
const PRESETS = [
  { name: 'Velocidad 30 m', unit: 's' },
  { name: 'Salto vertical', unit: 'cm' },
  { name: 'Resistencia (Course Navette)', unit: 'etapa' },
  { name: 'Flexibilidad', unit: 'cm' },
  { name: 'Peso', unit: 'kg' },
  { name: 'Altura', unit: 'cm' },
]

/** Evaluaciones cargadas, de la más nueva a la más vieja, con editar y eliminar. */
export function EvaluationList({
  evaluations,
  players,
  coaches,
  can,
  showPlayer = true,
  newFor,
}: {
  evaluations: Evaluation[]
  players: Named[]
  coaches: Named[]
  can: Can
  showPlayer?: boolean
  /** Jugador elegido de entrada en "Nueva evaluación" (desde su ficha). */
  newFor?: number
}) {
  const [editing, setEditing] = useState<Evaluation | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Evaluation | null>(null)

  return (
    <div className="flex flex-col gap-3">
      {can.create && (
        <Button className="w-fit gap-2" onClick={() => setEditing('new')} disabled={players.length === 0}>
          <Plus className="size-4" aria-hidden="true" />
          Nueva evaluación
        </Button>
      )}

      {evaluations.length === 0 ? (
        <EmptyConfig
          icon={ClipboardList}
          title="Sin evaluaciones físicas"
          description="Cargá las pruebas (velocidad, salto, resistencia…) para seguir la evolución de cada jugador."
        />
      ) : (
        <ul className="flex flex-col divide-y rounded-xl border bg-card" aria-label="Evaluaciones cargadas">
          {evaluations.map((e) => (
            <li key={e.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium">{showPlayer ? e.player_name : longDate(e.evaluated_at)}</span>
                  <span className="text-xs text-muted-foreground">
                    {showPlayer ? longDate(e.evaluated_at) : ''}
                    {e.evaluator_name ? `${showPlayer ? ' · ' : ''}Evaluó ${e.evaluator_name}` : ''}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1">
                  {can.update && (
                    <Button variant="ghost" size="sm" onClick={() => setEditing(e)}>
                      Editar
                    </Button>
                  )}
                  {can.delete && (
                    <Button variant="ghost" size="icon-sm" aria-label={`Eliminar la evaluación de ${e.player_name ?? 'este jugador'}`} onClick={() => setDeleting(e)}>
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {(e.measurements ?? []).map((m) => (
                  <li key={m.metric_key} className="rounded-md bg-muted px-2 py-1 text-xs">
                    {m.metric_name} <span className="font-semibold tabular-nums">{m.numeric_value ?? m.text_value}</span> {m.unit}
                  </li>
                ))}
              </ul>
              {e.summary && <p className="text-sm text-muted-foreground">{e.summary}</p>}
            </li>
          ))}
        </ul>
      )}

      {editing !== null && (
        <EvaluationSheet
          key={editing === 'new' ? 'new' : editing.id}
          evaluation={editing === 'new' ? null : editing}
          initialPlayerId={editing === 'new' ? newFor : undefined}
          players={players}
          coaches={coaches}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar evaluación"
        description={`Se elimina la evaluación de ${deleting?.player_name ?? ''} con todas sus pruebas.`}
        confirmLabel="Eliminar"
        onConfirm={() => deleteEvaluationAction(deleting!.id)}
      />
    </div>
  )
}

type Row = { name: string; value: string; unit: string }
const EMPTY_ROW: Row = { name: '', value: '', unit: '' }

function EvaluationSheet({
  evaluation,
  initialPlayerId,
  players,
  coaches,
  onClose,
}: {
  evaluation: Evaluation | null
  initialPlayerId?: number
  players: Named[]
  coaches: Named[]
  onClose: () => void
}) {
  const [playerId, setPlayerId] = useState(String(evaluation?.player_id ?? initialPlayerId ?? ''))
  const [coachId, setCoachId] = useState(String(evaluation?.evaluator_coach_id ?? ''))
  const [rows, setRows] = useState<Row[]>(
    evaluation?.measurements?.length
      ? evaluation.measurements.map((m) => ({ name: m.metric_name, value: String(m.numeric_value ?? m.text_value ?? ''), unit: m.unit ?? '' }))
      : [EMPTY_ROW],
  )
  const { pending, error, fieldErrors, execute } = useConfigAction()
  const update = (i: number, patch: Partial<Row>) => setRows((all) => all.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const addPreset = (preset: { name: string; unit: string }) =>
    setRows((all) => {
      if (all.some((r) => r.name === preset.name)) return all
      const empty = all.findIndex((r) => !r.name && !r.value)
      const row = { name: preset.name, value: '', unit: preset.unit }
      return empty >= 0 ? all.map((r, j) => (j === empty ? row : r)) : [...all, row]
    })
  const rowError = (i: number) => Object.entries(fieldErrors).find(([k]) => k.startsWith(`measurements.${i}.`))?.[1]

  return (
    <ConfigSheet open onOpenChange={(o) => !o && onClose()} title={evaluation ? 'Editar evaluación' : 'Nueva evaluación física'} description="Una fila por prueba. Si el resultado no es un número, se guarda como texto." wide>
      <form
        className="flex flex-col gap-4 px-4 pb-4"
        onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          const measurements = rows
            .filter((r) => r.name.trim() && r.value.trim())
            .map((r) => {
              const numeric = Number(r.value.replace(',', '.'))
              const isNumber = Number.isFinite(numeric)
              return {
                metric_key: metricKey(r.name),
                metric_name: r.name.trim(),
                numeric_value: isNumber ? numeric : null,
                text_value: isNumber ? null : r.value.trim(),
                unit: r.unit.trim() || null,
              }
            })
          execute(
            () =>
              saveEvaluationAction(evaluation?.id ?? null, {
                player_id: Number(playerId),
                evaluator_coach_id: Number(coachId) || null,
                evaluated_at: String(formData.get('evaluated_at') ?? ''),
                summary: String(formData.get('summary') ?? '').trim() || null,
                recommendations: String(formData.get('recommendations') ?? '').trim() || null,
                measurements,
              }),
            onClose,
          )
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <FormSelect id="player_id" label="Jugador" value={playerId} onChange={setPlayerId} options={players.map((p) => ({ value: String(p.id), label: p.name }))} />
            {fieldErrors.player_id && <p className="text-sm text-destructive">{fieldErrors.player_id}</p>}
          </div>
          <Field id="evaluated_at" name="evaluated_at" label="Fecha" type="date" required defaultValue={evaluation?.evaluated_at.slice(0, 10) ?? new Date().toISOString().slice(0, 10)} error={fieldErrors.evaluated_at} />
        </div>
        <div className="flex flex-col gap-1">
          <FormSelect id="evaluator" label="Evaluó" value={coachId} onChange={setCoachId} placeholder="Yo" options={[{ value: '', label: 'Yo' }, ...coaches.map((c) => ({ value: String(c.id), label: c.name }))]} />
          {fieldErrors.evaluator_coach_id && <p className="text-sm text-destructive">{fieldErrors.evaluator_coach_id}</p>}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">Pruebas</legend>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <Button key={p.name} type="button" variant="outline" size="xs" onClick={() => addPreset(p)}>
                <Plus aria-hidden="true" />
                {p.name}
              </Button>
            ))}
          </div>
          {rows.map((row, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="grid grid-cols-[1fr_6rem_5rem_auto] items-end gap-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`m-name-${i}`} className="text-xs">Prueba</Label>
                  <Input id={`m-name-${i}`} value={row.name} onChange={(e) => update(i, { name: e.target.value })} maxLength={120} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`m-value-${i}`} className="text-xs">Resultado</Label>
                  <Input id={`m-value-${i}`} value={row.value} onChange={(e) => update(i, { value: e.target.value })} inputMode="decimal" className="tabular-nums" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`m-unit-${i}`} className="text-xs">Unidad</Label>
                  <Input id={`m-unit-${i}`} value={row.unit} onChange={(e) => update(i, { unit: e.target.value })} maxLength={30} />
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label={`Quitar ${row.name || 'prueba'}`} onClick={() => setRows((all) => (all.length > 1 ? all.filter((_, j) => j !== i) : [EMPTY_ROW]))}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
              {rowError(i) && <p className="text-sm text-destructive">{rowError(i)}</p>}
            </div>
          ))}
          <Button type="button" variant="outline" className="w-fit gap-2" onClick={() => setRows((all) => [...all, EMPTY_ROW])} disabled={rows.length >= 30}>
            <Plus className="size-4" aria-hidden="true" />
            Otra prueba
          </Button>
          {fieldErrors.measurements && <p className="text-sm text-destructive">{fieldErrors.measurements}</p>}
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="summary">Resumen</Label>
          <Textarea id="summary" name="summary" defaultValue={evaluation?.summary ?? ''} maxLength={2000} rows={2} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recommendations">Recomendaciones</Label>
          <Textarea id="recommendations" name="recommendations" defaultValue={evaluation?.recommendations ?? ''} maxLength={2000} rows={2} />
        </div>
        <FormError message={error} />
        <SubmitButton pending={pending}>{evaluation ? 'Guardar cambios' : 'Guardar evaluación'}</SubmitButton>
      </form>
    </ConfigSheet>
  )
}
