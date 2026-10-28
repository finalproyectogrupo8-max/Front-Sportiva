import 'server-only'

import type { SupportTicket } from '@/lib/admin-types'
import { ticketsStore } from './tickets-store'

/* ==========================================================================
   ENVÍO PÚBLICO DE TICKETS
   Endpoint real (Laravel API):
   - POST /api/tickets (público, sin token)
   ========================================================================== */

export interface CreateTicketInput {
  name: string
  email: string
  club_name?: string | null
  subject: string
  message: string
}

/**
 * Crea un nuevo ticket de soporte/contacto.
 * Por ahora persiste en el store en memoria compartido con el admin;
 * cuando la API de Laravel esté disponible, llamará a POST /api/tickets sin token.
 */
export async function createTicket(input: CreateTicketInput): Promise<SupportTicket> {
  const newTicket: SupportTicket = {
    id: `tkt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim(),
    email: input.email.trim(),
    club_name: input.club_name?.trim() || null,
    subject: input.subject.trim(),
    message: input.message.trim(),
    status: 'new',
    admin_notes: null,
    resolved_at: null,
    created_at: new Date().toISOString(),
  }

  ticketsStore.unshift(newTicket)
  return { ...newTicket }
}
