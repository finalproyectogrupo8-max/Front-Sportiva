import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'

export type StoreSupportTicketData = Schemas['StoreSupportTicketRequest']
export type SupportTicketCreated = Schemas['SupportTicketCreatedResource']

/**
 * `POST /tickets`
 * Envío público de tickets de contacto (sin token de autenticación).
 */
export async function createTicket(
  data: StoreSupportTicketData,
): Promise<ApiResult<{ data: SupportTicketCreated }>> {
  return apiFetch<{ data: SupportTicketCreated }>('/tickets', {
    method: 'POST',
    auth: 'none',
    body: data,
  })
}
