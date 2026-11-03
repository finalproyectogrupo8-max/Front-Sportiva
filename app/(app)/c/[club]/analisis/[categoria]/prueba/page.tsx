import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LiveTest } from '@/components/club/analysis/live-test'
import { NoAccess } from '@/components/club/no-access'
import { categoryDetail, listEvaluations, playerStats } from '@/lib/api/analytics'
import { listCoaches } from '@/lib/api/players'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Tomar una prueba — Sportiva' }

export default async function LiveTestPage({ params }: { params: Promise<{ club: string; categoria: string }> }) {
  const { club, categoria } = await params
  const session = await requireSession()
  const backHref = `/c/${club}/analisis/${categoria}`
  if (!(session.permissions ?? []).includes('physical_evaluations.create')) return <NoAccess moduleName="Tomar una prueba" homeHref={backHref} />

  const categoryId = Number(categoria)
  if (!Number.isInteger(categoryId) || categoryId <= 0) notFound()

  const period = { from: '2000-01-01', to: new Date().toISOString().slice(0, 10) }
  const [detail, players, evaluations, coaches] = await Promise.all([
    categoryDetail(categoryId, period),
    playerStats(categoryId, period),
    listEvaluations({ category_id: categoryId }),
    listCoaches({ status: 'active', per_page: 100 }).catch(() => null),
  ])
  if (!detail.ok) notFound()

  return (
    <LiveTest
      categoryId={categoryId}
      categoryName={detail.data.data.category_name}
      backHref={backHref}
      players={(players.ok ? players.data.data : []).map((p) => ({ id: p.player_id, name: p.player_name }))}
      evaluations={evaluations.ok ? evaluations.data.data : []}
      coaches={coaches?.ok ? coaches.data.data.map((c) => ({ id: c.id, name: `${c.first_name} ${c.last_name}` })) : []}
    />
  )
}
