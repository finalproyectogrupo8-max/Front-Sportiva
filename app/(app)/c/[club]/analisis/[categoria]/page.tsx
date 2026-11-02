import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CategoryDashboard } from '@/components/club/analysis/category-dashboard'
import { NoAccess } from '@/components/club/no-access'
import { categoryDetail, listEvaluations, playerStats } from '@/lib/api/analytics'
import { listCoaches } from '@/lib/api/players'
import { requireSession } from '@/lib/session'
import { resolvePeriod } from '../period'

export const metadata: Metadata = { title: 'Análisis — Sportiva' }

export default async function CategoryAnalysisPage({
  params,
  searchParams,
}: {
  params: Promise<{ club: string; categoria: string }>
  searchParams: Promise<{ periodo?: string; vista?: string; jugador?: string }>
}) {
  const { club, categoria } = await params
  const query = await searchParams
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  if (!permissions.has('physical_evaluations.view')) return <NoAccess moduleName="Análisis" homeHref={`/c/${club}`} />

  const categoryId = Number(categoria)
  if (!Number.isInteger(categoryId) || categoryId <= 0) notFound()

  const { period, range } = resolvePeriod(query.periodo)
  const canCreate = permissions.has('physical_evaluations.create')
  const [detail, players, evaluations, coaches] = await Promise.all([
    categoryDetail(categoryId, range),
    playerStats(categoryId, range),
    listEvaluations({ category_id: categoryId }),
    canCreate ? listCoaches({ status: 'active', per_page: 100 }).catch(() => null) : Promise.resolve(null),
  ])
  // Categoría de otro club o fuera del alcance del profe: la API responde 404.
  if (!detail.ok) notFound()

  const view = query.vista === 'jugadores' || query.vista === 'evaluaciones' ? query.vista : 'equipo'

  return (
    <CategoryDashboard
      backHref={`/c/${club}/analisis${period !== '90' ? `?periodo=${period}` : ''}`}
      matchesHref={`/c/${club}/partidos`}
      period={period}
      detail={detail.data.data}
      players={players.ok ? players.data.data : []}
      evaluations={evaluations.ok ? evaluations.data.data : []}
      coaches={coaches?.ok ? coaches.data.data.map((c) => ({ id: c.id, name: `${c.first_name} ${c.last_name}` })) : []}
      view={view}
      playerId={Number(query.jugador) || null}
      can={{
        create: canCreate,
        update: permissions.has('physical_evaluations.update'),
        delete: permissions.has('physical_evaluations.delete'),
      }}
    />
  )
}
