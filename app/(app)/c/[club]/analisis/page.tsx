import type { Metadata } from 'next'
import { AnalysisModule } from '@/components/club/analysis/analysis-module'
import { NoAccess } from '@/components/club/no-access'
import { categoryStats, listEvaluations, playerStats } from '@/lib/api/analytics'
import { listCoaches } from '@/lib/api/players'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Análisis — Sportiva' }

const PERIODS = ['30', '90', '180'] as const

const isoDate = (d: Date) => d.toISOString().slice(0, 10)

export default async function AnalysisPage({
  params,
  searchParams,
}: {
  params: Promise<{ club: string }>
  searchParams: Promise<{ periodo?: string; categoria?: string; vista?: string }>
}) {
  const { club } = await params
  const query = await searchParams
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  if (!permissions.has('physical_evaluations.view')) return <NoAccess moduleName="Análisis" homeHref={`/c/${club}`} />

  const period = (PERIODS as readonly string[]).includes(query.periodo ?? '') ? (query.periodo as (typeof PERIODS)[number]) : '90'
  const to = new Date()
  const from = new Date(to.getTime() - Number(period) * 86_400_000)
  const range = { from: isoDate(from), to: isoDate(to) }

  const categories = await categoryStats(range)
  const rows = categories.ok ? categories.data.data : []
  const category = rows.find((c) => c.category_id === Number(query.categoria)) ?? rows.find((c) => c.players > 0) ?? rows[0]
  const canCreate = permissions.has('physical_evaluations.create')

  const [players, evaluations, coaches] = await Promise.all([
    category ? playerStats(category.category_id, range) : Promise.resolve(null),
    category ? listEvaluations({ category_id: category.category_id }) : Promise.resolve(null),
    canCreate ? listCoaches({ status: 'active', per_page: 100 }).catch(() => null) : Promise.resolve(null),
  ])

  return (
    <AnalysisModule
      period={period}
      categories={rows}
      categoryId={category?.category_id ?? null}
      players={players?.ok ? players.data.data : []}
      evaluations={evaluations?.ok ? evaluations.data.data : []}
      coaches={coaches?.ok ? coaches.data.data.map((c) => ({ id: c.id, name: `${c.first_name} ${c.last_name}` })) : []}
      view={query.vista === 'evaluaciones' ? 'evaluaciones' : 'jugadores'}
      can={{
        create: canCreate,
        update: permissions.has('physical_evaluations.update'),
        delete: permissions.has('physical_evaluations.delete'),
      }}
    />
  )
}
