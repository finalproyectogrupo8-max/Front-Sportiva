import 'server-only'

import { revalidatePath } from 'next/cache'
import type { ApiFailure, ApiResult } from '@/lib/api/client'
import { fieldError } from '@/lib/api/validation-messages'
import { requireSession } from '@/lib/session'

// Resultado de las server actions del club: los 422 van a cada campo y el resto como mensaje.
// Lo consumen `useConfigAction` y `ConfirmDialog` (components/club/forms.tsx).

export type ActionResult =
  /** `id`: lo que se creó, para abrirlo (la ficha del jugador nuevo). */
  | { ok: true; message: string; id?: number }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }

/** Texto de un campo del formulario, sin espacios de más. */
export function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim()
}

/** Número entero o null si el campo quedó vacío. NaN si no es un número (lo rechaza la API). */
export function optionalInt(formData: FormData, key: string): number | null {
  const value = text(formData, key)
  return value === '' ? null : Number(value)
}

/**
 * Error de la API para el formulario. `fields` son los campos que muestra el formulario;
 * '*' toma todos los que vengan (listas como `requirements.0.name`). `inUse` explica un 409.
 */
export function failure(result: ApiFailure, fields: string[], inUse?: string): ActionResult {
  if (result.kind === 'validation') {
    const fieldErrors: Record<string, string> = {}
    for (const field of fields.includes('*') ? Object.keys(result.errors) : fields) {
      const message = fieldError(result.errors, field)
      if (message) fieldErrors[field] = message
    }
    return Object.keys(fieldErrors).length > 0 ? { ok: false, fieldErrors } : { ok: false, error: result.message }
  }
  if (result.kind === 'forbidden') return { ok: false, error: 'No tenés permiso para hacer este cambio.' }
  if (result.status === 409 && inUse) return { ok: false, error: inUse }
  if (result.status === 404) return { ok: false, error: 'Ya no existe. Recargá la página.' }
  return { ok: false, error: result.message || 'No se pudo guardar. Probá de nuevo.' }
}

/**
 * Llama a la API y arma el resultado. Si sale bien, revalida todo el club: el layout (barra,
 * escudo, guía) y las páginas leen estos datos.
 */
export async function runApiAction<T>(
  call: () => Promise<ApiResult<T>>,
  done: string,
  fields: string[],
  inUse?: string,
): Promise<ActionResult> {
  const session = await requireSession()

  let result: ApiResult<T>
  try {
    result = await call()
  } catch {
    return { ok: false, error: 'No pudimos conectar con el servidor. Probá de nuevo en unos minutos.' }
  }
  if (!result.ok) return failure(result, fields, inUse)

  if (session.tenant) revalidatePath(`/c/${session.tenant.slug}`, 'layout')
  return { ok: true, message: done }
}

/** Llama a la API; si no responde, devuelve el error de conexión en vez de tirar. */
export async function runCall<T>(call: () => Promise<ApiResult<T>>): Promise<ApiResult<T> | { ok: false; error: string }> {
  try {
    return await call()
  } catch {
    return { ok: false, error: 'No pudimos conectar con el servidor. Probá de nuevo en unos minutos.' }
  }
}

/** Revalida todas las páginas del club activo. */
export async function revalidateClub(): Promise<void> {
  const session = await requireSession()
  if (session.tenant) revalidatePath(`/c/${session.tenant.slug}`, 'layout')
}
