import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { AnalisisModule } from '@/components/modules/analisis'
import { CanchasModule } from '@/components/modules/canchas'
import { CompetenciaModule } from '@/components/modules/competencia'
import { IndumentariaModule } from '@/components/modules/indumentaria'
import { JugadoresModule } from '@/components/modules/jugadores'
import { MaterialesModule } from '@/components/modules/materiales'
import { PartidosModule } from '@/components/modules/partidos'
import { ProfesModule } from '@/components/modules/profes'
import { NoAccess } from '@/components/club/no-access'
import { canSeeModule, getModule, type ModuleId } from '@/lib/modules'
import { requireSession } from '@/lib/session'
import { getTenant } from '@/lib/tenants'

const VIEWS: Record<ModuleId, () => React.JSX.Element> = {
  indumentaria: IndumentariaModule,
  materiales: MaterialesModule,
  partidos: PartidosModule,
  jugadores: JugadoresModule,
  analisis: AnalisisModule,
  competencia: CompetenciaModule,
  profes: ProfesModule,
  canchas: CanchasModule,
}

type Props = { params: Promise<{ club: string; modulo: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { club, modulo } = await params
  const m = getModule(modulo)
  const t = getTenant(club)
  return { title: m && t ? `${m.name} · ${t.short} — Sportiva` : 'Sportiva' }
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
  return (
    <Suspense>
      <View />
    </Suspense>
  )
}
