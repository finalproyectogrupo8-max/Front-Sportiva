'use server'

import { revalidatePath } from 'next/cache'
import { createAdminUser, sendAdminPasswordReset, updateAdminUser } from '@/lib/api/admin'
import { fieldError } from '@/lib/api/validation-messages'
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
  /** Usuario creado: el panel lo usa para ofrecer asociarlo a clubes. */
  user?: { id: number; name: string; email: string }
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
          name: fieldError(result.errors, 'name'),
          email: fieldError(result.errors, 'email'),
          password: fieldError(result.errors, 'password'),
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
    user: { id: result.data.data.id, name: result.data.data.name, email: result.data.data.email },
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


export type EditResult = { ok: true; message: string } | { ok: false; error?: string; fieldErrors?: Record<string, string> }

/** Edita nombre y email de un usuario. */
export async function updateUserAction(userId: number, input: { name: string; email: string }): Promise<EditResult> {
  await requirePlatformAdmin()
  let result
  try {
    result = await updateAdminUser(userId, input)
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor.' }
  }
  if (!result.ok) {
    if (result.kind === 'validation') {
      const fieldErrors: Record<string, string> = {}
      for (const f of ['name', 'email']) {
        const message = fieldError(result.errors, f)
        if (message) fieldErrors[f] = message
      }
      return { ok: false, fieldErrors }
    }
    return { ok: false, error: result.message || 'No se pudo guardar el usuario.' }
  }
  revalidatePath('/admin/usuarios')
  return { ok: true, message: 'Usuario actualizado.' }
}

/** Le manda al usuario el mail para elegir una contraseña nueva. */
export async function sendPasswordResetAction(userId: number): Promise<EditResult> {
  await requirePlatformAdmin()
  try {
    const result = await sendAdminPasswordReset(userId)
    if (!result.ok) return { ok: false, error: result.message || 'No se pudo mandar el mail.' }
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor.' }
  }
  return { ok: true, message: 'Le mandamos el mail para restablecer la contraseña.' }
}
