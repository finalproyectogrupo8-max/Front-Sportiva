'use server'

import { revalidatePath } from 'next/cache'
import {
  createTenantRole,
  deleteTenantRole,
  duplicateTenantRole,
  updateTenantRole,
  type RolePermission,
} from '@/lib/api/admin'
import { fieldError } from '@/lib/api/validation-messages'
import { requirePlatformAdmin } from '@/lib/session'

export type SaveRoleState = {
  ok?: boolean
  error?: string
  fieldErrors?: { name?: string; description?: string; permissions?: string }
  /** Slug del rol guardado. */
  slug?: string
  timestamp?: number
}

function parsePermissions(raw: FormDataEntryValue | null): RolePermission[] | null {
  try {
    const value = JSON.parse(String(raw ?? '[]'))
    if (!Array.isArray(value)) return null
    return value
      .filter((item) => item && typeof item.name === 'string' && (item.scope === 'all' || item.scope === 'sport' || item.scope === 'own'))
      .map((item) => ({ name: item.name, scope: item.scope }))
  } catch {
    return null
  }
}

/** Primer error de `permissions` o de alguno de sus elementos (`permissions.3.name`...). */
function permissionsError(errors: Record<string, string[]>): string | undefined {
  const key = Object.keys(errors).find((name) => name === 'permissions' || name.startsWith('permissions.'))
  return key ? fieldError(errors, key) : undefined
}

/** Crea un rol custom o, con `slug`, edita uno existente. Los permisos llegan como JSON. */
export async function saveRoleAction(_prev: SaveRoleState, formData: FormData): Promise<SaveRoleState> {
  await requirePlatformAdmin()

  const tenantId = Number(formData.get('tenant_id'))
  const slug = String(formData.get('slug') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const permissions = parsePermissions(formData.get('permissions'))

  if (!Number.isInteger(tenantId) || tenantId <= 0) return { ok: false, error: 'Club inválido.' }

  const fieldErrors: SaveRoleState['fieldErrors'] = {}
  if (name.length < 2) fieldErrors.name = 'Poné un nombre de al menos 2 letras.'
  if (!permissions || permissions.length === 0) fieldErrors.permissions = 'Elegí al menos un permiso.'
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors }

  const data = { name, description: description || null, permissions: permissions! }

  let result
  try {
    result = slug ? await updateTenantRole(tenantId, slug, data) : await createTenantRole(tenantId, data)
  } catch {
    return { ok: false, error: 'No pudimos conectar con el servidor.' }
  }

  if (!result.ok) {
    if (result.kind === 'validation') {
      return {
        ok: false,
        fieldErrors: {
          name: fieldError(result.errors, 'name'),
          description: fieldError(result.errors, 'description'),
          permissions: permissionsError(result.errors),
        },
      }
    }
    return { ok: false, error: result.message || 'No se pudo guardar el rol.' }
  }

  revalidatePath(`/admin/clubes/${tenantId}`)
  return { ok: true, slug: result.data.data.slug, timestamp: Date.now() }
}

export type RoleActionResult = { ok: boolean; error?: string; name?: string }

/** Copia un rol como rol custom nuevo. */
export async function duplicateRoleAction(tenantId: number, slug: string): Promise<RoleActionResult> {
  await requirePlatformAdmin()

  try {
    const result = await duplicateTenantRole(tenantId, slug)
    if (!result.ok) {
      const error = result.kind === 'validation' ? permissionsError(result.errors) : undefined
      return { ok: false, error: error ?? result.message ?? 'No se pudo duplicar el rol.' }
    }
    revalidatePath(`/admin/clubes/${tenantId}`)
    return { ok: true, name: result.data.data.name }
  } catch {
    return { ok: false, error: 'No pudimos conectar con el servidor.' }
  }
}

/** Borra un rol custom. La API responde 409 si alguien lo tiene asignado. */
export async function deleteRoleAction(tenantId: number, slug: string): Promise<RoleActionResult> {
  await requirePlatformAdmin()

  try {
    const result = await deleteTenantRole(tenantId, slug)
    if (!result.ok) return { ok: false, error: result.message || 'No se pudo borrar el rol.' }
    revalidatePath(`/admin/clubes/${tenantId}`)
    return { ok: true }
  } catch {
    return { ok: false, error: 'No pudimos conectar con el servidor.' }
  }
}
