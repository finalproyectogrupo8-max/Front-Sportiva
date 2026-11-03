// Sección "Configuración" del club (FRO-16): quién la ve y qué pestañas tiene.

export type ConfigTab = 'perfil' | 'sedes' | 'deportes' | 'temporadas' | 'categorias' | 'competencias'

/** Las pestañas se muestran solo si sus permisos efectivos están presentes. */
export const CONFIG_TABS: readonly { id: ConfigTab; label: string; permissions?: readonly string[] }[] = [
  { id: 'perfil', label: 'Perfil', permissions: ['club.update'] },
  { id: 'sedes', label: 'Sedes', permissions: ['venues.view'] },
  { id: 'deportes', label: 'Deportes', permissions: ['sports.view'] },
  { id: 'temporadas', label: 'Temporadas', permissions: ['seasons.view'] },
  { id: 'categorias', label: 'Categorías', permissions: ['categories.view'] },
  { id: 'competencias', label: 'Competencias', permissions: ['competitions.view'] },
]

/**
 * Alcanza con uno. El administrador del club configura todo; el profe y el preparador físico entran
 * solo a ver las competencias de sus categorías y sus requisitos (`competitions.view:own`).
 */
export const CONFIG_PERMISSIONS = [
  'club.update',
  'venues.view',
  'sports.view',
  'seasons.view',
  'categories.view',
  'competitions.view',
] as const

export function visibleConfigTabs(permissions: readonly string[]) {
  const granted = new Set(permissions)
  return CONFIG_TABS.filter((tab) => (tab.permissions ?? []).every((permission) => granted.has(permission)))
}

export function filterBySportScope<T extends { sport_id: number }>(
  rows: T[],
  scope: string | undefined,
  assignedSportIds: readonly number[],
): T[] {
  if (scope !== 'sport') return rows
  const assigned = new Set(assignedSportIds)
  return rows.filter((row) => assigned.has(row.sport_id))
}

/** Quién ve la guía de configuración inicial: quien carga deportes, temporadas y categorías. */
export function canSetupClub(permissions: readonly string[]): boolean {
  return permissions.includes('sports.view')
}

export function canSeeConfig(permissions: readonly string[]): boolean {
  return CONFIG_PERMISSIONS.some((p) => permissions.includes(p))
}

/** Paso de la configuración inicial del club (lo calcula `getSetupSteps`). */
export type SetupStep = { tab: ConfigTab; label: string; description: string; done: boolean }
