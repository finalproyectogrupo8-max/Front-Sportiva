'use server'

import { failure, revalidateClub, runApiAction, runCall, type ActionResult } from '@/lib/action-result'
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  listRecipients,
  previewAudience,
  sendAnnouncement,
  updateAnnouncement,
  type Announcement,
  type AnnouncementInput,
  type AnnouncementRecipient,
  type Audience,
  type AudiencePreview,
} from '@/lib/api/announcements'
import { listPlayers } from '@/lib/api/players'

const FIELDS = ['subject', 'body', 'audience', '*']

/** Guarda el borrador (lo crea si es nuevo). Devuelve el id para poder enviarlo. */
export async function saveDraftAction(id: number | null, input: AnnouncementInput): Promise<ActionResult> {
  const result = await runCall(() => (id ? updateAnnouncement(id, input) : createAnnouncement(input)))
  if (!result.ok) return 'kind' in result ? failure(result, FIELDS, 'Ya se envió: no se puede editar.') : { ok: false, error: result.error }
  await revalidateClub()
  return { ok: true, message: 'Borrador guardado.', id: result.data.data.id }
}

/** Envía un borrador ya guardado. El envío sigue en la cola: el historial muestra el avance. */
export async function sendAnnouncementAction(id: number): Promise<ActionResult> {
  return runApiAction(() => sendAnnouncement(id), 'Comunicado enviado. Los mails salen en los próximos minutos.', ['audience'], 'Ya se había enviado.')
}

export async function deleteAnnouncementAction(id: number): Promise<ActionResult> {
  return runApiAction(() => deleteAnnouncement(id), 'Borrador eliminado.', [], 'Ya se envió: no se puede eliminar.')
}

export async function previewAudienceAction(audience: Audience): Promise<{ ok: true; data: AudiencePreview } | { ok: false; error: string }> {
  const result = await runCall(() => previewAudience(audience))
  if (result.ok) return { ok: true, data: result.data.data }
  if (!('kind' in result)) return { ok: false, error: result.error }
  if (result.kind === 'forbidden' || result.status === 403) return { ok: false, error: 'Elegiste destinatarios fuera de tu alcance.' }
  return { ok: false, error: result.kind === 'validation' ? 'Elegí al menos un destinatario.' : result.message }
}

/** Estado y destinatarios de un comunicado, para el detalle y para seguir el envío. */
export async function announcementDetailAction(id: number): Promise<{ announcement: Announcement; recipients: AnnouncementRecipient[] } | null> {
  const [announcement, recipients] = await Promise.all([runCall(() => getAnnouncement(id)), runCall(() => listRecipients(id))])
  if (!announcement.ok) return null
  return { announcement: announcement.data.data, recipients: recipients.ok ? recipients.data.data : [] }
}

/** Buscador de jugadores sueltos. */
export async function searchPlayersAction(search: string): Promise<{ id: number; name: string }[]> {
  if (search.trim().length < 2) return []
  const result = await runCall(() => listPlayers({ search: search.trim(), per_page: 8 }))
  return result.ok ? result.data.data.map((p) => ({ id: p.id, name: `${p.first_name} ${p.last_name}` })) : []
}
