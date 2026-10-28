'use server'

import { revalidatePath } from 'next/cache'
import { requirePlatformAdmin } from '@/lib/session'
import { updateTicket } from '@/lib/api/admin'
import { validateUpdateTicketFields } from '@/lib/admin-validation'
import type { AdminActionState, SupportTicketStatus } from '@/lib/admin-types'

export async function updateTicketAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requirePlatformAdmin()

  const id = String(formData.get('id') ?? '').trim()
  if (!id) {
    return {
      ok: false,
      message: 'Falta el identificador del ticket.',
    }
  }

  const status = String(formData.get('status') ?? '').trim()
  const adminNotesRaw = formData.get('admin_notes')
  const admin_notes = adminNotesRaw !== null ? String(adminNotesRaw).trim() : undefined

  const errors = validateUpdateTicketFields({
    status: status || undefined,
    admin_notes,
  })

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      message: 'Revisá los datos ingresados.',
    }
  }

  try {
    await updateTicket(id, {
      status: status ? (status as SupportTicketStatus) : undefined,
      admin_notes: admin_notes !== undefined ? (admin_notes || null) : undefined,
    })

    revalidatePath('/admin')
    revalidatePath('/admin/tickets')

    return {
      ok: true,
      message: 'Ticket actualizado correctamente.',
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Error al actualizar el ticket.',
    }
  }
}
