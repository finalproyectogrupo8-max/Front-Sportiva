'use server'

import { revalidatePath } from 'next/cache'
import type { ApiFailure, ApiResult } from '@/lib/api/client'
import {
  createCategory,
  createSeason,
  createSport,
  deleteCategory,
  deleteClubLogo,
  deleteSeason,
  deleteSport,
  updateCategory,
  updateClub,
  updateSeason,
  updateSport,
  uploadClubLogo,
  type CategoryInput,
  type SeasonInput,
  type SeasonStatus,
} from '@/lib/api/club'
import { fieldError } from '@/lib/api/validation-messages'
import { requireSession } from '@/lib/session'

// Configuración del club (FRO-16). Cada acción devuelve el resultado al formulario: los 422 van
// a cada campo y el 409 ("está en uso") como mensaje general. La API valida los permisos.

export type ConfigResult =
  | { ok: true; message: string }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }

const SEASON_STATUSES: SeasonStatus[] = ['planned', 'active', 'closed']
const MAX_LOGO_BYTES = 1024 * 1024

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim()
}

/** Número entero o null si el campo quedó vacío. NaN si no es un número (lo rechaza la API). */
function optionalInt(formData: FormData, key: string): number | null {
  const value = text(formData, key)
  return value === '' ? null : Number(value)
}

function failure(result: ApiFailure, fields: string[], inUse?: string): ConfigResult {
  if (result.kind === 'validation') {
    const fieldErrors: Record<string, string> = {}
    for (const field of fields) {
      const message = fieldError(result.errors, field)
      if (message) fieldErrors[field] = message
    }
    return Object.keys(fieldErrors).length > 0
      ? { ok: false, fieldErrors }
      : { ok: false, error: result.message }
  }
  if (result.kind === 'forbidden') return { ok: false, error: 'No tenés permiso para hacer este cambio.' }
  if (result.status === 409 && inUse) return { ok: false, error: inUse }
  if (result.status === 404) return { ok: false, error: 'Ya no existe. Recargá la página.' }
  return { ok: false, error: result.message || 'No se pudo guardar. Probá de nuevo.' }
}

async function run<T>(
  call: () => Promise<ApiResult<T>>,
  done: string,
  fields: string[],
  inUse?: string,
): Promise<ConfigResult> {
  const session = await requireSession()

  let result: ApiResult<T>
  try {
    result = await call()
  } catch {
    return { ok: false, error: 'No pudimos conectar con el servidor. Probá de nuevo en unos minutos.' }
  }
  if (!result.ok) return failure(result, fields, inUse)

  // El layout del club (top bar, escudo, color) y los selectores de los módulos leen estos datos.
  if (session.tenant) revalidatePath(`/c/${session.tenant.slug}`, 'layout')
  return { ok: true, message: done }
}

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

/* Temporadas */

const SEASON_FIELDS = ['name', 'start_date', 'end_date', 'status']

export async function saveSeasonAction(id: number | null, formData: FormData): Promise<ConfigResult> {
  const input: SeasonInput = {
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

const CATEGORY_FIELDS = ['sport_id', 'season_id', 'name', 'min_age', 'max_age']

export async function saveCategoryAction(id: number | null, formData: FormData): Promise<ConfigResult> {
  const input: CategoryInput = {
    sport_id: Number(text(formData, 'sport_id')) || undefined,
    season_id: Number(text(formData, 'season_id')) || undefined,
    name: text(formData, 'name'),
    min_age: optionalInt(formData, 'min_age'),
    max_age: optionalInt(formData, 'max_age'),
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
