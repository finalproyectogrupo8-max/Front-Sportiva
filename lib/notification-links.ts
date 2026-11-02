// A dónde lleva cada notificación de la API (alertas de TIZ-27 y avisos de pedidos de FRO-26).

export type NotificationLike = { type: string; data: Record<string, unknown> | null }

export function notificationHref(club: string, n: NotificationLike): string | null {
  const base = `/c/${club}`
  const data = n.data ?? {}
  const id = (key: string) => (typeof data[key] === 'number' ? (data[key] as number) : null)
  switch (n.type) {
    case 'callup_pending':
      return id('match_id') ? `${base}/partidos/${id('match_id')}` : `${base}/partidos`
    case 'attendance_drop':
    case 'requirement_expiring':
      return id('player_id') ? `${base}/jugadores?id=${id('player_id')}` : `${base}/jugadores`
    case 'registration_closing':
      return id('category_id') ? `${base}/habilitacion?categoria=${id('category_id')}` : `${base}/habilitacion`
    case 'order_approved':
    case 'order_rejected':
    case 'order_delivered':
    case 'order_partially_delivered': {
      const section = data.order_type === 'material' ? 'materiales' : 'indumentaria'
      return id('order_id') ? `${base}/${section}?pedido=${id('order_id')}` : `${base}/${section}`
    }
    default:
      return null
  }
}

/** Tono del punto de color: rojo para lo urgente, ámbar para avisos, verde para buenas noticias. */
export function notificationTone(type: string): 'bad' | 'warn' | 'ok' | 'info' {
  if (type === 'attendance_drop' || type === 'registration_closing' || type === 'order_rejected') return 'bad'
  if (type === 'order_approved' || type === 'order_delivered') return 'ok'
  if (type === 'order_partially_delivered') return 'info'
  return 'warn'
}
