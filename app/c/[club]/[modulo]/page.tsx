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
import { getModule, type ModuleId } from '@/lib/modules'
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
  return { title: m && t ? `${m.name} · ${t.short} — Tribuna` : 'Tribuna' }
}

export default async function ModulePage({ params }: Props) {
  const { modulo } = await params
  const mod = getModule(modulo)
  if (!mod) notFound()
  const View = VIEWS[mod.id]
  return (
    <Suspense>
      <View />
    </Suspense>
  )
}
