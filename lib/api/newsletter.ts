import 'server-only'

import { apiFetch, type ApiResult } from './client'

/**
 * `POST /newsletter`
 * Suscripción pública al newsletter (sin token de autenticación).
 */
export async function subscribeNewsletter(email: string): Promise<ApiResult<{ message: string }>> {
  return apiFetch<{ message: string }>('/newsletter', {
    method: 'POST',
    auth: 'none',
    body: { email },
  })
}
