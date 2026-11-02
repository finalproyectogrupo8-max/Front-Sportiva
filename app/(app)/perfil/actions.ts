'use server'

import { revalidatePath } from 'next/cache'
import { failure, runCall, type ActionResult } from '@/lib/action-result'
import { changeMyPassword, logoutOtherSessions, updateMyName } from '@/lib/api/me'

const sessions = (n: number) => (n === 0 ? 'No había otras sesiones abiertas.' : n === 1 ? 'Se cerró 1 sesión en otro dispositivo.' : `Se cerraron ${n} sesiones en otros dispositivos.`)

export async function updateNameAction(name: string): Promise<ActionResult> {
  if (!name.trim()) return { ok: false, fieldErrors: { name: 'Escribí tu nombre.' } }
  const result = await runCall(() => updateMyName(name.trim()))
  if (!result.ok) return 'kind' in result ? failure(result, ['name']) : { ok: false, error: result.error }
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Nombre actualizado.' }
}

export async function changePasswordAction(input: { current_password: string; password: string; password_confirmation: string }): Promise<ActionResult> {
  if (input.password !== input.password_confirmation) return { ok: false, fieldErrors: { password_confirmation: 'Las contraseñas no coinciden.' } }
  const result = await runCall(() => changeMyPassword(input))
  if (!result.ok) return 'kind' in result ? failure(result, ['current_password', 'password', 'password_confirmation']) : { ok: false, error: result.error }
  return { ok: true, message: `Contraseña cambiada. ${sessions(result.data.data.closed_sessions)}` }
}

export async function logoutOthersAction(): Promise<ActionResult> {
  const result = await runCall(() => logoutOtherSessions())
  if (!result.ok) return 'kind' in result ? failure(result, []) : { ok: false, error: result.error }
  return { ok: true, message: sessions(result.data.data.closed_sessions) }
}
