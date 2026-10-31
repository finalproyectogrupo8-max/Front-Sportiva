import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'

// Habilitación (FRO-34): quién puede jugar según los requisitos de las competencias.
// La API calcula el estado; acá solo se lee y se presenta, aprueba o rechaza cada papel.

export type CategoryEligibility = Schemas['CategoryEligibilityResource']
export type PlayerEligibility = Schemas['PlayerEligibilityResource']
export type RequirementStatus = Schemas['RequirementStatusResource']
export type DocumentKind = 'medical' | 'id_document' | 'federation_card' | 'authorization' | 'other'

type One<T> = { data: T }
type List<T> = { data: T[] }

/** Una fila por categoría activa que juega alguna competencia. */
export function clubEligibility(): Promise<ApiResult<List<CategoryEligibility>>> {
  return apiFetch('/eligibility')
}

/** La grilla de una categoría: jugadores × requisitos. */
export function categoryEligibility(categoryId: number): Promise<ApiResult<List<PlayerEligibility>>> {
  return apiFetch(`/categories/${categoryId}/eligibility`)
}

export function playerEligibility(playerId: number): Promise<ApiResult<One<PlayerEligibility>>> {
  return apiFetch(`/players/${playerId}/eligibility`)
}

/** Sube el archivo del papel como documento del jugador. */
export function uploadDocument(playerId: number, kind: DocumentKind, file: File): Promise<ApiResult<One<{ id: number }>>> {
  const body = new FormData()
  body.append('kind', kind)
  body.append('file', file)
  return apiFetch(`/players/${playerId}/documents`, { method: 'POST', body })
}

export function submitRequirement(playerId: number, requirementId: number, documentId: number | null): Promise<ApiResult<One<PlayerEligibility>>> {
  return apiFetch(`/players/${playerId}/requirements/${requirementId}/submit`, { method: 'POST', body: { document_id: documentId } })
}

export function approveRequirement(
  playerId: number,
  requirementId: number,
  input: { document_id?: number | null; expires_at?: string | null },
): Promise<ApiResult<One<PlayerEligibility>>> {
  return apiFetch(`/players/${playerId}/requirements/${requirementId}/approve`, { method: 'POST', body: input })
}

export function rejectRequirement(playerId: number, requirementId: number, reason: string): Promise<ApiResult<One<PlayerEligibility>>> {
  return apiFetch(`/players/${playerId}/requirements/${requirementId}/reject`, { method: 'POST', body: { reason } })
}
