// Sección "Configuración" del club (FRO-16): quién la ve y qué pestañas tiene.

export type ConfigTab = 'perfil' | 'sedes' | 'deportes' | 'temporadas' | 'categorias' | 'competencias'

/** `permissions`: hacen falta todos (la pestaña de categorías necesita listar deportes y temporadas). */
export const CONFIG_TABS: readonly { id: ConfigTab; label: string; permissions?: readonly string[] }[] = [
  // El perfil lo ve cualquiera que entre a la configuración; solo `club.update` lo edita.
  { id: 'perfil', label: 'Perfil' },
  { id: 'sedes', label: 'Sedes', permissions: ['venues.view'] },
  { id: 'deportes', label: 'Deportes', permissions: ['sports.view'] },
  { id: 'temporadas', label: 'Temporadas', permissions: ['seasons.view'] },
  { id: 'categorias', label: 'Categorías', permissions: ['categories.view', 'sports.view', 'seasons.view'] },
  { id: 'competencias', label: 'Competencias', permissions: ['competitions.view'] },
]

/**
 * Alcanza con uno. Admin y coordinador configuran todo; el profe y el preparador físico entran
 * solo a ver las competencias de sus categorías y sus requisitos (`competitions.view:own`).
 */
export const CONFIG_PERMISSIONS = ['club.update', 'sports.view', 'seasons.view', 'competitions.view'] as const

/** Quién ve la guía de configuración inicial: quien carga deportes, temporadas y categorías. */
export function canSetupClub(permissions: readonly string[]): boolean {
  return permissions.includes('sports.view')
}

export function canSeeConfig(permissions: readonly string[]): boolean {
  return CONFIG_PERMISSIONS.some((p) => permissions.includes(p))
}

/** Paso de la configuración inicial del club (lo calcula `getSetupSteps`). */
export type SetupStep = { tab: ConfigTab; label: string; description: string; done: boolean }
