// Sección "Configuración" del club (FRO-16): quién la ve y qué pestañas tiene.

export type ConfigTab = 'perfil' | 'deportes' | 'temporadas' | 'categorias'

export const CONFIG_TABS: readonly { id: ConfigTab; label: string; permission?: string }[] = [
  // El perfil lo ve cualquiera que entre a la configuración; solo `club.update` lo edita.
  { id: 'perfil', label: 'Perfil' },
  { id: 'deportes', label: 'Deportes', permission: 'sports.view' },
  { id: 'temporadas', label: 'Temporadas', permission: 'seasons.view' },
  { id: 'categorias', label: 'Categorías', permission: 'categories.view' },
]

/** Alcanza con uno: admin y coordinador. El profe (categorías propias) no configura el club. */
export const CONFIG_PERMISSIONS = ['club.update', 'sports.view', 'seasons.view'] as const

export function canSeeConfig(permissions: readonly string[]): boolean {
  return CONFIG_PERMISSIONS.some((p) => permissions.includes(p))
}

/** Paso de la configuración inicial del club (lo calcula `getSetupSteps`). */
export type SetupStep = { tab: ConfigTab; label: string; description: string; done: boolean }
