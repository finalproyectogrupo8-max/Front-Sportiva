import 'server-only'

import { cache } from 'react'
import { listCategories, listSeasons, listSports } from '@/lib/api/club'
import { canSetupClub, type SetupStep } from '@/lib/club-config'
import { requireSession } from '@/lib/session'

export type { SetupStep }

/**
 * Pasos de la configuración inicial del club (FRO-16): deportes, temporada y categorías.
 * null si el usuario no configura el club o si la API no respondió (la guía no se muestra).
 * `cache`: el layout y la página de configuración la piden en el mismo request.
 */
export const getSetupSteps = cache(async (): Promise<SetupStep[] | null> => {
  const session = await requireSession()
  if (!canSetupClub(session.permissions ?? [])) return null

  try {
    const [sports, seasons, categories] = await Promise.all([
      listSports({ is_active: true, per_page: 1 }),
      listSeasons({ per_page: 1 }),
      listCategories({ per_page: 1 }),
    ])
    if (!sports.ok || !seasons.ok || !categories.ok) return null

    return [
      { tab: 'deportes', label: 'Cargá los deportes', description: 'Fútbol, básquet, vóley…', done: sports.data.meta.total > 0 },
      { tab: 'temporadas', label: 'Creá la temporada', description: 'Con sus fechas de inicio y fin.', done: seasons.data.meta.total > 0 },
      { tab: 'categorias', label: 'Armá las categorías', description: 'Sub-13, Sub-15, Primera…', done: categories.data.meta.total > 0 },
    ]
  } catch {
    return null
  }
})
