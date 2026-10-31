'use server'

import { runApiAction, text, type ActionResult } from '@/lib/action-result'
import { assignCoach, createCoach, deleteCoach, endCoachAssignment, updateCoach, type CoachInput } from '@/lib/api/players'

// Profes (FRO-17): ficha y categorías a cargo. La API valida permisos y alcance.

const COACH_FIELDS = ['first_name', 'last_name', 'phone', 'email', 'status']
const TYPES = ['head_coach', 'assistant', 'physical_trainer']

export async function saveCoachAction(id: number | null, formData: FormData): Promise<ActionResult> {
  const input: CoachInput = {
    first_name: text(formData, 'first_name'),
    last_name: text(formData, 'last_name'),
    phone: text(formData, 'phone') || null,
    email: text(formData, 'email') || null,
    status: text(formData, 'status') === 'inactive' ? 'inactive' : 'active',
  }
  const errors: Record<string, string> = {}
  if (!input.first_name) errors.first_name = 'El nombre es obligatorio.'
  if (!input.last_name) errors.last_name = 'El apellido es obligatorio.'
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors }

  const name = `${input.first_name} ${input.last_name}`
  return id
    ? runApiAction(() => updateCoach(id, input), `${name}: datos actualizados.`, COACH_FIELDS)
    : runApiAction(() => createCoach(input), `${name} sumado al cuerpo técnico.`, COACH_FIELDS)
}

export async function deleteCoachAction(id: number): Promise<ActionResult> {
  return runApiAction(() => deleteCoach(id), 'Profe dado de baja.', [])
}

export async function assignCoachAction(coachId: number, formData: FormData): Promise<ActionResult> {
  const categoryId = Number(text(formData, 'category_id'))
  const type = text(formData, 'assignment_type')
  const errors: Record<string, string> = {}
  if (!categoryId) errors.category_id = 'Elegí la categoría.'
  if (!TYPES.includes(type)) errors.assignment_type = 'Elegí el rol.'
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors }

  return runApiAction(
    () => assignCoach(categoryId, { coach_id: coachId, assignment_type: type }),
    'Categoría asignada.',
    ['coach_id', 'assignment_type'],
  ).then((result) =>
    !result.ok && result.fieldErrors?.coach_id ? { ok: false, fieldErrors: { category_id: result.fieldErrors.coach_id } } : result,
  )
}

export async function endAssignmentAction(id: number): Promise<ActionResult> {
  return runApiAction(() => endCoachAssignment(id), 'Ya no está a cargo de esa categoría.', [])
}
