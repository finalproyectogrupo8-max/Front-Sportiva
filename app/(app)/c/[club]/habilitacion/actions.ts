'use server'

import { failure, runCall, text } from '@/lib/action-result'
import type { ApiResult } from '@/lib/api/client'
import {
  approveRequirement,
  rejectRequirement,
  submitRequirement,
  uploadDocument,
  type DocumentKind,
  type PlayerEligibility,
} from '@/lib/api/eligibility'

// Habilitación (FRO-34). Cada acción devuelve la fila del jugador recalculada por la API:
// la grilla la reemplaza en el lugar, sin recargar el resto.

export type EligibilityResult =
  | { ok: true; message: string; row: PlayerEligibility }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }

const MAX_FILE_BYTES = 10 * 1024 * 1024

/** Tipo de documento según el nombre del requisito (la API los guarda por tipo). */
function kindFor(requirementName: string): DocumentKind {
  const name = requirementName.toLowerCase()
  if (/apto|m[eé]dic|salud/.test(name)) return 'medical'
  if (/dni|documento|pasaporte/.test(name)) return 'id_document'
  if (/autoriz|permiso|padres/.test(name)) return 'authorization'
  if (/ficha|carnet|federa/.test(name)) return 'federation_card'
  return 'other'
}

/** Sube el archivo del formulario, si vino. undefined: no hay archivo; string: error. */
async function uploadIfAny(playerId: number, formData: FormData): Promise<number | undefined | string> {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return undefined
  if (file.size > MAX_FILE_BYTES) return 'El archivo puede pesar hasta 10 MB.'

  const uploaded = await runCall(() => uploadDocument(playerId, kindFor(text(formData, 'requirement_name')), file))
  if (!uploaded.ok) {
    const result = 'kind' in uploaded ? failure(uploaded, ['file']) : uploaded
    return ('fieldErrors' in result && result.fieldErrors?.file) || ('error' in result && result.error) || 'No se pudo subir el archivo.'
  }
  return uploaded.data.data.id
}

async function finish(
  call: () => Promise<ApiResult<{ data: PlayerEligibility }>>,
  message: string,
  fields: string[],
): Promise<EligibilityResult> {
  const result = await runCall(call)
  if (!result.ok) {
    if (!('kind' in result)) return result
    const mapped = failure(result, fields)
    return mapped.ok ? { ok: false, error: 'No se pudo guardar.' } : mapped
  }
  return { ok: true, message, row: result.data.data }
}

/** Presentar el papel (con el archivo si el requisito lo pide). Lo puede hacer el profe. */
export async function submitAction(playerId: number, requirementId: number, formData: FormData): Promise<EligibilityResult> {
  const uploaded = await uploadIfAny(playerId, formData)
  if (typeof uploaded === 'string') return { ok: false, fieldErrors: { file: uploaded } }
  if (uploaded === undefined && formData.get('requires_file') === '1') {
    return { ok: false, fieldErrors: { file: 'Este papel pide el archivo: subí la foto o el PDF.' } }
  }
  return finish(() => submitRequirement(playerId, requirementId, uploaded ?? null), 'Papel presentado. Falta que lo aprueben.', ['document_id'])
}

/**
 * Aprobar. Si viene un archivo nuevo, se sube y queda adjunto; si no, se usa el que ya estaba.
 * `expires_at` vacío: la API calcula el vencimiento con los meses del requisito.
 */
export async function approveAction(playerId: number, requirementId: number, formData: FormData): Promise<EligibilityResult> {
  const uploaded = await uploadIfAny(playerId, formData)
  if (typeof uploaded === 'string') return { ok: false, fieldErrors: { file: uploaded } }

  const existing = Number(text(formData, 'document_id')) || null
  const expiresAt = text(formData, 'expires_at') || null
  return finish(
    () => approveRequirement(playerId, requirementId, { document_id: uploaded ?? existing, expires_at: expiresAt }),
    'Papel aprobado.',
    ['document_id', 'expires_at'],
  ).then((result) =>
    // La API pide el archivo con el nombre técnico `document_id`.
    !result.ok && result.fieldErrors?.document_id
      ? { ok: false, fieldErrors: { file: 'Este papel pide el archivo: subí la foto o el PDF para aprobarlo.' } }
      : result,
  )
}

export async function rejectAction(playerId: number, requirementId: number, formData: FormData): Promise<EligibilityResult> {
  const reason = text(formData, 'reason')
  if (!reason) return { ok: false, fieldErrors: { reason: 'Contá por qué se rechaza: lo ve quien lo presentó.' } }
  return finish(() => rejectRequirement(playerId, requirementId, reason), 'Papel rechazado.', ['reason'])
}
