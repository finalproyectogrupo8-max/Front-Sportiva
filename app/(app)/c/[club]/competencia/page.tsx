import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarRange } from 'lucide-react'
import { EmptyConfig } from '@/components/club/empty-state'
import { NoAccess } from '@/components/club/no-access'
import { ProjectModule } from '@/components/club/project/project-module'
import { ModuleHeader, PageBody } from '@/components/club/shared'
import { buttonVariants } from '@/components/ui/button'
import { listCategories, listCompetitions, listSeasons } from '@/lib/api/club'
import { listObjectives, listStandings } from '@/lib/api/project'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Proyecto — Sportiva' }

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ club: string }>
  searchParams: Promise<{ temporada?: string; competencia?: string; categoria?: string }>
}) {
  const { club } = await params
  const query = await searchParams
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  if (!permissions.has('project.view')) return <NoAccess moduleName="Proyecto" homeHref={`/c/${club}`} />

  const [seasons, allCompetitions] = await Promise.all([listSeasons(), listCompetitions()])
  const seasonList = (seasons.ok ? seasons.data.data : []).filter((s) => s.status !== 'closed')
  const competitionsAll = (allCompetitions.ok ? allCompetitions.data.data : []).filter((c) => (c.categories?.length ?? 0) > 0)
  // Puede haber varias temporadas activas (una por liga): por defecto, una activa que ya tenga competencias.
  const season =
    seasonList.find((s) => s.id === Number(query.temporada)) ??
    seasonList.find((s) => s.status === 'active' && competitionsAll.some((c) => c.season_id === s.id)) ??
    seasonList.find((s) => s.status === 'active') ??
    seasonList[0]
  if (!season) {
    return (
      <>
        <ModuleHeader eyebrow="Deportivo" title="Proyecto deportivo" description="Objetivos de la temporada y tabla de posiciones." />
        <PageBody>
          <EmptyConfig
            icon={CalendarRange}
            title="No hay temporadas cargadas"
            description="Los objetivos y las tablas son de una temporada. Creá una en la configuración del club."
            action={
              <Link href={`/c/${club}/configuracion?tab=temporadas`} className={buttonVariants()}>
                Ir a la configuración
              </Link>
            }
          />
        </PageBody>
      </>
    )
  }

  const [objectives, categories] = await Promise.all([listObjectives({ season_id: season.id }), listCategories({ season_id: season.id })])
  const competitionList = competitionsAll.filter((c) => c.season_id === season.id)
  const competition = competitionList.find((c) => c.id === Number(query.competencia)) ?? competitionList[0]
  const categoryId = competition?.categories?.find((c) => c.id === Number(query.categoria))?.id ?? competition?.categories?.[0]?.id ?? null
  const standings = competition ? await listStandings(competition.id) : null

  return (
    <ProjectModule
      season={{ id: season.id, name: season.name }}
      seasons={seasonList.map((s) => ({ id: s.id, name: s.status === 'planned' ? `${s.name} (planificada)` : s.name }))}
      competitions={competitionList.map((c) => ({ id: c.id, name: c.name, categories: (c.categories ?? []).map((cat) => ({ id: cat.id, name: cat.name })) }))}
      competitionId={competition?.id ?? null}
      categoryId={categoryId}
      standings={standings?.ok ? standings.data.data.filter((r) => r.category_id === categoryId) : []}
      objectives={(objectives.ok ? objectives.data.data : []).map((o) => ({ ...o, progress: typeof o.progress === 'number' ? o.progress : null }))}
      categories={(categories.ok ? categories.data.data : []).map((c) => ({ id: c.id, name: c.name }))}
      canEdit={permissions.has('project.update')}
    />
  )
}
