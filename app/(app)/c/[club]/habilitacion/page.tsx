import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react'
import { EmptyConfig } from '@/components/club/empty-state'
import { CategoryCards } from '@/components/club/eligibility/category-cards'
import { EligibilityGrid } from '@/components/club/eligibility/eligibility-grid'
import { NoAccess } from '@/components/club/no-access'
import { canOpenModule } from '@/lib/modules'
import { ModuleHeader, PageBody } from '@/components/club/shared'
import { buttonVariants } from '@/components/ui/button'
import { categoryEligibility, clubEligibility } from '@/lib/api/eligibility'
import { requireSession } from '@/lib/session'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Habilitación — Sportiva' }

type Props = {
  params: Promise<{ club: string }>
  searchParams: Promise<{ categoria?: string }>
}

export default async function EligibilityPage({ params, searchParams }: Props) {
  const { club } = await params
  const { categoria } = await searchParams
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  if (!canOpenModule('habilitacion', session.permissions ?? [])) {
    return <NoAccess moduleName="Habilitación" homeHref={`/c/${club}`} />
  }

  const categoryId = Number(categoria) || null
  const canSetUp = permissions.has('competitions.create')
  let summary, grid
  try {
    ;[summary, grid] = await Promise.all([
      clubEligibility(),
      categoryId ? categoryEligibility(categoryId) : Promise.resolve(null),
    ])
  } catch {
    summary = null
  }

  if (!summary || !summary.ok) {
    return (
      <>
        <ModuleHeader eyebrow="Deportivo" title="Habilitación" />
        <PageBody>
          <LoadError message={summary?.message ?? 'Asegurate de que la API esté corriendo y probá recargar.'} />
        </PageBody>
      </>
    )
  }

  const categories = summary.data.data
  const current = categoryId ? categories.find((c) => c.category_id === categoryId) : undefined

  if (categoryId && grid) {
    return (
      <>
        <ModuleHeader
          eyebrow="Habilitación"
          title={current?.category_name ?? 'Sin competencias'}
          description={current ? 'Cada papel que piden sus competencias. Tocá una celda para presentarlo, verlo o aprobarlo.' : undefined}
          actions={
            <Link href={`/c/${club}/habilitacion`} className={cn(buttonVariants({ variant: 'outline' }), 'gap-1.5')}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Todas las categorías
            </Link>
          }
        />
        <PageBody>
          {!grid.ok ? (
            <LoadError message={grid.status === 404 ? 'La categoría no existe o no es de tus categorías.' : grid.message} />
          ) : !current ? (
            // La categoría existe pero no juega ninguna competencia: no hay papeles que controlar.
            <EmptyConfig
              icon={ShieldCheck}
              title="Esta categoría no juega ninguna competencia"
              description="La habilitación sale de los papeles que pide cada competencia. Cargá la competencia y elegí esta categoría para ver qué le falta a cada jugador."
              action={
                canSetUp && (
                  <Link href={`/c/${club}/configuracion?tab=competencias`} className={buttonVariants()}>
                    Cargar competencias
                  </Link>
                )
              }
            />
          ) : (
            <EligibilityGrid
              key={categoryId}
              club={club}
              rows={grid.data.data}
              summary={current ?? null}
              can={{
                update: permissions.has('player_requirements.update'),
                approve: permissions.has('player_requirements.approve'),
              }}
            />
          )}
        </PageBody>
      </>
    )
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Deportivo"
        title="Habilitación"
        description="Quién está habilitado para jugar en cada categoría, según los papeles que piden sus competencias."
      />
      <PageBody>
        {categories.length === 0 ? (
          <EmptyConfig
            icon={ShieldCheck}
            title="Todavía no hay nada para controlar"
            description={
              canSetUp
                ? 'Cargá las competencias que juega el club, con las categorías que participan y los papeles que piden.'
                : 'Cuando el club cargue las competencias de tus categorías, acá vas a ver quién está habilitado.'
            }
            action={
              canSetUp && (
                <Link href={`/c/${club}/configuracion?tab=competencias`} className={buttonVariants()}>
                  Cargar competencias
                </Link>
              )
            }
          />
        ) : (
          <CategoryCards club={club} categories={categories} />
        )}
      </PageBody>
    </>
  )
}

function LoadError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
      <AlertTriangle className="size-8" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">No se pudo cargar la habilitación</h2>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
