'use server'

import { subscribeNewsletter } from '@/lib/api/newsletter'

export type NewsletterState = { ok: boolean; error?: string }

/** Server Action pública del footer de la landing. */
export async function subscribe(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const email = String(formData.get('email') ?? '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Ingresá un email válido.' }
  }

  try {
    const result = await subscribeNewsletter(email)
    if (result.ok) return { ok: true }

    if (result.kind === 'validation') {
      const taken = result.errors.email?.some((e) => /taken|registrad|existe/i.test(e))
      return { ok: false, error: taken ? 'Este email ya está suscripto.' : result.errors.email?.[0] ?? result.message }
    }
    if (result.kind === 'rate_limited') {
      return { ok: false, error: 'Demasiados intentos. Probá de nuevo en unos minutos.' }
    }
    return { ok: false, error: 'No pudimos procesar la suscripción. Probá de nuevo.' }
  } catch {
    return { ok: false, error: 'No pudimos conectar con el servidor. Probá de nuevo más tarde.' }
  }
}
