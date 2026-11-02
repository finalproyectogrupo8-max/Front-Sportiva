import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'

// Pedidos de indumentaria y materiales (FRO-19 / TIZ-18): borrador → enviado → aprobado →
// entregado (o rechazado con motivo). Cada cambio de estado queda en el historial.

export type Order = Schemas['OrderResource']
export type ApparelItem = Schemas['ApparelItemResource']
export type OrderStatus = 'draft' | 'submitted' | 'approved' | 'preparing' | 'partially_delivered' | 'delivered' | 'rejected'

type One<T> = { data: T }
type Page<T> = { data: T[]; meta: { total: number; current_page: number; last_page: number } }

export type ApparelLine = {
  player_id: number
  apparel_item_id: number
  size: string
  shirt_number: number | null
  alias: string | null
  quantity: number
  notes?: string | null
}
export type OrderInput = {
  type: 'apparel' | 'material'
  category_id: number | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  description: string | null
  apparel_order_items?: ApparelLine[]
  material_order_items?: { material_id: number; quantity: number; notes?: string | null }[]
}

export function listOrders(query: { status?: string; type?: 'apparel' | 'material'; category_id?: number; per_page?: number } = {}): Promise<ApiResult<Page<Order>>> {
  return apiFetch('/orders', { query: { ...query, per_page: query.per_page ?? 50 } })
}
export function createOrder(input: OrderInput): Promise<ApiResult<One<Order>>> {
  return apiFetch('/orders', { method: 'POST', body: input })
}
export function deleteOrder(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/orders/${id}`, { method: 'DELETE' })
}
export function submitOrder(id: number): Promise<ApiResult<One<Order>>> {
  return apiFetch(`/orders/${id}/submit`, { method: 'POST' })
}
export function approveOrder(id: number, comment: string | null): Promise<ApiResult<One<Order>>> {
  return apiFetch(`/orders/${id}/approve`, { method: 'POST', body: { comment } })
}
export function rejectOrder(id: number, reason: string): Promise<ApiResult<One<Order>>> {
  return apiFetch(`/orders/${id}/reject`, { method: 'POST', body: { reason } })
}
/** Sin `deliveries` entrega todo lo pendiente; con `deliveries`, la cantidad entregada de cada línea. */
export function deliverOrder(
  id: number,
  body: { comment?: string | null; location_id?: number | null; deliveries?: { id: number; delivered_quantity: number }[] },
): Promise<ApiResult<One<Order>>> {
  return apiFetch(`/orders/${id}/deliveries`, { method: 'POST', body })
}

export function listApparelItems(): Promise<ApiResult<Page<ApparelItem>>> {
  return apiFetch('/apparel-items', { query: { per_page: 100, sort: 'name' } })
}
export function createApparelItem(input: { name: string; description: string | null; is_active: boolean }): Promise<ApiResult<One<ApparelItem>>> {
  return apiFetch('/apparel-items', { method: 'POST', body: input })
}
export function updateApparelItem(id: number, input: { name: string; description: string | null; is_active: boolean }): Promise<ApiResult<One<ApparelItem>>> {
  return apiFetch(`/apparel-items/${id}`, { method: 'PATCH', body: input })
}
export function deleteApparelItem(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/apparel-items/${id}`, { method: 'DELETE' })
}
