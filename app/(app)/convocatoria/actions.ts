'use server'

import { respondCallup, respondFromGroup, type CallupAnswer, type PublicMe, type PublicPlayer } from '@/lib/api/public-callups'

export type RespondResult = { ok: true; me: PublicMe } | { ok: false; error: string }

/** "Voy" o "No puedo" desde el link personal (sin login). */
export async function respondAction(token: string, response: CallupAnswer, note: string): Promise<RespondResult> {
  if (response !== 'going' && response !== 'not_going') return { ok: false, error: 'Elegí "Voy" o "No puedo".' }
  try {
    const result = await respondCallup(token, response, note.trim().slice(0, 255) || null)
    if (result.ok) return { ok: true, me: result.data.data.me }
    if (result.status === 404) return { ok: false, error: 'Este link ya no es válido. Pedile uno nuevo al profe.' }
    if (result.status === 429) return { ok: false, error: 'Demasiados intentos. Probá en un minuto.' }
    return { ok: false, error: result.message || 'No se pudo guardar. Probá de nuevo.' }
  } catch {
    return { ok: false, error: 'No pudimos conectar. Revisá la conexión y probá de nuevo.' }
  }
}

export type GroupResult = { ok: true; players: PublicPlayer[] } | { ok: false; error: string }

/** Respuesta desde el link del grupo: el convocado elegido en la lista. */
export async function respondFromGroupAction(token: string, callupId: number, response: CallupAnswer, note: string): Promise<GroupResult> {
  if (response !== 'going' && response !== 'not_going') return { ok: false, error: 'Elegí "Voy" o "No puedo".' }
  if (!Number.isInteger(callupId)) return { ok: false, error: 'Elegí tu nombre de la lista.' }
  try {
    const result = await respondFromGroup(token, callupId, response, note.trim().slice(0, 255) || null)
    if (result.ok) return { ok: true, players: result.data.data.players }
    if (result.status === 404) return { ok: false, error: 'Esta convocatoria ya no está disponible. Recargá la página.' }
    if (result.status === 429) return { ok: false, error: 'Demasiados intentos. Probá en un minuto.' }
    return { ok: false, error: result.message || 'No se pudo guardar. Probá de nuevo.' }
  } catch {
    return { ok: false, error: 'No pudimos conectar. Revisá la conexión y probá de nuevo.' }
  }
}
