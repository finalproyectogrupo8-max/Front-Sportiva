'use server'

import { redirect } from 'next/navigation'
import { acceptInvite } from '@/lib/api/invitations'

export type AcceptInviteState = {
  error?: string
  fieldErrors?: { password?: string; password_confirmation?: string }
}

const INVALID_INVITE_MESSAGE =
  'El enlace venció o no es válido. Pedile a quien te invitó que te reenvíe la invitación.'

export async function acceptInviteAction(
  _previous: AcceptInviteState,
  formData: FormData,
): Promise<AcceptInviteState> {
  const email = String(formData.get('email') ?? '').trim()
  const token = String(formData.get('token') ?? '')
  const password = String(formData.get('password') ?? '')
  const passwordConfirmation = String(formData.get('password_confirmation') ?? '')
  if (!email || !token) return { error: INVALID_INVITE_MESSAGE }

  const fieldErrors: NonNullable<AcceptInviteState['fieldErrors']> = {}

  if (password.length < 8) fieldErrors.password = 'La contraseña debe tener al menos 8 caracteres.'
  if (password !== passwordConfirmation) {
    fieldErrors.password_confirmation = 'Las contraseñas no coinciden.'
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors }

  let result
  try {
    result = await acceptInvite({
      email,
      token,
      password,
      password_confirmation: passwordConfirmation,
    })
  } catch {
    return { error: 'No pudimos verificar la invitación. Probá de nuevo en unos minutos.' }
  }

  if (!result.ok) {
    if (result.status === 422) return { error: INVALID_INVITE_MESSAGE }
    if (result.kind === 'rate_limited') {
      return { error: 'Hiciste demasiados intentos. Esperá un rato antes de probar de nuevo.' }
    }
    return { error: 'No pudimos aceptar la invitación. Probá de nuevo en unos minutos.' }
  }

  redirect('/login?invitacion=aceptada')
}
