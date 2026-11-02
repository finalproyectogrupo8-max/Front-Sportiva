import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'

// Materiales (FRO-19): catálogo, depósitos, stock por depósito y movimientos.

export type Material = Schemas['MaterialResource']
export type StorageLocation = Schemas['StorageLocationResource']
export type InventoryBalance = Schemas['InventoryBalanceResource']
export type InventoryMovement = Schemas['InventoryMovementResource']

type One<T> = { data: T }
type Page<T> = { data: T[]; meta: { total: number; current_page: number; last_page: number } }

export type MaterialInput = { name: string; description: string | null; unit: string; minimum_stock: number; is_active: boolean }
export type LocationInput = { name: string; location_code: string | null; description: string | null; is_active: boolean }
export type MovementInput = {
  material_id: number
  location_id: number
  movement_type: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: string | null
  reference: string | null
}
export type TransferInput = {
  material_id: number
  from_location_id: number
  to_location_id: number
  quantity: number
  reason: string | null
  reference: string | null
}

export function listMaterials(): Promise<ApiResult<Page<Material>>> {
  return apiFetch('/materials', { query: { per_page: 100, sort: 'name' } })
}
export function createMaterial(input: MaterialInput): Promise<ApiResult<One<Material>>> {
  return apiFetch('/materials', { method: 'POST', body: input })
}
export function updateMaterial(id: number, input: MaterialInput): Promise<ApiResult<One<Material>>> {
  return apiFetch(`/materials/${id}`, { method: 'PATCH', body: input })
}
export function deleteMaterial(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/materials/${id}`, { method: 'DELETE' })
}

export function listLocations(): Promise<ApiResult<Page<StorageLocation>>> {
  return apiFetch('/storage-locations', { query: { per_page: 100, sort: 'name' } })
}
export function createLocation(input: LocationInput): Promise<ApiResult<One<StorageLocation>>> {
  return apiFetch('/storage-locations', { method: 'POST', body: input })
}
export function updateLocation(id: number, input: LocationInput): Promise<ApiResult<One<StorageLocation>>> {
  return apiFetch(`/storage-locations/${id}`, { method: 'PATCH', body: input })
}
export function deleteLocation(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/storage-locations/${id}`, { method: 'DELETE' })
}

export function listBalances(page = 1): Promise<ApiResult<Page<InventoryBalance>>> {
  return apiFetch('/inventory/balances', { query: { per_page: 100, page } })
}
export function listMovements(query: { material_id?: number; location_id?: number; per_page?: number } = {}): Promise<ApiResult<Page<InventoryMovement>>> {
  return apiFetch('/inventory/movements', { query: { sort: '-created_at', per_page: query.per_page ?? 50, material_id: query.material_id, location_id: query.location_id } })
}
export function recordMovement(input: MovementInput): Promise<ApiResult<One<InventoryMovement>>> {
  return apiFetch('/inventory/movements', { method: 'POST', body: input })
}
export function transferStock(input: TransferInput): Promise<ApiResult<unknown>> {
  return apiFetch('/inventory/transfers', { method: 'POST', body: input })
}
