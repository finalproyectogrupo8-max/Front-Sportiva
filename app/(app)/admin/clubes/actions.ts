'use server'

import { revalidatePath } from 'next/cache'
import {
  createAdminTenant,
  getAdminTenant,
  retryAdminTenant,
  updateAdminTenant,
} from '@/lib/api/admin'
import { fieldError } from '@/lib/api/validation-messages'
import { requirePlatformAdmin } from '@/lib/session'

export type CreateTenantState = {
  ok?: boolean
  message?: string
  error?: string
  fieldErrors?: {
    name?: string
    slug?: string
    admin_name?: string
    admin_email?: string
  }
  values?: {
    name?: string
    slug?: string
    admin_name?: string
    admin_email?: string
  }
  /** Club creado: el panel muestra su estado y el link a sus miembros. */
  tenant?: { id: number; name: string; slug: string; status: string }
  timestamp?: number
}

// Igual que la API: solo minúsculas, números y guion bajo (el slug es parte del nombre de la base).
const SLUG_REGEX = /^[a-z0-9_]+$/

export async function createTenantAction(
  _prev: CreateTenantState,
  formData: FormData,
): Promise<CreateTenantState> {
  await requirePlatformAdmin()

  const name = String(formData.get('name') ?? '').trim()
  const rawSlug = String(formData.get('slug') ?? '').trim().toLowerCase()
  const adminName = String(formData.get('admin_name') ?? '').trim()
  const adminEmail = String(formData.get('admin_email') ?? '').trim()
  const values = { name, slug: rawSlug, admin_name: adminName, admin_email: adminEmail }

  const fieldErrors: NonNullable<CreateTenantState['fieldErrors']> = {}

  if (!name) {
    fieldErrors.name = 'El nombre del club es obligatorio.'
  }

  if (!rawSlug) {
    fieldErrors.slug = 'El identificador (slug) es obligatorio.'
  } else if (!SLUG_REGEX.test(rawSlug)) {
    fieldErrors.slug = 'El slug solo puede tener letras minúsculas, números y guion bajo (_).'
  } else if (rawSlug.length > 50) {
    fieldErrors.slug = 'El slug no puede tener más de 50 caracteres.'
  }

  if (!adminName) fieldErrors.admin_name = 'El nombre del administrador es obligatorio.'
  if (!adminEmail) fieldErrors.admin_email = 'El email del administrador es obligatorio.'

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, values }
  }

  // La API crea el club, el usuario y su membresía de administrador en una sola transacción.
  let result
  try {
    result = await createAdminTenant({
      name,
      slug: rawSlug,
      admin: { name: adminName, email: adminEmail },
    })
  } catch {
    return {
      ok: false,
      error: 'No pudimos conectar con el servidor. Probá de nuevo en unos minutos.',
      values,
    }
  }

  if (!result.ok) {
    if (result.kind === 'validation') {
      return {
        ok: false,
        fieldErrors: {
          name: fieldError(result.errors, 'name'),
          slug: fieldError(result.errors, 'slug'),
          admin_name: fieldError(result.errors, 'admin.name'),
          admin_email: fieldError(result.errors, 'admin.email'),
        },
        values,
      }
    }

    if (result.kind === 'forbidden') {
      return {
        ok: false,
        error: 'No tenés permisos de administración para realizar esta acción.',
        values,
      }
    }

    return {
      ok: false,
      error: result.message || 'No se pudo crear el club. Probá de nuevo.',
      values,
    }
  }

  revalidatePath('/admin/clubes')
  revalidatePath('/admin/usuarios')
  revalidatePath('/clubes')

  return {
    ok: true,
    message:
      result.data.data.status === 'provisioning'
        ? `Club "${result.data.data.name}" creado. Estamos preparando su base de datos.`
        : `Club "${result.data.data.name}" creado.`,
    tenant: {
      id: result.data.data.id,
      name: result.data.data.name,
      slug: result.data.data.slug,
      status: result.data.data.status,
    },
    timestamp: Date.now(),
  }
}

export type UpdateTenantStatusResult = {
  ok: boolean
  error?: string
  status?: string
}

export async function updateTenantStatusAction(
  tenantId: number,
  newStatus: 'active' | 'suspended',
): Promise<UpdateTenantStatusResult> {
  await requirePlatformAdmin()

  let result
  try {
    result = await updateAdminTenant(tenantId, { status: newStatus })
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor.' }
  }

  if (!result.ok) {
    return {
      ok: false,
      error: result.message || 'No se pudo cambiar el estado del club.',
    }
  }

  revalidatePath('/admin/clubes')
  revalidatePath('/clubes')
  return { ok: true, status: result.data.data.status }
}

export type RetryTenantResult = {
  ok: boolean
  error?: string
  status?: string
}

export async function retryTenantAction(tenantId: number): Promise<RetryTenantResult> {
  await requirePlatformAdmin()

  let result
  try {
    result = await retryAdminTenant(tenantId)
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor.' }
  }

  if (!result.ok) {
    return {
      ok: false,
      error: result.message || 'No se pudo reintentar el aprovisionamiento del club.',
    }
  }

  revalidatePath('/admin/clubes')
  revalidatePath('/clubes')
  return { ok: true, status: result.data.data.status }
}


/**
 * Estado actual de los clubes indicados (`GET /api/admin/tenants/{id}` de cada uno).
 * Lo usa el polling mientras un club está en `provisioning`. Si falla una consulta, ese club se omite.
 */
export async function getTenantStatusesAction(
  tenantIds: number[],
): Promise<Record<number, string>> {
  await requirePlatformAdmin()

  const statuses: Record<number, string> = {}
  await Promise.all(
    tenantIds.slice(0, 50).map(async (id) => {
      try {
        const result = await getAdminTenant(id)
        if (result.ok) statuses[id] = result.data.data.status
      } catch {
        // La API no respondió: se reintenta en el próximo ciclo.
      }
    }),
  )

  return statuses
}
