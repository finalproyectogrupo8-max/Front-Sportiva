'use server'

import { revalidatePath } from 'next/cache'
import { createAdminUser, resendAdminUserInvite, sendAdminPasswordReset, updateAdminUser } from '@/lib/api/admin'
import { fieldError } from '@/lib/api/validation-messages'
import { requirePlatformAdmin } from '@/lib/session'

export type CreateUserState = {
  ok?: boolean
  message?: string
  error?: string
  fieldErrors?: {
    name?: string
    email?: string
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

  // Pre-validaciones básicas en servidor
  const fieldErrors: { name?: string; email?: string } = {}
  if (!name) {
    fieldErrors.name = 'El nombre es obligatorio.'
  }
  if (!email) {
    fieldErrors.email = 'El email es obligatorio.'
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, values: { name, email } }
  }

  let result
  try {
    result = await createAdminUser({ name, email })
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
    message: `Enviamos una invitación a ${result.data.data.email}.`,
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

export async function resendAdminInviteAction(
  userId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requirePlatformAdmin()
  if (!Number.isInteger(userId) || userId <= 0) {
    return { ok: false, error: 'El usuario seleccionado no es válido.' }
  }

  let result
  try {
    result = await resendAdminUserInvite(userId)
  } catch {
    return { ok: false, error: 'No pudimos conectar con el servidor. Probá de nuevo en unos minutos.' }
  }

  if (!result.ok) {
    if (result.status === 409) {
      return { ok: false, error: 'La invitación ya no está pendiente. Refrescá la lista.' }
    }
    if (result.kind === 'rate_limited') {
      const retryMessage = result.retryAfter
        ? ` Probá de nuevo en ${result.retryAfter} segundos.`
        : ' Esperá un rato antes de intentar de nuevo.'
      return { ok: false, error: `Alcanzaste el límite de reenvíos.${retryMessage}` }
    }
    if (result.kind === 'forbidden') {
      return { ok: false, error: 'No tenés permisos para reenviar esta invitación.' }
    }
    return { ok: false, error: 'No se pudo reenviar la invitación. Probá de nuevo.' }
  }

  revalidatePath('/admin/usuarios')
  return { ok: true }
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
