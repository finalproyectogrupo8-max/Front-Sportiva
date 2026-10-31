'use server'

import { failure, optionalInt, revalidateClub, runApiAction, runCall, text, type ActionResult } from '@/lib/action-result'
import {
  addToCategory,
  createContact,
  createPlayer,
  deleteContact,
  deletePlayer,
  endMembership,
  updateContact,
  updateMembership,
  updatePlayer,
  uploadPlayerPhoto,
  type ContactInput,
  type PlayerInput,
  type PlayerStatus,
} from '@/lib/api/players'

// Jugadores (FRO-17): ficha, contactos, categorías y foto. La API valida permisos y alcance.

const PLAYER_FIELDS = [
  'first_name',
  'last_name',
  'birth_date',
  'document_number',
  'registration_number',
  'preferred_position',
  'dominant_side',
  'status',
  'notes',
]
const STATUSES: PlayerStatus[] = ['active', 'inactive', 'transferred']
const SIDES = ['left', 'right', 'both']
const RELATIONSHIPS = ['mother', 'father', 'guardian', 'self', 'other']
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

function playerInput(formData: FormData): { input: PlayerInput; errors: Record<string, string> } {
  const side = text(formData, 'dominant_side')
  const status = text(formData, 'status') as PlayerStatus
  const input: PlayerInput = {
    first_name: text(formData, 'first_name'),
    last_name: text(formData, 'last_name'),
    birth_date: text(formData, 'birth_date'),
    document_number: text(formData, 'document_number') || null,
    registration_number: text(formData, 'registration_number') || null,
    preferred_position: text(formData, 'preferred_position') || null,
    dominant_side: SIDES.includes(side) ? side : null,
    notes: text(formData, 'notes') || null,
    ...(STATUSES.includes(status) ? { status } : {}),
  }

  const errors: Record<string, string> = {}
  if (!input.first_name) errors.first_name = 'El nombre es obligatorio.'
  if (!input.last_name) errors.last_name = 'El apellido es obligatorio.'
  if (!input.birth_date) errors.birth_date = 'La fecha de nacimiento es obligatoria: define qué papeles se le piden.'
  else if (input.birth_date >= new Date().toISOString().slice(0, 10)) errors.birth_date = 'Tiene que ser anterior a hoy.'
  return { input, errors }
}

/**
 * Alta de la ficha. Si se eligió una categoría, también lo suma al plantel.
 * Devuelve el id para que la pantalla abra la ficha nueva.
 */
export async function createPlayerAction(formData: FormData): Promise<ActionResult> {
  const { input, errors } = playerInput(formData)
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors }

  const created = await runCall(() => createPlayer(input))
  if (!created.ok) return 'kind' in created ? failure(created, PLAYER_FIELDS) : created
  const player = created.data.data

  const categoryId = Number(text(formData, 'category_id'))
  if (categoryId) {
    const added = await runCall(() =>
      addToCategory(categoryId, { player_id: player.id, shirt_number: optionalInt(formData, 'shirt_number'), close_previous: false }),
    )
    if (!added.ok) {
      await revalidateClub()
      return {
        ok: true,
        id: player.id,
        message: `Ficha creada, pero no se pudo sumar a la categoría${'message' in added && added.message ? `: ${added.message}` : ''}.`,
      }
    }
  }

  await revalidateClub()
  return { ok: true, id: player.id, message: `Ficha de ${player.first_name} ${player.last_name} creada.` }
}

export async function updatePlayerAction(id: number, formData: FormData): Promise<ActionResult> {
  const { input, errors } = playerInput(formData)
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors }
  return runApiAction(() => updatePlayer(id, input), 'Ficha actualizada.', PLAYER_FIELDS)
}

export async function deletePlayerAction(id: number): Promise<ActionResult> {
  return runApiAction(() => deletePlayer(id), 'Jugador dado de baja.', [])
}

export async function uploadPhotoAction(id: number, formData: FormData): Promise<ActionResult> {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'Elegí una foto.' }
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: 'La foto puede pesar hasta 5 MB.' }
  return runApiAction(() => uploadPlayerPhoto(id, file), 'Foto actualizada.', ['file'])
}

/* Contactos */

const CONTACT_FIELDS = ['name', 'relationship', 'phone', 'email']

export async function saveContactAction(
  playerId: number,
  contactId: number | null,
  formData: FormData,
): Promise<ActionResult> {
  const input: ContactInput = {
    name: text(formData, 'name'),
    relationship: text(formData, 'relationship'),
    phone: text(formData, 'phone') || null,
    email: text(formData, 'email') || null,
    is_primary: formData.get('is_primary') === 'on',
  }

  const errors: Record<string, string> = {}
  if (!input.name) errors.name = 'El nombre es obligatorio.'
  if (!RELATIONSHIPS.includes(input.relationship)) errors.relationship = 'Elegí el vínculo.'
  if (!input.phone && !input.email) errors.phone = 'Cargá un teléfono o un email para poder avisarle.'
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors }

  return contactId
    ? runApiAction(() => updateContact(contactId, input), 'Contacto actualizado.', CONTACT_FIELDS)
    : runApiAction(() => createContact(playerId, input), 'Contacto agregado.', CONTACT_FIELDS)
}

export async function deleteContactAction(id: number): Promise<ActionResult> {
  return runApiAction(() => deleteContact(id), 'Contacto eliminado.', [])
}

/* Categorías */

export async function addToCategoryAction(playerId: number, formData: FormData): Promise<ActionResult> {
  const categoryId = Number(text(formData, 'category_id'))
  if (!categoryId) return { ok: false, fieldErrors: { category_id: 'Elegí la categoría.' } }

  return runApiAction(
    () =>
      addToCategory(categoryId, {
        player_id: playerId,
        shirt_number: optionalInt(formData, 'shirt_number'),
        close_previous: formData.get('close_previous') === 'on',
      }),
    'Jugador sumado a la categoría.',
    ['player_id', 'shirt_number'],
  ).then((result) =>
    // La API nombra el campo `close_previous`: en la pantalla es la casilla "pase de categoría".
    !result.ok && result.fieldErrors?.player_id?.includes('close_previous')
      ? {
          ok: false,
          fieldErrors: {
            category_id: `${result.fieldErrors.player_id.split('. ')[0]}. Marcá "Pase de categoría" para moverlo.`,
          },
        }
      : !result.ok && result.fieldErrors?.player_id
        ? { ok: false, fieldErrors: { category_id: result.fieldErrors.player_id } }
        : result,
  )
}

export async function updateShirtNumberAction(membershipId: number, formData: FormData): Promise<ActionResult> {
  return runApiAction(
    () => updateMembership(membershipId, optionalInt(formData, 'shirt_number')),
    'Número actualizado.',
    ['shirt_number'],
  )
}

export async function endMembershipAction(membershipId: number): Promise<ActionResult> {
  return runApiAction(() => endMembership(membershipId), 'Jugador quitado de la categoría.', [])
}
