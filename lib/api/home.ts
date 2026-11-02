import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'

// Lo que muestra el inicio del club (FRO-38): alertas, pedidos y stock bajo.

export type Notification = Schemas['NotificationResource']
export type Order = Schemas['OrderResource']
export type InventoryBalance = Schemas['InventoryBalanceResource']

type Page<T> = { data: T[]; meta: { total: number; current_page: number; last_page: number } }

/** Notificaciones del usuario (alertas automáticas de la API, TIZ-27). */
export function listNotifications(
  query: { unread?: boolean; per_page?: number } = {},
  sessionErrors: 'redirect' | 'return' = 'redirect',
): Promise<ApiResult<Page<Notification>>> {
  return apiFetch('/notifications', { query: { unread: query.unread ? 1 : undefined, per_page: query.per_page ?? 20 }, sessionErrors })
}

export function markNotificationRead(id: number): Promise<ApiResult<{ data: Notification }>> {
  return apiFetch(`/notifications/${id}/read`, { method: 'PATCH' })
}

export function markAllNotificationsRead(): Promise<ApiResult<unknown>> {
  return apiFetch('/notifications/read-all', { method: 'POST' })
}

/** Pedidos de indumentaria y materiales (TIZ-18). */
export function listOrders(query: { status?: string; type?: 'apparel' | 'material'; per_page?: number } = {}): Promise<ApiResult<Page<Order>>> {
  return apiFetch('/orders', { query: { ...query, per_page: query.per_page ?? 50 } })
}

/** Materiales por debajo del stock mínimo, por depósito. */
export function lowStock(): Promise<ApiResult<Page<InventoryBalance>>> {
  return apiFetch('/inventory/balances', { query: { below_minimum: 1, per_page: 50 } })
}
