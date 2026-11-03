import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'

// Canchas (FRO-19): instalaciones con sus componentes, reparaciones y mantenimiento.

export type Facility = Schemas['FacilityResource']
export type FacilityComponent = Schemas['FacilityComponentResource']
export type RepairRequest = Schemas['RepairRequestResource']
export type MaintenanceRecord = Schemas['MaintenanceRecordResource']
export type ClubUser = { id: number; display_name: string }

type One<T> = { data: T }
type Page<T> = { data: T[]; meta: { total: number; current_page: number; last_page: number } }

export type FacilityInput = { name: string; type: string; location: string | null; status: string; notes: string | null }
export type ComponentInput = { name: string; condition_status: string; notes: string | null }
export type RepairInput = {
  facility_id: number
  component_id: number | null
  title: string
  description: string
  priority: string
  component_condition_status?: 'review' | 'out_of_service'
}

export function listFacilities(): Promise<ApiResult<Page<Facility>>> {
  return apiFetch('/facilities', { query: { per_page: 100, sort: 'name' } })
}
export function createFacility(input: FacilityInput): Promise<ApiResult<One<Facility>>> {
  return apiFetch('/facilities', { method: 'POST', body: input })
}
export function updateFacility(id: number, input: FacilityInput): Promise<ApiResult<One<Facility>>> {
  return apiFetch(`/facilities/${id}`, { method: 'PATCH', body: input })
}
export function deleteFacility(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/facilities/${id}`, { method: 'DELETE' })
}

export function createComponent(facilityId: number, input: ComponentInput): Promise<ApiResult<One<FacilityComponent>>> {
  return apiFetch(`/facilities/${facilityId}/components`, { method: 'POST', body: input })
}
export function updateComponent(id: number, input: Partial<ComponentInput> & { last_inspected_at?: string }): Promise<ApiResult<One<FacilityComponent>>> {
  return apiFetch(`/components/${id}`, { method: 'PATCH', body: input })
}
export function deleteComponent(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/components/${id}`, { method: 'DELETE' })
}

export function listRepairs(): Promise<ApiResult<Page<RepairRequest>>> {
  return apiFetch('/repair-requests', { query: { per_page: 100, sort: '-reported_at' } })
}
export function createRepair(input: RepairInput): Promise<ApiResult<One<RepairRequest>>> {
  return apiFetch('/repair-requests', { method: 'POST', body: input })
}
export function assignRepair(id: number, assignedTo: number): Promise<ApiResult<One<RepairRequest>>> {
  return apiFetch(`/repair-requests/${id}/assign`, { method: 'POST', body: { assigned_to: assignedTo } })
}
export function resolveRepair(id: number, input: { description: string; cost: number | null }): Promise<ApiResult<One<RepairRequest>>> {
  return apiFetch(`/repair-requests/${id}/resolve`, { method: 'POST', body: input })
}
export function cancelRepair(id: number): Promise<ApiResult<One<RepairRequest>>> {
  return apiFetch(`/repair-requests/${id}`, { method: 'PATCH', body: { status: 'cancelled' } })
}

export function listMaintenance(): Promise<ApiResult<Page<MaintenanceRecord>>> {
  return apiFetch('/maintenance-records', { query: { per_page: 50, sort: '-performed_at' } })
}

export function listClubUsers(): Promise<ApiResult<{ data: ClubUser[] }>> {
  return apiFetch('/club-users')
}
