import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'

/** `POST /auth/accept-invite`; endpoint público, sin cookie de sesión. */
export function acceptInvite(
  data: Schemas['AcceptInviteRequest'],
): Promise<ApiResult<{ message: string }>> {
  return apiFetch<{ message: string }>('/auth/accept-invite', {
    method: 'POST',
    auth: 'none',
    body: data,
  })
}
