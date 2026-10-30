'use server'

import { revalidatePath } from 'next/cache'
import {
  createTenantMembership,
  getAdminTenants,
  getAdminUsers,
  getTenantRoles,
  getUserMemberships,
  updateTenantMembership,
  type ClubRole,
} from '@/lib/api/admin'
import { fieldError } from '@/lib/api/validation-messages'
import { requirePlatformAdmin } from '@/lib/session'

export type UserOption = { id: number; name: string; email: string }

/** Usuarios activos que coinciden con la búsqueda (nombre o email), para el selector de miembros. */
export async function searchUsersAction(search: string): Promise<UserOption[]> {
  await requirePlatformAdmin()

  const term = search.trim()
  if (term.length < 2) return []

  try {
    const result = await getAdminUsers({ search: term, is_active: true, per_page: 8, sort: 'name' })
    if (!result.ok) return []
    return result.data.data.map(({ id, name, email }) => ({ id, name, email }))
  } catch {
    return []
  }
}

export type ClubOption = { id: number; name: string; slug: string }

/** Club del que el usuario ya es miembro (su membresía puede estar desactivada). */
export type UserClub = ClubOption & { membershipActive: boolean; clubStatus: string }

export type ClubsForUser =
  | { ok: true; available: ClubOption[]; memberOf: UserClub[] }
  | { ok: false; error: string }

/**
 * Clubes del usuario (`memberOf`, en cualquier estado) y clubes activos a los que todavía se lo puede
 * asociar (`available`). Los que ya tiene no se ofrecen de nuevo: la API daría 422.
 */
export async function listClubsForUserAction(userId: number): Promise<ClubsForUser> {
  await requirePlatformAdmin()

  try {
    const [clubs, memberships] = await Promise.all([
      getAdminTenants({ status: 'active', per_page: 100, sort: 'name' }),
      getUserMemberships(userId, { per_page: 100 }),
    ])
    if (!clubs.ok) return { ok: false, error: clubs.message }
    if (!memberships.ok) return { ok: false, error: memberships.message }

    const memberIds = new Set(memberships.data.data.map((membership) => membership.tenant_id))
    const memberOf: UserClub[] = memberships.data.data
      .filter((membership) => membership.tenant)
      .map((membership) => ({
        id: membership.tenant_id,
        name: membership.tenant!.name,
        slug: membership.tenant!.slug,
        clubStatus: membership.tenant!.status,
        membershipActive: membership.is_active,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))

    return {
      ok: true,
      available: clubs.data.data
        .filter((club) => !memberIds.has(club.id))
        .map(({ id, name, slug }) => ({ id, name, slug })),
      memberOf,
    }
  } catch {
    return { ok: false, error: 'No pudimos conectar con el servidor.' }
  }
}

export type ClubRolesResult = { ok: true; roles: ClubRole[] } | { ok: false; error: string }

/** Roles del club para elegir al dar acceso (estándar primero). */
export async function listTenantRolesAction(tenantId: number): Promise<ClubRolesResult> {
  await requirePlatformAdmin()

  try {
    const result = await getTenantRoles(tenantId)
    if (!result.ok) return { ok: false, error: result.message || 'No se pudieron cargar los roles del club.' }
    return { ok: true, roles: result.data.data }
  } catch {
    return { ok: false, error: 'No pudimos conectar con el servidor.' }
  }
}

/** Roles elegidos en un formulario (checkboxes `roles`), sin repetidos ni vacíos. */
function rolesFrom(formData: FormData): string[] {
  return [...new Set(formData.getAll('roles').map(String).filter(Boolean))]
}

/** Primer error de validación de `roles` o de alguno de sus elementos (`roles.0`...). */
function rolesError(errors: Record<string, string[]> | undefined): string | undefined {
  if (!errors) return undefined
  const key = Object.keys(errors).find((name) => name === 'roles' || name.startsWith('roles.'))
  return key ? fieldError(errors, key) : undefined
}

/** Asocia un usuario a un club con los roles del club indicados. */
export async function associateUserAction(
  tenantId: number,
  userId: number,
  roles: string[],
): Promise<{ ok: boolean; error?: string }> {
  await requirePlatformAdmin()

  if (roles.length === 0) return { ok: false, error: 'Elegí al menos un rol.' }

  let result
  try {
    result = await createTenantMembership(tenantId, { user_id: userId, roles })
  } catch {
    return { ok: false, error: 'No pudimos conectar con el servidor.' }
  }

  if (!result.ok) {
    if (result.kind === 'validation') {
      return { ok: false, error: fieldError(result.errors, 'user_id') ?? rolesError(result.errors) }
    }
    return { ok: false, error: result.message || 'No se pudo asociar el usuario.' }
  }

  revalidatePath(`/admin/clubes/${tenantId}`)
  return { ok: true }
}

export type AddMembershipState = {
  ok?: boolean
  message?: string
  error?: string
  fieldErrors?: { user_id?: string; roles?: string }
  /** Club al que se asoció el usuario (para linkear a su detalle). */
  tenantId?: number
  timestamp?: number
}

export async function addMembershipAction(
  _prev: AddMembershipState,
  formData: FormData,
): Promise<AddMembershipState> {
  await requirePlatformAdmin()

  const tenantId = Number(formData.get('tenant_id'))
  const userId = Number(formData.get('user_id'))
  const roles = rolesFrom(formData)

  const fieldErrors: AddMembershipState['fieldErrors'] = {}
  if (!Number.isInteger(userId) || userId <= 0) fieldErrors.user_id = 'Elegí un usuario.'
  if (roles.length === 0) fieldErrors.roles = 'Elegí al menos un rol.'
  if (!Number.isInteger(tenantId) || tenantId <= 0) return { ok: false, error: 'Club inválido.' }
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors }

  let result
  try {
    result = await createTenantMembership(tenantId, { user_id: userId, roles })
  } catch {
    return { ok: false, error: 'No pudimos conectar con el servidor. Probá de nuevo en unos minutos.' }
  }

  if (!result.ok) {
    if (result.kind === 'validation') {
      return {
        ok: false,
        fieldErrors: { user_id: fieldError(result.errors, 'user_id'), roles: rolesError(result.errors) },
      }
    }
    if (result.kind === 'forbidden') {
      return { ok: false, error: 'No tenés permisos de administración para realizar esta acción.' }
    }
    if (result.status === 404) {
      return { ok: false, error: 'El club ya no existe.' }
    }
    return { ok: false, error: result.message || 'No se pudo agregar el miembro. Probá de nuevo.' }
  }

  revalidatePath(`/admin/clubes/${tenantId}`)

  return { ok: true, message: 'Miembro agregado al club.', tenantId, timestamp: Date.now() }
}

export type ToggleMembershipResult = { ok: boolean; error?: string }

/** Activa o desactiva una membresía. Desactivar revoca el acceso del usuario a ese club. */
export async function setMembershipActiveAction(
  tenantId: number,
  membershipId: number,
  isActive: boolean,
): Promise<ToggleMembershipResult> {
  await requirePlatformAdmin()

  let result
  try {
    result = await updateTenantMembership(tenantId, membershipId, { is_active: isActive })
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor.' }
  }

  if (!result.ok) {
    return { ok: false, error: result.message || 'No se pudo actualizar la membresía.' }
  }

  revalidatePath(`/admin/clubes/${tenantId}`)
  return { ok: true }
}

export type UpdateRolesState = {
  ok?: boolean
  error?: string
  timestamp?: number
}

/** Reemplaza los roles de un miembro del club (checkboxes `roles`). */
export async function updateMembershipRolesAction(
  _prev: UpdateRolesState,
  formData: FormData,
): Promise<UpdateRolesState> {
  await requirePlatformAdmin()

  const tenantId = Number(formData.get('tenant_id'))
  const membershipId = Number(formData.get('membership_id'))
  const roles = rolesFrom(formData)

  if (!Number.isInteger(tenantId) || tenantId <= 0 || !Number.isInteger(membershipId) || membershipId <= 0) {
    return { ok: false, error: 'Membresía inválida.' }
  }
  if (roles.length === 0) return { ok: false, error: 'Elegí al menos un rol.' }

  let result
  try {
    result = await updateTenantMembership(tenantId, membershipId, { roles })
  } catch {
    return { ok: false, error: 'No pudimos conectar con el servidor.' }
  }

  if (!result.ok) {
    if (result.kind === 'validation') return { ok: false, error: rolesError(result.errors) ?? result.message }
    return { ok: false, error: result.message || 'No se pudieron guardar los roles.' }
  }

  revalidatePath(`/admin/clubes/${tenantId}`)
  return { ok: true, timestamp: Date.now() }
}
