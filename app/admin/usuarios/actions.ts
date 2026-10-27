'use server'

import { revalidatePath } from 'next/cache'
import { createAdminUser, updateAdminUser } from '@/lib/api/admin'
import { requirePlatformAdmin } from '@/lib/session'

export type CreateUserState = {
  ok?: boolean
  message?: string
  error?: string
  fieldErrors?: {
    name?: string
    email?: string
    password?: string
  }
  values?: {
    name?: string
    email?: string
  }
  timestamp?: number
}

export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  await requirePlatformAdmin()

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  // Pre-validaciones básicas en servidor
  const fieldErrors: { name?: string; email?: string; password?: string } = {}
  if (!name) {
    fieldErrors.name = 'El nombre es obligatorio.'
  }
  if (!email) {
    fieldErrors.email = 'El email es obligatorio.'
  }
  if (!password) {
    fieldErrors.password = 'La contraseña es obligatoria.'
  } else if (password.length < 12) {
    fieldErrors.password = 'La contraseña debe tener al menos 12 caracteres.'
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, values: { name, email } }
  }

  let result
  try {
    result = await createAdminUser({ name, email, password })
  } catch {
    return {
      ok: false,
      error: 'No pudimos conectar con el servidor. Probá de nuevo en unos minutos.',
      values: { name, email },
    }
  }

  if (!result.ok) {
    if (result.kind === 'validation') {
      return {
        ok: false,
        fieldErrors: {
          name: result.errors.name?.[0],
          email: result.errors.email?.[0],
          password: result.errors.password?.[0],
        },
        values: { name, email },
      }
    }

    if (result.kind === 'forbidden') {
      return {
        ok: false,
        error: 'No tenés permisos de administración para realizar esta acción.',
        values: { name, email },
      }
    }

    return {
      ok: false,
      error: result.message || 'No se pudo crear el usuario. Probá de nuevo.',
      values: { name, email },
    }
  }

  revalidatePath('/admin/usuarios')
  revalidatePath('/admin')

  return {
    ok: true,
    message: `Usuario ${result.data.data.name} creado correctamente.`,
    timestamp: Date.now(),
  }
}

export type ToggleUserStatusResult = {
  ok: boolean
  error?: string
  is_active?: boolean
}

export async function toggleUserStatusAction(
  userId: number,
  currentStatus: boolean,
): Promise<ToggleUserStatusResult> {
  await requirePlatformAdmin()

  let result
  try {
    result = await updateAdminUser(userId, { is_active: !currentStatus })
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor.' }
  }

  if (!result.ok) {
    return { ok: false, error: result.message || 'No se pudo cambiar el estado del usuario.' }
  }

  revalidatePath('/admin/usuarios')
  return { ok: true, is_active: result.data.data.is_active }
}

