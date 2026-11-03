'use server'

import { failure, revalidateClub, runCall, type ActionResult } from '@/lib/action-result'
import { inviteMember, resendTeamInvite, updateMember, type InviteInput, type MemberUpdate } from '@/lib/api/team'
import { requireSession } from '@/lib/session'

const LAST_ADMIN = 'Es el único administrador del club: sumá otro administrador antes de sacarle el rol o el acceso.'

export async function inviteMemberAction(input: InviteInput): Promise<ActionResult> {
  if (!input.email.trim()) return { ok: false, fieldErrors: { email: 'Escribí el email.' } }
  if (input.roles.length === 0) return { ok: false, fieldErrors: { roles: 'Elegí al menos un rol.' } }
  const result = await runCall(() => inviteMember({ ...input, email: input.email.trim(), name: input.name?.trim() || null }))
  if (!result.ok) return 'kind' in result ? failure(result, ['email', 'name', 'roles', 'sport_ids']) : { ok: false, error: result.error }
  await revalidateClub()
  return {
    ok: true,
    message: result.data.meta.invited
      ? `Listo: a ${result.data.data.email} le llega un mail para elegir su contraseña.`
      : `${result.data.data.display_name} ya puede entrar al club.`,
  }
}

export async function updateMemberAction(id: number, input: MemberUpdate, done: string): Promise<ActionResult> {
  const result = await runCall(() => updateMember(id, input))
  if (!result.ok) {
    if ('kind' in result && result.status === 409) return { ok: false, error: LAST_ADMIN }
    return 'kind' in result ? failure(result, ['roles', 'sport_ids', 'status']) : { ok: false, error: result.error }
  }
  await revalidateClub()
  return { ok: true, message: done }
}

export async function resendMemberInviteAction(id: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireSession()
  if (!session.permissions?.includes('club_users.update')) {
    return { ok: false, error: 'No tenés permiso para reenviar invitaciones.' }
  }
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: 'La persona seleccionada no es válida.' }
  }

  const result = await runCall(() => resendTeamInvite(id))
  if (!result.ok) {
    if (!('kind' in result)) return { ok: false, error: result.error }
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

  await revalidateClub()
  return { ok: true }
}
