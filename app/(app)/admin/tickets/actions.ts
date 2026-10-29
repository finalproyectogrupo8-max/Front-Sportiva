'use server'

import { revalidatePath } from 'next/cache'
import { requirePlatformAdmin } from '@/lib/session'
import { updateAdminTicket } from '@/lib/api/admin'
import { validateUpdateTicketFields } from '@/lib/admin-validation'
import type { AdminActionState, SupportTicketStatus } from '@/lib/admin-types'

export async function updateTicketAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requirePlatformAdmin()

  const idRaw = String(formData.get('id') ?? '').trim()
  const ticketId = parseInt(idRaw, 10)
  if (!idRaw || isNaN(ticketId) || ticketId <= 0) {
    return {
      ok: false,
      message: 'Falta un identificador de ticket válido.',
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
    const result = await updateAdminTicket(ticketId, {
      status: status ? (status as SupportTicketStatus) : undefined,
      admin_notes: admin_notes !== undefined ? (admin_notes || null) : undefined,
    })

    if (!result.ok) {
      if (result.kind === 'validation') {
        return {
          ok: false,
          errors: result.errors,
          message: result.message || 'Revisá los datos ingresados.',
        }
      }
      return {
        ok: false,
        message: result.message || 'Error al actualizar el ticket.',
      }
    }

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
