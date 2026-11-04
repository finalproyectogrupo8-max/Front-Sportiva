import type { Metadata } from 'next'
import { AlertTriangle } from 'lucide-react'
import { Pagination } from '@/components/admin/pagination'
import { CoachSheet } from '@/components/club/coaches/coach-sheet'
import { CoachesList, CoachFilters, NewCoachButton } from '@/components/club/coaches/coaches-list'
import { NoAccess } from '@/components/club/no-access'
import { canOpenModule } from '@/lib/modules'
import { ModuleHeader, PageBody } from '@/components/club/shared'
import { listCategories, listSports } from '@/lib/api/club'
import { getCoach, listCoaches } from '@/lib/api/players'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Profes — Sportiva' }

type Props = {
  params: Promise<{ club: string }>
  searchParams: Promise<{ q?: string; estado?: string; page?: string; id?: string }>
}

export default async function CoachesPage({ params, searchParams }: Props) {
  const { club } = await params
  const query = await searchParams
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  const can = (permission: string) => permissions.has(permission)

  if (!canOpenModule('profes', session.permissions ?? [])) return <NoAccess moduleName="Profes" homeHref={`/c/${club}`} />

  const selectedId = Number(query.id) || null
  const status = query.estado === 'todos' ? undefined : query.estado || 'active'

  let coaches, categories, selected
  try {
    ;[coaches, categories, selected] = await Promise.all([
      listCoaches({ search: query.q?.trim() || undefined, status, page: Math.max(1, Number(query.page) || 1) }),
      can('categories.manage_coaches')
        ? Promise.all([listCategories(), listSports()]).then(([c, s]) => {
            if (!c.ok) return []
            const sportName = new Map(s.ok ? s.data.data.map((x) => [x.id, x.name]) : [])
            const many = new Set(c.data.data.map((x) => x.sport_id)).size > 1
            return c.data.data
              .filter((x) => x.is_active)
              .map((x) => ({ id: x.id, label: many && sportName.get(x.sport_id) ? `${x.name} · ${sportName.get(x.sport_id)}` : x.name }))
          })
        : Promise.resolve([]),
      selectedId ? getCoach(selectedId) : Promise.resolve(null),
    ])
  } catch {
    coaches = null
  }

  const flags = {
    create: can('coaches.create'),
    update: can('coaches.update'),
    delete: can('coaches.delete'),
    assign: can('categories.manage_coaches'),
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Operación"
        title="Profes"
        description="El cuerpo técnico del club y las categorías que tiene a cargo cada uno."
        actions={flags.create && <NewCoachButton />}
      >
        <CoachFilters />
      </ModuleHeader>

      <PageBody>
        {!coaches || !coaches.ok ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
            <AlertTriangle className="size-8" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">No se pudieron cargar los profes</h2>
              <p className="text-xs text-muted-foreground">
                {coaches?.message ?? 'Asegurate de que la API esté corriendo y probá recargar.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <CoachesList
              coaches={coaches.data.data}
              filtered={Boolean(query.q || (query.estado && query.estado !== 'active'))}
              canCreate={flags.create}
            />
            <Pagination meta={coaches.data.meta} label={{ one: 'profe', many: 'profes' }} />
          </>
        )}
      </PageBody>

      <CoachSheet
        coach={selected?.ok ? selected.data.data : null}
        notFound={Boolean(selectedId && !selected?.ok)}
        categories={categories ?? []}
        can={flags}
      />
    </>
  )
}
