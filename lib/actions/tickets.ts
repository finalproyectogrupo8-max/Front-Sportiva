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
  // Campo honeypot oculto ('website'): si viene completo,
  // la API de Laravel lo detecta y rechaza silenciosamente devolviendo id 0.
  const website = String(formData.get('website') ?? formData.get('hp') ?? '').trim()

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const club_name = String(formData.get('club_name') ?? '').trim()
  const subject = String(formData.get('subject') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()

  const errors = validateTicketFields({ name, email, club_name, subject, message, website })
  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      errors,
      message: 'Revisá los campos marcados para continuar.',
    }
  }

  try {
    const result = await createTicket({
      name,
      email,
      club_name: club_name || null,
      subject,
      message,
      website: website || null,
    })

    if (!result.ok) {
      if (result.kind === 'validation') {
        return {
          ok: false,
          errors: result.errors,
          message: result.message || 'Revisá los campos marcados para continuar.',
        }
      }

      if (result.kind === 'rate_limited') {
        const retryText = result.retryAfter
          ? ` Por favor esperá ${result.retryAfter} segundos antes de reintentar.`
          : ' Por favor esperá unos minutos antes de volver a enviar.'
        return {
          ok: false,
          message: `Demasiados intentos de envío.${retryText}`,
        }
      }

      return {
        ok: false,
        message: result.message || 'No pudimos enviar tu mensaje. Probá de nuevo.',
      }
    }

    revalidatePath('/admin')
    revalidatePath('/admin/tickets')

    return {
      ok: true,
      message: '¡Gracias por contactarnos! Recibimos tu consulta y te responderemos a la brevedad.',
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No pudimos conectar con el servidor. Probá de nuevo más tarde.',
    }
  }
}

const DEFAULT_DEMO_MESSAGE = 'Quiero solicitar una demo de Sportiva para mi club.'

/** Igual que AdminActionState, más lo que escribió la persona para no perderlo si hay error. */
export type DemoRequestState = AdminActionState & {
  values?: { name: string; email: string; message: string }
}

/**
 * Formularios de la landing (home y /contacto): siempre terminan en un ticket,
 * que el admin ve en /admin/tickets. Completa asunto y mensaje cuando el
 * formulario no los tiene (la home solo pide nombre y email).
 */
export async function submitDemoRequest(
  prev: DemoRequestState,
  formData: FormData,
): Promise<DemoRequestState> {
  const data = new FormData()
  for (const field of ['name', 'email', 'club_name', 'website'] as const) {
    data.set(field, String(formData.get(field) ?? ''))
  }

  const subject = String(formData.get('subject') ?? '').trim() || 'Solicitud de demo'
  const message = String(formData.get('message') ?? '').trim()
  data.set('subject', subject)
  data.set('message', message || DEFAULT_DEMO_MESSAGE)

  const result = await submitTicket(prev, data)
  if (result.ok) {
    return { ok: true, message: 'Consulta recibida. Pronto vamos a hablar sobre tu club.' }
  }

  return {
    ...result,
    values: {
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      message,
    },
  }
}
