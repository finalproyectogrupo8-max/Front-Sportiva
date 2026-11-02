'use server'

import { failure, revalidateClub, runCall, type ActionResult } from '@/lib/action-result'
import { inviteMember, updateMember, type InviteInput, type MemberUpdate } from '@/lib/api/team'

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
