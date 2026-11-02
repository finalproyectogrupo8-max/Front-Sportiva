'use server'

import { optionalInt, runApiAction, text, type ActionResult } from '@/lib/action-result'
import { createObjective, deleteObjective, saveStandings, updateObjective, type StandingInput } from '@/lib/api/project'

const decimal = (formData: FormData, key: string) => {
  const value = text(formData, key).replace(',', '.')
  return value === '' ? null : Number(value)
}

export async function saveObjectiveAction(id: number | null, seasonId: number, formData: FormData): Promise<ActionResult> {
  const input = {
    season_id: seasonId,
    category_id: optionalInt(formData, 'category_id'),
    title: text(formData, 'title'),
    description: text(formData, 'description') || null,
    target_value: decimal(formData, 'target_value'),
    current_value: decimal(formData, 'current_value'),
    unit: text(formData, 'unit') || null,
    status: text(formData, 'status') || 'in_progress',
    due_date: text(formData, 'due_date') || null,
  }
  const fields = ['category_id', 'title', 'description', 'target_value', 'current_value', 'unit', 'status', 'due_date']
  return id
    ? runApiAction(() => updateObjective(id, input), 'Objetivo actualizado.', fields)
    : runApiAction(() => createObjective(input), 'Objetivo creado.', fields)
}

export async function deleteObjectiveAction(id: number): Promise<ActionResult> {
  return runApiAction(() => deleteObjective(id), 'Objetivo eliminado.', [])
}

/** Guarda la tabla entera de una categoría, en el orden en que vienen las filas. */
export async function saveStandingsAction(competitionId: number, categoryId: number, rows: StandingInput[]): Promise<ActionResult> {
  return runApiAction(() => saveStandings(competitionId, categoryId, rows), 'Tabla guardada.', ['*'])
}
