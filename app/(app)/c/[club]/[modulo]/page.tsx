import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { AnalisisModule } from '@/components/modules/analisis'
import { CanchasModule } from '@/components/modules/canchas'
import { CompetenciaModule } from '@/components/modules/competencia'
import { IndumentariaModule } from '@/components/modules/indumentaria'
import { NoAccess } from '@/components/club/no-access'
import { canSeeModule, getModule, type ModuleId } from '@/lib/modules'
import { requireSession } from '@/lib/session'

// Jugadores, Profes (FRO-17), Partidos (FRO-18), Habilitación (FRO-34) y Materiales (FRO-19) tienen su propia ruta con datos de la API.
const VIEWS: Partial<Record<ModuleId, () => React.JSX.Element>> = {
  indumentaria: IndumentariaModule,
  analisis: AnalisisModule,
  competencia: CompetenciaModule,
  canchas: CanchasModule,
}

type Props = { params: Promise<{ club: string; modulo: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { modulo } = await params
  const m = getModule(modulo)
  const tenant = (await requireSession()).tenant
  const short = tenant?.short_name || tenant?.name
  return { title: m && short ? `${m.name} · ${short} — Sportiva` : 'Sportiva' }
}

export default async function ModulePage({ params }: Props) {
  const { club, modulo } = await params
  const mod = getModule(modulo)
  if (!mod) notFound()

  // El layout ya validó la sesión y el club; requireSession está cacheada por request.
  const session = await requireSession()
  if (!canSeeModule(mod, session.permissions ?? [])) {
    return <NoAccess moduleName={mod.name} homeHref={`/c/${club}`} />
  }

  const View = VIEWS[mod.id]
  if (!View) notFound()
  return (
    <Suspense>
      <View />
    </Suspense>
  )
}
