'use server'

import { runApiAction, text, type ActionResult } from '@/lib/action-result'
import {
  createLocation,
  createMaterial,
  deleteLocation,
  deleteMaterial,
  recordMovement,
  transferStock,
  updateLocation,
  updateMaterial,
} from '@/lib/api/inventory'

const num = (formData: FormData, key: string) => Number(text(formData, key).replace(',', '.'))
const optional = (formData: FormData, key: string) => text(formData, key) || null

export async function saveMaterialAction(id: number | null, formData: FormData): Promise<ActionResult> {
  const input = {
    name: text(formData, 'name'),
    description: optional(formData, 'description'),
    unit: text(formData, 'unit') || 'unidades',
    minimum_stock: num(formData, 'minimum_stock') || 0,
    is_active: formData.get('is_active') !== 'off',
  }
  const fields = ['name', 'description', 'unit', 'minimum_stock']
  return id
    ? runApiAction(() => updateMaterial(id, input), 'Material actualizado.', fields)
    : runApiAction(() => createMaterial(input), 'Material creado.', fields)
}

export async function deleteMaterialAction(id: number): Promise<ActionResult> {
  return runApiAction(() => deleteMaterial(id), 'Material eliminado.', [], 'Tiene stock en algún depósito: primero registrá el egreso o desactivalo.')
}

export async function saveLocationAction(id: number | null, formData: FormData): Promise<ActionResult> {
  const input = {
    name: text(formData, 'name'),
    location_code: optional(formData, 'location_code'),
    description: optional(formData, 'description'),
    is_active: formData.get('is_active') !== 'off',
  }
  const fields = ['name', 'location_code', 'description']
  return id
    ? runApiAction(() => updateLocation(id, input), 'Depósito actualizado.', fields)
    : runApiAction(() => createLocation(input), 'Depósito creado.', fields)
}

export async function deleteLocationAction(id: number): Promise<ActionResult> {
  return runApiAction(() => deleteLocation(id), 'Depósito eliminado.', [], 'Tiene materiales con stock: transferilos a otro depósito antes de eliminarlo.')
}

/**
 * Ingreso, egreso o ajuste. El ajuste se carga como "cantidad contada": la API espera la
 * diferencia con el stock actual (`current`), que se calcula acá.
 */
export async function recordMovementAction(formData: FormData): Promise<ActionResult> {
  const type = text(formData, 'movement_type') as 'in' | 'out' | 'adjustment'
  if (!['in', 'out', 'adjustment'].includes(type)) return { ok: false, error: 'Elegí el tipo de movimiento.' }
  const quantity = num(formData, 'quantity')
  const current = num(formData, 'current') || 0
  if (!Number.isFinite(quantity) || quantity < 0 || (type !== 'adjustment' && quantity === 0)) {
    return { ok: false, fieldErrors: { quantity: 'Ingresá una cantidad mayor a cero.' } }
  }
  const delta = type === 'adjustment' ? Math.round((quantity - current) * 100) / 100 : quantity
  if (type === 'adjustment' && delta === 0) return { ok: false, fieldErrors: { quantity: 'Es la misma cantidad que ya figura: no hay nada que ajustar.' } }

  const input = {
    material_id: Number(text(formData, 'material_id')),
    location_id: Number(text(formData, 'location_id')),
    movement_type: type,
    quantity: delta,
    reason: optional(formData, 'reason'),
    reference: optional(formData, 'reference'),
  }
  const done = type === 'in' ? 'Ingreso registrado.' : type === 'out' ? 'Egreso registrado.' : `Stock ajustado (${delta > 0 ? '+' : ''}${delta}).`
  return runApiAction(() => recordMovement(input), done, ['material_id', 'location_id', 'quantity', 'reason', 'reference'])
}

export async function transferAction(formData: FormData): Promise<ActionResult> {
  const input = {
    material_id: Number(text(formData, 'material_id')),
    from_location_id: Number(text(formData, 'from_location_id')),
    to_location_id: Number(text(formData, 'to_location_id')),
    quantity: num(formData, 'quantity'),
    reason: optional(formData, 'reason'),
    reference: optional(formData, 'reference'),
  }
  if (input.from_location_id === input.to_location_id) return { ok: false, fieldErrors: { to_location_id: 'Elegí un depósito distinto al de origen.' } }
  return runApiAction(() => transferStock(input), 'Transferencia registrada.', ['material_id', 'from_location_id', 'to_location_id', 'quantity', 'reason', 'reference'])
}
