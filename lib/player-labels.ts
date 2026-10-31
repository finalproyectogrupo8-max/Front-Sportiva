import type { Tone } from '@/components/club/shared'

// Textos de la UI para los valores que guarda la API (jugadores y profes, FRO-17).

export const PLAYER_STATUS: Record<string, { label: string; tone: Tone }> = {
  active: { label: 'Activo', tone: 'ok' },
  inactive: { label: 'Inactivo', tone: 'neutral' },
  transferred: { label: 'Transferido', tone: 'info' },
}

export const DOMINANT_SIDE: Record<string, string> = {
  right: 'Derecho',
  left: 'Izquierdo',
  both: 'Ambidiestro',
}

export const RELATIONSHIP: Record<string, string> = {
  mother: 'Madre',
  father: 'Padre',
  guardian: 'Tutor/a',
  self: 'El jugador',
  other: 'Otro',
}

export const ASSIGNMENT_TYPE: Record<string, string> = {
  head_coach: 'Profe a cargo',
  assistant: 'Ayudante',
  physical_trainer: 'Preparador físico',
}

/**
 * Sugerencias para el campo "Puesto" (texto libre: cada deporte y cada club los nombra distinto).
 * Reemplaza el PUESTOS fijo por deporte de los mocks.
 */
export const POSITION_SUGGESTIONS = [
  'Arquero', 'Defensor', 'Lateral', 'Mediocampista', 'Volante', 'Delantero',
  'Base', 'Escolta', 'Alero', 'Ala-pívot', 'Pívot',
  'Armador', 'Opuesto', 'Central', 'Punta', 'Líbero',
]

/** URL de la foto de la ficha (la sirve el front con el token del club). */
export function photoUrl(club: string, documentId: number | null | undefined): string | null {
  return documentId ? `/c/${club}/jugadores/foto/${documentId}` : null
}

/** "Ana Pérez" → "AP". */
export function initials(first: string, last: string): string {
  return `${first.trim()[0] ?? ''}${last.trim()[0] ?? ''}`.toUpperCase()
}
