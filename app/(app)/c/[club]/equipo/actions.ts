'use server'

import { revalidatePath } from 'next/cache'
import { createClubTeamUser, resendClubTeamInvite } from '@/lib/api/club-users'
import { fieldError } from '@/lib/api/validation-messages'
import { requireClubSession } from '@/lib/session'

export type InviteClubUserState = {
  ok?: boolean
  message?: string
  error?: string
  fieldErrors?: { name?: string; email?: string; roles?: string }
  values?: { name?: string; email?: string; roles?: string[] }
  timestamp?: number
}

function rolesFrom(formData: FormData): string[] {
  return [...new Set(formData.getAll('roles').map(String).filter(Boolean))]
}

function rolesError(errors: Record<string, string[]>): string | undefined {
  const key = Object.keys(errors).find((field) => field === 'roles' || field.startsWith('roles.'))
  return key ? fieldError(errors, key) : undefined
}

export async function inviteClubUserAction(
  _previous: InviteClubUserState,
  formData: FormData,
): Promise<InviteClubUserState> {
  const session = await requireClubSession()
  const values = {
    name: String(formData.get('name') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim(),
  }
  const roles = rolesFrom(formData)
  const formValues = { ...values, roles }
  const fieldErrors: NonNullable<InviteClubUserState['fieldErrors']> = {}

  if (!session.permissions?.includes('club_users.invite')) {
    return { error: 'No tenés permiso para invitar personas al equipo.', values: formValues }
  }
  if (!values.email) fieldErrors.email = 'El correo electrónico es obligatorio.'
  if (roles.length === 0) fieldErrors.roles = 'Elegí al menos un rol.'
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values: formValues }

  let result
  try {
    result = await createClubTeamUser({
      ...(values.name ? { name: values.name } : {}),
      email: values.email,
      roles,
    })
  } catch {
    return {
      error: 'No pudimos conectar con el servidor. Probá de nuevo en unos minutos.',
      values: formValues,
    }
  }

  if (!result.ok) {
    if (result.kind === 'validation') {
      return {
        fieldErrors: {
          name: fieldError(result.errors, 'name'),
          email: fieldError(result.errors, 'email'),
          roles: rolesError(result.errors),
        },
        values: formValues,
      }
    }
    if (result.kind === 'forbidden') {
      return { error: 'No tenés permiso para asignar alguno de esos roles.', values: formValues }
    }
    if (result.kind === 'rate_limited') {
      return { error: 'Alcanzaste el límite de invitaciones. Esperá un rato y volvé a intentar.', values: formValues }
    }
    return { error: 'No se pudo agregar a la persona al equipo. Probá de nuevo.', values: formValues }
  }

  revalidatePath(`/c/${session.tenant.slug}/equipo`)
  return {
    ok: true,
    message: result.data.meta.invited
      ? `Enviamos una invitación a ${values.email} para que elija su contraseña.`
      : `${values.email} ya tiene acceso al equipo.`,
    timestamp: Date.now(),
  }
}

export async function resendClubInviteAction(
  userId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireClubSession()
  if (!session.permissions?.includes('club_users.update')) {
    return { ok: false, error: 'No tenés permiso para reenviar invitaciones.' }
  }
  if (!Number.isInteger(userId) || userId <= 0) {
    return { ok: false, error: 'La persona seleccionada no es válida.' }
  }

  let result
  try {
    result = await resendClubTeamInvite(userId)
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
      return { ok: false, error: 'No tenés permiso para reenviar esta invitación.' }
    }
    return { ok: false, error: 'No se pudo reenviar la invitación. Probá de nuevo.' }
  }

  revalidatePath(`/c/${session.tenant.slug}/equipo`)
  return { ok: true }
}
