'use server'

import { revalidatePath } from 'next/cache'
import { createTicket } from '@/lib/api/tickets'
import { validateTicketFields } from '@/lib/admin-validation'
import type { AdminActionState } from '@/lib/admin-types'

/**
 * Server Action pública para enviar un ticket de soporte/contacto.
 * Sin guard de admin para permitir envíos desde formularios públicos.
 */
export async function submitTicket(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  // Campo honeypot oculto para protección antispam básica: si viene completo,
  // fingimos éxito sin guardar el ticket.
  const honeypot = String(formData.get('hp') ?? '').trim()
  if (honeypot) {
    return {
      ok: true,
      message: '¡Gracias por contactarnos! Tu mensaje fue recibido correctamente.',
    }
  }

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const club_name = String(formData.get('club_name') ?? '').trim()
  const subject = String(formData.get('subject') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()

  const errors = validateTicketFields({ name, email, club_name, subject, message })
  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      message: 'Revisá los campos marcados para continuar.',
    }
  }

  try {
    await createTicket({
      name,
      email,
      club_name: club_name || null,
      subject,
      message,
    })

    revalidatePath('/admin/tickets')
    revalidatePath('/admin')

    return {
      ok: true,
      message: '¡Gracias por contactarnos! Recibimos tu consulta y te responderemos a la brevedad.',
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No pudimos enviar tu mensaje. Probá de nuevo.',
    }
  }
}
