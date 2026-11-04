import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'

// Configuración del club (FRO-16): perfil, deportes, temporadas y categorías.
// Todas usan el token del club activo; la API valida los permisos en cada request.

export type Club = Schemas['ClubResource']
export type Sport = Schemas['SportResource']
export type SportOption = Pick<Sport, 'id' | 'name'> & Partial<Pick<Sport, 'is_active'>>
export type Season = Schemas['SeasonResource']
export type Category = Schemas['CategoryResource']
export type SeasonStatus = Season['status']

type One<T> = { data: T }
type List<T> = { data: T[] }
type Page<T> = { data: T[]; meta: { total: number; current_page: number; last_page: number } }

export type ClubProfileInput = {
  name?: string
  short_name?: string | null
  city?: string | null
  founded_year?: number | null
  primary_color?: string | null
}

export type SportInput = { name?: string; is_active?: boolean }
export type SeasonInput = { name?: string; start_date?: string; end_date?: string; status?: SeasonStatus }
export type CategoryInput = {
  sport_id?: number
  season_id?: number
  name?: string
  min_age?: number | null
  max_age?: number | null
  branch?: 'female' | 'male' | 'mixed' | null
  is_active?: boolean
}

/* Perfil */

export function getClub(): Promise<ApiResult<One<Club>>> {
  return apiFetch('/club')
}

export function updateClub(input: ClubProfileInput): Promise<ApiResult<One<Club>>> {
  return apiFetch('/club', { method: 'PATCH', body: input })
}

export function uploadClubLogo(file: File): Promise<ApiResult<One<Club>>> {
  const body = new FormData()
  body.append('logo', file)
  return apiFetch('/club/logo', { method: 'POST', body })
}

export function deleteClubLogo(): Promise<ApiResult<One<Club>>> {
  return apiFetch('/club/logo', { method: 'DELETE' })
}

/* Deportes */

export function listSports(query: { is_active?: boolean; per_page?: number } = {}): Promise<ApiResult<Page<Sport>>> {
  return apiFetch('/sports', { query: { sort: 'name', per_page: 100, ...query } })
}

export function createSport(input: SportInput): Promise<ApiResult<One<Sport>>> {
  return apiFetch('/sports', { method: 'POST', body: input })
}

export function updateSport(id: number, input: SportInput): Promise<ApiResult<One<Sport>>> {
  return apiFetch(`/sports/${id}`, { method: 'PATCH', body: input })
}

export function deleteSport(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/sports/${id}`, { method: 'DELETE' })
}

/* Temporadas */

export function listSeasons(query: { status?: SeasonStatus; per_page?: number } = {}): Promise<ApiResult<Page<Season>>> {
  return apiFetch('/seasons', { query: { sort: '-start_date', per_page: 100, ...query } })
}

export function createSeason(input: SeasonInput): Promise<ApiResult<One<Season>>> {
  return apiFetch('/seasons', { method: 'POST', body: input })
}

export function updateSeason(id: number, input: SeasonInput): Promise<ApiResult<One<Season>>> {
  return apiFetch(`/seasons/${id}`, { method: 'PATCH', body: input })
}

export function deleteSeason(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/seasons/${id}`, { method: 'DELETE' })
}

/* Categorías */

export function listCategories(
  query: { sport_id?: number; season_id?: number; branch?: string; per_page?: number } = {},
): Promise<ApiResult<Page<Category>>> {
  return apiFetch('/categories', { query: { sort: 'name', per_page: 100, ...query } })
}

export function createCategory(input: CategoryInput): Promise<ApiResult<One<Category>>> {
  return apiFetch('/categories', { method: 'POST', body: input })
}

export function updateCategory(id: number, input: CategoryInput): Promise<ApiResult<One<Category>>> {
  return apiFetch(`/categories/${id}`, { method: 'PATCH', body: input })
}

export function deleteCategory(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/categories/${id}`, { method: 'DELETE' })
}

/* Posiciones de cada deporte (TIZ, PR #98 de la API). Desactivar una la saca de los selectores. */

export type Position = { id: number; sport_id: number; name: string; is_active: boolean }

export function listPositions(query: { sport_id?: number; is_active?: boolean } = {}): Promise<ApiResult<Page<Position>>> {
  return apiFetch('/positions', { query: { sort: 'name', per_page: 100, ...query } })
}
export function createPosition(input: { sport_id: number; name: string }): Promise<ApiResult<One<Position>>> {
  return apiFetch('/positions', { method: 'POST', body: input })
}
export function updatePosition(id: number, input: { name?: string; is_active?: boolean }): Promise<ApiResult<One<Position>>> {
  return apiFetch(`/positions/${id}`, { method: 'PATCH', body: input })
}
export function deletePosition(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/positions/${id}`, { method: 'DELETE' })
}

/* Competencias y requisitos de habilitación (FRO-33) */

export type Competition = Schemas['CompetitionResource']
export type CompetitionRequirement = Schemas['CompetitionRequirementResource']

export type RequirementInput = {
  id?: number
  name: string
  validity_months: number | null
  requires_file: boolean
  minors_only: boolean
  is_required: boolean
}

export type CompetitionInput = {
  sport_id: number
  season_id: number
  name: string
  organizer: string | null
  registration_deadline: string | null
  category_ids: number[]
  /** La lista completa y en orden: con id edita, sin id crea, y la API borra los que no vienen. */
  requirements: RequirementInput[]
}

export function listCompetitions(
  query: { season_id?: number; sport_id?: number; per_page?: number } = {},
): Promise<ApiResult<Page<Competition>>> {
  return apiFetch('/competitions', { query: { per_page: 100, ...query } })
}

export function createCompetition(input: CompetitionInput): Promise<ApiResult<One<Competition>>> {
  return apiFetch('/competitions', { method: 'POST', body: input })
}

export function updateCompetition(id: number, input: CompetitionInput): Promise<ApiResult<One<Competition>>> {
  return apiFetch(`/competitions/${id}`, { method: 'PATCH', body: input })
}

export function deleteCompetition(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/competitions/${id}`, { method: 'DELETE' })
}

/** Copia la competencia a otra temporada con sus requisitos (las categorías no, son de otra temporada). */
export function copyCompetition(
  id: number,
  input: { season_id: number; name?: string; registration_deadline?: string | null },
): Promise<ApiResult<One<Competition>>> {
  return apiFetch(`/competitions/${id}/copy`, { method: 'POST', body: input })
}

/* Sedes del club (FRO-39) */

export type Venue = Schemas['VenueResource']

export type VenueInput = {
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  is_active?: boolean
  notes?: string | null
}

export function listVenues(query: { is_active?: boolean } = {}): Promise<ApiResult<List<Venue>>> {
  return apiFetch('/venues', { query })
}

export function createVenue(input: VenueInput): Promise<ApiResult<One<Venue>>> {
  return apiFetch('/venues', { method: 'POST', body: input })
}

export function updateVenue(id: number, input: Partial<VenueInput>): Promise<ApiResult<One<Venue>>> {
  return apiFetch(`/venues/${id}`, { method: 'PATCH', body: input })
}

export function deleteVenue(id: number): Promise<ApiResult<void>> {
  return apiFetch(`/venues/${id}`, { method: 'DELETE' })
}

/* Calendario suscribible por categoría (FRO-32) */

export type CalendarLink = { url: string; webcal_url: string; google_url: string }

export function getCalendarLink(categoryId: number): Promise<ApiResult<{ data: CalendarLink }>> {
  return apiFetch(`/categories/${categoryId}/calendar-link`)
}
export function regenerateCalendarLink(categoryId: number): Promise<ApiResult<{ data: CalendarLink }>> {
  return apiFetch(`/categories/${categoryId}/calendar-link`, { method: 'POST' })
}
