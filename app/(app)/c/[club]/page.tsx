import { HomeDashboard } from '@/components/club/home-dashboard'
import { SetupSteps, type SetupStep } from '@/components/club/config/setup-steps'
import { listCategories, listSeasons, listSports } from '@/lib/api/club'
import { canSeeConfig } from '@/lib/club-config'
import { requireSession } from '@/lib/session'

/** Pasos de la configuración inicial para quien puede configurar el club. null si no corresponde. */
async function setupSteps(club: string): Promise<SetupStep[] | null> {
  const session = await requireSession()
  if (!canSeeConfig(session.permissions ?? [])) return null

  try {
    const [sports, seasons, categories] = await Promise.all([
      listSports({ is_active: true, per_page: 1 }),
      listSeasons({ per_page: 1 }),
      listCategories({ per_page: 1 }),
    ])
    if (!sports.ok || !seasons.ok || !categories.ok) return null

    const base = `/c/${club}/configuracion`
    return [
      { label: 'Cargá los deportes', description: 'Fútbol, básquet, vóley…', done: sports.data.meta.total > 0, href: `${base}?tab=deportes` },
      { label: 'Creá la temporada', description: 'Con sus fechas de inicio y fin.', done: seasons.data.meta.total > 0, href: `${base}?tab=temporadas` },
      { label: 'Armá las categorías', description: 'Sub-13, Sub-15, Primera…', done: categories.data.meta.total > 0, href: `${base}?tab=categorias` },
    ]
  } catch {
    // Sin API, la home se muestra igual sin el onboarding.
    return null
  }
}

export default async function ClubHomePage({ params }: { params: Promise<{ club: string }> }) {
  const { club } = await params
  const steps = await setupSteps(club)

  return (
    <>
      {steps && <SetupSteps steps={steps} />}
      <HomeDashboard />
    </>
  )
}
