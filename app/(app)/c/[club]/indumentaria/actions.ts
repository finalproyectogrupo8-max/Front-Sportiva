'use server'

import { runApiAction, text, type ActionResult } from '@/lib/action-result'
import {
  approveOrder,
  createApparelItem,
  createOrder,
  deleteApparelItem,
  deleteOrder,
  deliverOrder,
  rejectOrder,
  submitOrder,
  updateApparelItem,
  type ApparelLine,
} from '@/lib/api/orders'
import { listPlayers } from '@/lib/api/players'

export type SquadPlayer = { id: number; name: string; shirt_number: number | null }

/** Los jugadores activos de la categoría, para precargar el pedido. */
export async function categoryPlayersAction(categoryId: number): Promise<SquadPlayer[]> {
  if (!Number.isInteger(categoryId)) return []
  const result = await listPlayers({ category_id: categoryId, status: 'active', per_page: 100 }).catch(() => null)
  if (!result?.ok) return []
  return result.data.data
    .map((p) => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      shirt_number: p.memberships?.find((m) => m.category_id === categoryId)?.shirt_number ?? null,
    }))
    .sort((a, b) => (a.shirt_number ?? 999) - (b.shirt_number ?? 999) || a.name.localeCompare(b.name))
}

const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const

export async function createApparelOrderAction(input: {
  category_id: number | null
  priority: string
  description: string
  lines: ApparelLine[]
  send: boolean
}): Promise<ActionResult> {
  const lines = input.lines
    .filter((l) => Number.isInteger(l.player_id) && Number.isInteger(l.apparel_item_id) && l.size.trim() && l.quantity >= 1)
    .map((l) => ({ ...l, size: l.size.trim().slice(0, 20), alias: l.alias?.trim().slice(0, 50) || null }))
  if (lines.length === 0) return { ok: false, error: 'Marcá al menos un jugador con prenda y talle.' }

  const priority = (PRIORITIES as readonly string[]).includes(input.priority) ? (input.priority as (typeof PRIORITIES)[number]) : 'normal'
  let createdId: number | null = null
  const created = await runApiAction(
    async () => {
      const result = await createOrder({ type: 'apparel', category_id: input.category_id, priority, description: input.description.trim() || null, apparel_order_items: lines })
      if (result.ok) createdId = result.data.data.id
      return result
    },
    input.send ? 'Pedido enviado para aprobar.' : 'Pedido guardado como borrador.',
    ['*'],
  )
  if (!created.ok || !input.send || createdId === null) return created
  const id: number = createdId
  return runApiAction(() => submitOrder(id), 'Pedido enviado para aprobar.', [])
}

export async function submitOrderAction(id: number): Promise<ActionResult> {
  return runApiAction(() => submitOrder(id), 'Pedido enviado para aprobar.', [])
}
export async function deleteOrderAction(id: number): Promise<ActionResult> {
  return runApiAction(() => deleteOrder(id), 'Borrador eliminado.', [], 'Solo se pueden eliminar los borradores.')
}
export async function approveOrderAction(id: number, comment: string): Promise<ActionResult> {
  return runApiAction(() => approveOrder(id, comment.trim() || null), 'Pedido aprobado: ya se puede preparar.', [])
}
export async function rejectOrderAction(id: number, reason: string): Promise<ActionResult> {
  if (!reason.trim()) return { ok: false, fieldErrors: { reason: 'Contá por qué se rechaza: lo ve quien lo pidió.' } }
  return runApiAction(() => rejectOrder(id, reason.trim().slice(0, 255)), 'Pedido rechazado.', ['reason'])
}
/** Entrega: todo lo pendiente, o la cantidad entregada de cada línea. */
export async function deliverOrderAction(id: number, deliveries: { id: number; delivered_quantity: number }[] | null, comment: string): Promise<ActionResult> {
  return runApiAction(
    () => deliverOrder(id, { comment: comment.trim() || null, deliveries: deliveries ?? undefined }),
    deliveries ? 'Entrega registrada.' : 'Pedido entregado completo.',
    ['*'],
  )
}

export async function saveApparelItemAction(id: number | null, formData: FormData): Promise<ActionResult> {
  const input = { name: text(formData, 'name'), description: text(formData, 'description') || null, is_active: formData.get('is_active') !== 'off' }
  return id
    ? runApiAction(() => updateApparelItem(id, input), 'Prenda actualizada.', ['name', 'description'])
    : runApiAction(() => createApparelItem(input), 'Prenda creada.', ['name', 'description'])
}
export async function deleteApparelItemAction(id: number): Promise<ActionResult> {
  return runApiAction(() => deleteApparelItem(id), 'Prenda eliminada.', [], 'La prenda está en pedidos: desactivala en vez de eliminarla.')
}
