import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'

// Jugadores y profes del club (FRO-17). Token del club activo; la API aplica el alcance:
// el profe solo ve los jugadores y profes de sus categorías.

export type Player = Schemas['PlayerResource']
export type PlayerContact = Schemas['PlayerContactResource']
export type Membership = Schemas['MembershipResource']
export type Coach = Schemas['CoachResource']
export type CategoryCoach = Schemas['CategoryCoachResource']

type One<T> = { data: T }
type List<T> = { data: T[] }
export type PageMeta = {
  current_page: number
  last_page: number
  per_page: number
  from: number | null
  to: number | null
  total: number
}
type Page<T> = { data: T[]; meta: PageMeta }

export type PlayerStatus = 'active' | 'inactive' | 'transferred'

export type PlayerInput = {
  first_name: string
  last_name: string
  birth_date: string
  document_number: string | null
  registration_number: string | null
  preferred_position: string | null
  dominant_side: string | null
  gender: 'female' | 'male' | 'other' | null
  status?: PlayerStatus
  notes: string | null
}

export type ContactInput = {
  name: string
  relationship: string
  phone: string | null
  email: string | null
  is_primary: boolean
}

export type CoachInput = {
  first_name: string
  last_name: string
  phone: string | null
  email: string | null
  status: 'active' | 'inactive'
}

/* Jugadores */

export function listPlayers(query: {
  search?: string
  category_id?: number
  gender?: string
  status?: string
  page?: number
  per_page?: number
}): Promise<ApiResult<Page<Player>>> {
  return apiFetch('/players', { query: { per_page: 25, ...query } })
}

export function getPlayer(id: number): Promise<ApiResult<One<Player>>> {
  return apiFetch(`/players/${id}`)
}

export function createPlayer(input: PlayerInput): Promise<ApiResult<One<Player>>> {
  return apiFetch('/players', { method: 'POST', body: input })
}

export function updatePlayer(id: number, input: Partial<PlayerInput>): Promise<ApiResult<One<Player>>> {
  return apiFetch(`/players/${id}`, { method: 'PATCH', body: input })
}

export function deletePlayer(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/players/${id}`, { method: 'DELETE' })
}

/** Historial: categorías vigentes y cerradas, de la más reciente a la más vieja. */
export function listPlayerMemberships(id: number): Promise<ApiResult<List<Membership>>> {
  return apiFetch(`/players/${id}/memberships`)
}

/** Foto de la ficha. La API reemplaza la anterior. */
export function uploadPlayerPhoto(id: number, file: File): Promise<ApiResult<unknown>> {
  const body = new FormData()
  body.append('kind', 'photo')
  body.append('file', file)
  return apiFetch(`/players/${id}/documents`, { method: 'POST', body })
}

/* Contactos */

export function listContacts(playerId: number): Promise<ApiResult<List<PlayerContact>>> {
  return apiFetch(`/players/${playerId}/contacts`)
}

export function createContact(playerId: number, input: ContactInput): Promise<ApiResult<One<PlayerContact>>> {
  return apiFetch(`/players/${playerId}/contacts`, { method: 'POST', body: input })
}

export function updateContact(id: number, input: Partial<ContactInput>): Promise<ApiResult<One<PlayerContact>>> {
  return apiFetch(`/player-contacts/${id}`, { method: 'PATCH', body: input })
}

export function deleteContact(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/player-contacts/${id}`, { method: 'DELETE' })
}

/* Categorías del jugador (plantel) */

export function addToCategory(
  categoryId: number,
  input: { player_id: number; shirt_number: number | null; close_previous: boolean },
): Promise<ApiResult<One<Membership>>> {
  return apiFetch(`/categories/${categoryId}/memberships`, { method: 'POST', body: input })
}

export function updateMembership(id: number, shirtNumber: number | null): Promise<ApiResult<One<Membership>>> {
  return apiFetch(`/memberships/${id}`, { method: 'PATCH', body: { shirt_number: shirtNumber } })
}

export function endMembership(id: number): Promise<ApiResult<One<Membership>>> {
  return apiFetch(`/memberships/${id}/end`, { method: 'POST', body: {} })
}

/* Profes */

export function listCoaches(query: {
  search?: string
  status?: string
  page?: number
  per_page?: number
}): Promise<ApiResult<Page<Coach>>> {
  return apiFetch('/coaches', { query: { per_page: 25, ...query } })
}

export function createCoach(input: CoachInput): Promise<ApiResult<One<Coach>>> {
  return apiFetch('/coaches', { method: 'POST', body: input })
}

export function updateCoach(id: number, input: Partial<CoachInput>): Promise<ApiResult<One<Coach>>> {
  return apiFetch(`/coaches/${id}`, { method: 'PATCH', body: input })
}

export function deleteCoach(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/coaches/${id}`, { method: 'DELETE' })
}

export function assignCoach(
  categoryId: number,
  input: { coach_id: number; assignment_type: string },
): Promise<ApiResult<One<CategoryCoach>>> {
  return apiFetch(`/categories/${categoryId}/coaches`, { method: 'POST', body: input })
}

export function endCoachAssignment(id: number): Promise<ApiResult<One<CategoryCoach>>> {
  return apiFetch(`/category-coaches/${id}/end`, { method: 'POST', body: {} })
}

export function getCoach(id: number): Promise<ApiResult<One<Coach>>> {
  return apiFetch(`/coaches/${id}`)
}
