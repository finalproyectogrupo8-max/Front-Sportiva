import type { Metadata } from 'next'
import { AnalysisIndex } from '@/components/club/analysis/analysis-index'
import { NoAccess } from '@/components/club/no-access'
import { categoryStats } from '@/lib/api/analytics'
import { requireSession } from '@/lib/session'
import { resolvePeriod } from './period'

export const metadata: Metadata = { title: 'Análisis — Sportiva' }

export default async function AnalysisPage({ params, searchParams }: { params: Promise<{ club: string }>; searchParams: Promise<{ periodo?: string }> }) {
  const { club } = await params
  const query = await searchParams
  const session = await requireSession()
  if (!(session.permissions ?? []).includes('physical_evaluations.view')) return <NoAccess moduleName="Análisis" homeHref={`/c/${club}`} />

  const { period, range } = resolvePeriod(query.periodo)
  const categories = await categoryStats(range)

  return <AnalysisIndex period={period} categories={categories.ok ? categories.data.data : []} />
}
