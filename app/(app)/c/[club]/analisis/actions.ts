'use server'

import { runApiAction, type ActionResult } from '@/lib/action-result'
import { createEvaluation, deleteEvaluation, updateEvaluation, type EvaluationInput } from '@/lib/api/analytics'

export async function saveEvaluationAction(id: number | null, input: EvaluationInput): Promise<ActionResult> {
  // El evaluador vacío lo completa la API con el profe que la carga.
  const body = { ...input, evaluator_coach_id: input.evaluator_coach_id || null }
  return id
    ? runApiAction(() => updateEvaluation(id, body), 'Evaluación actualizada.', ['*'])
    : runApiAction(() => createEvaluation(body), 'Evaluación guardada.', ['*'])
}

export async function deleteEvaluationAction(id: number): Promise<ActionResult> {
  return runApiAction(() => deleteEvaluation(id), 'Evaluación eliminada.', [])
}
