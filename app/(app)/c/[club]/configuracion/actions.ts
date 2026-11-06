'use server'

import { isBranch } from '@/lib/branches'
import type { ApiResult } from '@/lib/api/client'
import { failure, optionalInt, revalidateClub, runApiAction, runCall, text, type ActionResult } from '@/lib/action-result'
import {
  copyCompetition,
  createCategory,
  createCompetition,
  createSeason,
  createSport,
  createVenue,
  deleteCategory,
  deleteCompetition,
  deleteClubLogo,
  deleteSeason,
  deleteSport,
  deleteVenue,
  updateCategory,
  updateCompetition,
  updateClub,
  updateSeason,
  updateSport,
  updateVenue,
  uploadClubLogo,
  type CategoryInput,
  type CompetitionInput,
  type SeasonInput,
  type SeasonStatus,
  createPosition,
  deletePosition,
  updatePosition,
} from '@/lib/api/club'

// Configuración del club (FRO-16). Cada acción devuelve el resultado al formulario: los 422 van
// a cada campo y el 409 ("está en uso") como mensaje general. La API valida los permisos.

export type ConfigResult = ActionResult

const SEASON_STATUSES: SeasonStatus[] = ['planned', 'active', 'closed']
const MAX_LOGO_BYTES = 1024 * 1024
const run = runApiAction

/* Perfil */

const PROFILE_FIELDS = ['name', 'short_name', 'city', 'founded_year', 'primary_color']

export async function saveProfileAction(formData: FormData): Promise<ConfigResult> {
  const name = text(formData, 'name')
  if (!name) return { ok: false, fieldErrors: { name: 'El nombre es obligatorio.' } }

  const color = text(formData, 'primary_color')
  return run(
    () =>
      updateClub({
        name,
        short_name: text(formData, 'short_name').toUpperCase() || null,
        city: text(formData, 'city') || null,
        founded_year: optionalInt(formData, 'founded_year'),
        primary_color: color ? color.toLowerCase() : null,
      }),
    'Perfil del club actualizado.',
    PROFILE_FIELDS,
  )
}

export async function uploadLogoAction(formData: FormData): Promise<ConfigResult> {
  const file = formData.get('logo')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, fieldErrors: { logo: 'Elegí una imagen.' } }
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, fieldErrors: { logo: 'El escudo puede pesar hasta 1 MB.' } }
  }
  return run(() => uploadClubLogo(file), 'Escudo actualizado.', ['logo'])
}

export async function removeLogoAction(): Promise<ConfigResult> {
  return run(() => deleteClubLogo(), 'Escudo eliminado.', [])
}

/* Deportes */

export async function saveSportAction(id: number | null, formData: FormData): Promise<ConfigResult> {
  const name = text(formData, 'name')
  if (!name) return { ok: false, fieldErrors: { name: 'El nombre es obligatorio.' } }

  return id
    ? run(() => updateSport(id, { name }), `Deporte "${name}" actualizado.`, ['name'])
    : run(() => createSport({ name }), `Deporte "${name}" creado.`, ['name'])
}

export async function setSportActiveAction(id: number, isActive: boolean): Promise<ConfigResult> {
  return run(
    () => updateSport(id, { is_active: isActive }),
    isActive ? 'Deporte activado.' : 'Deporte desactivado.',
    ['is_active'],
  )
}

export async function deleteSportAction(id: number): Promise<ConfigResult> {
  return run(
    () => deleteSport(id),
    'Deporte dado de baja.',
    [],
    'No se puede dar de baja: el deporte tiene categorías activas. Desactivá primero sus categorías.',
  )
}

/* Posiciones de cada deporte */

export async function savePositionAction(id: number | null, sportId: number, name: string): Promise<ConfigResult> {
  const clean = name.trim().slice(0, 80)
  if (!clean) return { ok: false, fieldErrors: { name: 'Escribí el nombre de la posición.' } }
  return id
    ? run(() => updatePosition(id, { name: clean }), `Posición "${clean}" actualizada.`, ['name'])
    : run(() => createPosition({ sport_id: sportId, name: clean }), `Posición "${clean}" agregada.`, ['name'])
}

export async function setPositionActiveAction(id: number, isActive: boolean): Promise<ConfigResult> {
  return isActive
    ? run(() => updatePosition(id, { is_active: true }), 'Posición activada.', [])
    : run(() => deletePosition(id), 'Posición desactivada: ya no aparece al cargar jugadores.', [])
}

/* Temporadas */

const SEASON_FIELDS = ['sport_id', 'name', 'start_date', 'end_date', 'status']

export async function saveSeasonAction(id: number | null, formData: FormData): Promise<ConfigResult> {
  // Vacío: temporada de todo el club.
  const sport = text(formData, 'sport_id')
  const input: SeasonInput = {
    sport_id: sport ? Number(sport) : null,
    name: text(formData, 'name'),
    start_date: text(formData, 'start_date'),
    end_date: text(formData, 'end_date'),
    status: text(formData, 'status') as SeasonStatus,
  }

  const fieldErrors: Record<string, string> = {}
  if (!input.name) fieldErrors.name = 'El nombre es obligatorio.'
  if (!input.start_date) fieldErrors.start_date = 'Elegí la fecha de inicio.'
  if (!input.end_date) fieldErrors.end_date = 'Elegí la fecha de fin.'
  else if (input.start_date && input.end_date < input.start_date) {
    fieldErrors.end_date = 'La fecha de fin tiene que ser igual o posterior al inicio.'
  }
  if (!SEASON_STATUSES.includes(input.status!)) fieldErrors.status = 'Elegí el estado.'
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors }

  return id
    ? run(() => updateSeason(id, input), `Temporada "${input.name}" actualizada.`, SEASON_FIELDS)
    : run(() => createSeason(input), `Temporada "${input.name}" creada.`, SEASON_FIELDS)
}

export async function deleteSeasonAction(id: number): Promise<ConfigResult> {
  return run(
    () => deleteSeason(id),
    'Temporada eliminada.',
    [],
    'No se puede eliminar: la temporada tiene categorías. Si terminó, marcala como cerrada.',
  )
}

/* Categorías */

const CATEGORY_FIELDS = ['sport_id', 'season_id', 'name', 'min_age', 'max_age', 'branch']

export async function saveCategoryAction(id: number | null, formData: FormData): Promise<ConfigResult> {
  const input: CategoryInput = {
    sport_id: Number(text(formData, 'sport_id')) || undefined,
    season_id: Number(text(formData, 'season_id')) || undefined,
    name: text(formData, 'name'),
    min_age: optionalInt(formData, 'min_age'),
    max_age: optionalInt(formData, 'max_age'),
    branch: isBranch(text(formData, 'branch')) ? (text(formData, 'branch') as CategoryInput['branch']) : null,
  }

  const fieldErrors: Record<string, string> = {}
  if (!input.sport_id) fieldErrors.sport_id = 'Elegí el deporte.'
  if (!input.season_id) fieldErrors.season_id = 'Elegí la temporada.'
  if (!input.name) fieldErrors.name = 'El nombre es obligatorio.'
  if (input.min_age != null && input.max_age != null && input.max_age < input.min_age) {
    fieldErrors.max_age = 'La edad máxima no puede ser menor que la mínima.'
  }
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors }

  return id
    ? run(() => updateCategory(id, input), `Categoría "${input.name}" actualizada.`, CATEGORY_FIELDS)
    : run(() => createCategory(input), `Categoría "${input.name}" creada.`, CATEGORY_FIELDS)
}

export async function setCategoryActiveAction(id: number, isActive: boolean): Promise<ConfigResult> {
  return run(
    (): Promise<ApiResult<unknown>> => (isActive ? updateCategory(id, { is_active: true }) : deleteCategory(id)),
    isActive ? 'Categoría activada.' : 'Categoría desactivada.',
    ['is_active'],
  )
}

/* Competencias (FRO-33) */

export async function saveCompetitionAction(id: number | null, input: CompetitionInput): Promise<ConfigResult> {
  const name = input.name.trim()
  const fieldErrors: Record<string, string> = {}
  if (!input.sport_id) fieldErrors.sport_id = 'Elegí el deporte.'
  if (!input.season_id) fieldErrors.season_id = 'Elegí la temporada.'
  if (!name) fieldErrors.name = 'El nombre es obligatorio.'
  input.requirements.forEach((r, i) => {
    if (!r.name.trim()) fieldErrors[`requirements.${i}.name`] = 'Poné el nombre del requisito.'
    if (r.validity_months != null && (!Number.isInteger(r.validity_months) || r.validity_months < 1 || r.validity_months > 120)) {
      fieldErrors[`requirements.${i}.validity_months`] = 'Entre 1 y 120 meses, o vacío si no vence.'
    }
  })
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors }

  const body: CompetitionInput = {
    ...input,
    name,
    organizer: input.organizer?.trim() || null,
    registration_deadline: input.registration_deadline || null,
    requirements: input.requirements.map((r) => ({ ...r, name: r.name.trim() })),
  }

  return id
    ? run(() => updateCompetition(id, body), `Competencia "${name}" actualizada.`, ['*'])
    : run(() => createCompetition(body), `Competencia "${name}" creada.`, ['*'])
}

export async function deleteCompetitionAction(id: number): Promise<ConfigResult> {
  return run(() => deleteCompetition(id), 'Competencia eliminada.', [])
}

export async function copyCompetitionAction(id: number, formData: FormData): Promise<ConfigResult> {
  const seasonId = Number(text(formData, 'season_id'))
  const name = text(formData, 'name')
  const fieldErrors: Record<string, string> = {}
  if (!seasonId) fieldErrors.season_id = 'Elegí la temporada.'
  if (!name) fieldErrors.name = 'El nombre es obligatorio.'
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors }

  // Devuelve el id de la copia: la pantalla la abre para elegir sus categorías.
  const result = await runCall(() => copyCompetition(id, { season_id: seasonId, name, registration_deadline: text(formData, 'registration_deadline') || null }))
  if (!result.ok) return 'kind' in result ? failure(result, ['season_id', 'name', 'registration_deadline']) : { ok: false, error: result.error }
  await revalidateClub()
  return { ok: true, message: `Competencia duplicada como "${name}". Elegí sus categorías.`, id: result.data.data.id }
}

/* Sedes (FRO-39) */

export async function saveVenueAction(
  id: number | null,
  input: { name: string; address: string; latitude: number | null; longitude: number | null; is_active: boolean },
): Promise<ConfigResult> {
  const name = input.name.trim()
  const address = input.address.trim()
  const fieldErrors: Record<string, string> = {}
  if (!name) fieldErrors.name = 'Poné el nombre de la sede.'
  if (!address) fieldErrors.address = 'Buscá y elegí la dirección.'
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors }

  const body = { name, address, latitude: input.latitude, longitude: input.longitude, is_active: input.is_active }
  const fields = ['name', 'address', 'latitude', 'longitude']
  return id
    ? run(() => updateVenue(id, body), `Sede "${name}" actualizada.`, fields)
    : run(() => createVenue(body), `Sede "${name}" creada.`, fields)
}

export async function deleteVenueAction(id: number): Promise<ConfigResult> {
  return run(
    () => deleteVenue(id),
    'Sede eliminada.',
    [],
    'No se puede eliminar: hay partidos programados en esta sede. Cambiales el lugar o desactivala.',
  )
}
