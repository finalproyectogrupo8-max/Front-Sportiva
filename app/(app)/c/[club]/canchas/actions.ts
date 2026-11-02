'use server'

import { runApiAction, text, type ActionResult } from '@/lib/action-result'
import {
  assignRepair,
  cancelRepair,
  createComponent,
  createFacility,
  createRepair,
  deleteComponent,
  deleteFacility,
  resolveRepair,
  updateComponent,
  updateFacility,
} from '@/lib/api/facilities'

const optional = (formData: FormData, key: string) => text(formData, key) || null

export async function saveFacilityAction(id: number | null, formData: FormData): Promise<ActionResult> {
  const input = {
    name: text(formData, 'name'),
    type: text(formData, 'type') || 'court',
    location: optional(formData, 'location'),
    status: text(formData, 'status') || 'active',
    notes: optional(formData, 'notes'),
  }
  const fields = ['name', 'type', 'location', 'status', 'notes']
  return id
    ? runApiAction(() => updateFacility(id, input), 'Instalación actualizada.', fields)
    : runApiAction(() => createFacility(input), 'Instalación creada.', fields)
}

export async function deleteFacilityAction(id: number): Promise<ActionResult> {
  return runApiAction(() => deleteFacility(id), 'Instalación eliminada.', [], 'Tiene reparaciones o mantenimiento cargado: marcala fuera de servicio en vez de eliminarla.')
}

export async function saveComponentAction(facilityId: number, id: number | null, formData: FormData): Promise<ActionResult> {
  const input = { name: text(formData, 'name'), condition_status: text(formData, 'condition_status') || 'ok', notes: optional(formData, 'notes') }
  const fields = ['name', 'condition_status', 'notes']
  return id
    ? runApiAction(() => updateComponent(id, input), 'Elemento actualizado.', fields)
    : runApiAction(() => createComponent(facilityId, input), 'Elemento agregado.', fields)
}

/** Cambio rápido de estado desde la tarjeta: queda como revisado hoy. */
export async function setComponentConditionAction(id: number, condition: string): Promise<ActionResult> {
  if (!['ok', 'review', 'out_of_service'].includes(condition)) return { ok: false, error: 'Estado inválido.' }
  return runApiAction(() => updateComponent(id, { condition_status: condition, last_inspected_at: new Date().toISOString().slice(0, 10) }), 'Estado actualizado.', [])
}

export async function deleteComponentAction(id: number): Promise<ActionResult> {
  return runApiAction(() => deleteComponent(id), 'Elemento eliminado.', [], 'Tiene reparaciones cargadas: no se puede eliminar.')
}

export async function reportRepairAction(formData: FormData): Promise<ActionResult> {
  const componentId = Number(text(formData, 'component_id')) || null
  const condition = text(formData, 'component_condition_status')
  const input = {
    facility_id: Number(text(formData, 'facility_id')),
    component_id: componentId,
    title: text(formData, 'title'),
    description: text(formData, 'description'),
    priority: text(formData, 'priority') || 'normal',
    ...(componentId && (condition === 'review' || condition === 'out_of_service') ? { component_condition_status: condition as 'review' | 'out_of_service' } : {}),
  }
  return runApiAction(() => createRepair(input), 'Problema reportado.', ['facility_id', 'component_id', 'title', 'description', 'priority'])
}

export async function assignRepairAction(id: number, clubUserId: number): Promise<ActionResult> {
  if (!Number.isInteger(clubUserId) || clubUserId <= 0) return { ok: false, error: 'Elegí a quién asignarla.' }
  return runApiAction(() => assignRepair(id, clubUserId), 'Reparación asignada.', ['assigned_to'])
}

export async function resolveRepairAction(id: number, formData: FormData): Promise<ActionResult> {
  const cost = text(formData, 'cost').replace(',', '.')
  return runApiAction(
    () => resolveRepair(id, { description: text(formData, 'description'), cost: cost === '' ? null : Number(cost) }),
    'Reparación resuelta: quedó en el historial de mantenimiento.',
    ['description', 'cost'],
  )
}

export async function cancelRepairAction(id: number): Promise<ActionResult> {
  return runApiAction(() => cancelRepair(id), 'Reparación cancelada.', [])
}
