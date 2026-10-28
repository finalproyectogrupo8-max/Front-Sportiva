'use server'

import { revalidatePath } from 'next/cache'
import {
  createAdminTenant,
  retryAdminTenant,
  updateAdminTenant,
} from '@/lib/api/admin'
import { requirePlatformAdmin } from '@/lib/session'

export type CreateTenantState = {
  ok?: boolean
  message?: string
  error?: string
  fieldErrors?: {
    name?: string
    slug?: string
  }
  values?: {
    name?: string
    slug?: string
  }
  timestamp?: number
}

const SLUG_REGEX = /^[a-z0-9_-]+$/

export async function createTenantAction(
  _prev: CreateTenantState,
  formData: FormData,
): Promise<CreateTenantState> {
  await requirePlatformAdmin()

  const name = String(formData.get('name') ?? '').trim()
  const rawSlug = String(formData.get('slug') ?? '').trim().toLowerCase()

  const fieldErrors: { name?: string; slug?: string } = {}

  if (!name) {
    fieldErrors.name = 'El nombre del club es obligatorio.'
  }

  if (!rawSlug) {
    fieldErrors.slug = 'El identificador (slug) es obligatorio.'
  } else if (!SLUG_REGEX.test(rawSlug)) {
    fieldErrors.slug = 'El slug solo puede contener letras minúsculas, números, guiones y guiones bajos.'
  } else if (rawSlug.length > 50) {
    fieldErrors.slug = 'El slug no puede tener más de 50 caracteres.'
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, values: { name, slug: rawSlug } }
  }

  let result
  try {
    result = await createAdminTenant({ name, slug: rawSlug })
  } catch {
    return {
      ok: false,
      error: 'No pudimos conectar con el servidor. Probá de nuevo en unos minutos.',
      values: { name, slug: rawSlug },
    }
  }

  if (!result.ok) {
    if (result.kind === 'validation') {
      return {
        ok: false,
        fieldErrors: {
          name: result.errors.name?.[0],
          slug: result.errors.slug?.[0],
        },
        values: { name, slug: rawSlug },
      }
    }

    if (result.kind === 'forbidden') {
      return {
        ok: false,
        error: 'No tenés permisos de administración para realizar esta acción.',
        values: { name, slug: rawSlug },
      }
    }

    return {
      ok: false,
      error: result.message || 'No se pudo crear el club. Probá de nuevo.',
      values: { name, slug: rawSlug },
    }
  }

  revalidatePath('/admin/clubes')
  revalidatePath('/admin')
  revalidatePath('/clubes')

  return {
    ok: true,
    message: `Club "${result.data.data.name}" creado correctamente en estado de provisión.`,
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

