import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { CategoriesSection } from '@/components/club/config/categories-section'
import { CompetitionsSection } from '@/components/club/config/competitions-section'
import { ProfileSection } from '@/components/club/config/profile-section'
import { SeasonsSection, type SeasonRow } from '@/components/club/config/seasons-section'
import { SportsSection, type SportRow } from '@/components/club/config/sports-section'
import { VenuesSection } from '@/components/club/config/venues-section'
import { NoAccess } from '@/components/club/no-access'
import { ModuleHeader, PageBody } from '@/components/club/shared'
import type { ApiResult } from '@/lib/api/client'
import {
  getClub,
  listCategories,
  listCompetitions,
  listSeasons,
  listSports,
  listVenues,
  type Category,
  type Club,
  type Competition,
  type Season,
  type SportOption,
  type Venue,
} from '@/lib/api/club'
import { canSeeConfig, filterBySportScope, visibleConfigTabs, type ConfigTab } from '@/lib/club-config'
import { getSetupSteps } from '@/lib/club-setup'
import { isBranch } from '@/lib/branches'
import { requireSession } from '@/lib/session'
import { cn } from '@/lib/utils'
import type { Schemas } from '@/lib/api/client'

export const metadata: Metadata = { title: 'Configuración del club — Sportiva' }

type Props = {
  params: Promise<{ club: string }>
  searchParams: Promise<{ tab?: string; deporte?: string; temporada?: string; rama?: string }>
}

export default async function ConfigPage({ params, searchParams }: Props) {
  const { club } = await params
  const query = await searchParams
  const session = await requireSession()
  const permissions = session.permissions ?? []
  const permissionScopes = session.permissionScopes ?? {}
  const assignedSports = session.sports ?? []
  const can = (permission: string) => permissions.includes(permission)

  if (!canSeeConfig(permissions)) {
    return <NoAccess moduleName="Configuración" homeHref={`/c/${club}`} />
  }

  const pending = new Set((await getSetupSteps())?.filter((s) => !s.done).map((s) => s.tab))
  const tabs = visibleConfigTabs(permissions)
  const tab: ConfigTab = tabs.find((t) => t.id === query.tab)?.id ?? tabs[0].id
  const crud = (resource: string) => ({
    create: can(`${resource}.create`),
    update: can(`${resource}.update`),
    delete: can(`${resource}.delete`),
  })

  return (
    <>
      <ModuleHeader
        eyebrow="Club"
        title="Configuración"
        description="Perfil, deportes, temporadas, categorías y competencias: lo primero que se carga, antes de los jugadores."
      >
        <nav aria-label="Secciones de la configuración" className="-mb-4 flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={`/c/${club}/configuracion?tab=${t.id}`}
              aria-current={t.id === tab ? 'page' : undefined}
              className={cn(
                'shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                t.id === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              {pending.has(t.id) && (
                <>
                  <span className="ml-1.5 inline-block size-1.5 -translate-y-0.5 rounded-full bg-primary" aria-hidden="true" />
                  <span className="sr-only"> (pendiente)</span>
                </>
              )}
            </Link>
          ))}
        </nav>
      </ModuleHeader>

      <PageBody>
        <TabContent
          club={club}
          tab={tab}
          canEditProfile={can('club.update')}
          crud={crud}
          access={{ permissions, permissionScopes, assignedSports }}
          // '' = sin filtro elegido (Competencias arranca en la temporada en curso); 'todos' = todas.
          filters={{ sport: query.deporte ?? '', season: query.temporada ?? '', branch: query.rama ?? '' }}
        />
      </PageBody>
    </>
  )
}

type Crud = { create: boolean; update: boolean; delete: boolean }
type Failure = Exclude<ApiResult<unknown>, { ok: true }>
type ConfigAccess = {
  permissions: string[]
  permissionScopes: Record<string, string>
  assignedSports: Schemas['MeResource']['sports']
}

/** Datos de la pestaña. `error` sin `result` es que la API no respondió. */
type TabData =
  | { tab: 'perfil'; club: Club }
  | { tab: 'sedes'; venues: Venue[] }
  | { tab: 'deportes'; sports: SportRow[] }
  | { tab: 'temporadas'; seasons: SeasonRow[] }
  | { tab: 'categorias'; categories: Category[]; sports: SportOption[]; seasons: Season[]; sport?: number; season?: number; branch?: string }
  | {
      tab: 'competencias'
      competitions: Competition[]
      sports: SportOption[]
      seasons: Season[]
      categories: Category[]
      sport?: number
      season?: number
    }
  | { tab: 'error'; result?: Failure }

async function loadSportsFor(
  permission: string,
  access: ConfigAccess,
): Promise<{ ok: true; sports: SportOption[] } | { ok: false; result: Failure }> {
  const assigned = access.assignedSports
  if (!access.permissions.includes('sports.view')) {
    return { ok: true, sports: assigned }
  }

  const result = await listSports()
  if (!result.ok) return { ok: false, result }

  const sportScope =
    access.permissionScopes[permission] === 'sport' || access.permissionScopes['sports.view'] === 'sport'
  const assignedIds = new Set(assigned.map((sport) => sport.id))
  const sports = sportScope
    ? result.data.data.filter((sport) => assignedIds.has(sport.id))
    : result.data.data

  return { ok: true, sports }
}

async function loadTab(
  tab: ConfigTab,
  filters: { sport: string; season: string; branch: string },
  access: ConfigAccess,
): Promise<TabData> {
  try {
    if (tab === 'perfil') {
      const result = await getClub()
      return result.ok ? { tab, club: result.data.data } : { tab: 'error', result }
    }

    if (tab === 'sedes') {
      const venues = await listVenues()
      return venues.ok ? { tab, venues: venues.data.data } : { tab: 'error', result: venues }
    }

    if (tab === 'deportes') {
      const [sports, categories] = await Promise.all([
        listSports(),
        access.permissions.includes('categories.view') ? listCategories() : Promise.resolve(null),
      ])
      if (!sports.ok) return { tab: 'error', result: sports }
      if (categories && !categories.ok) return { tab: 'error', result: categories }
      const active = categories?.ok ? categories.data.data.filter((c) => c.is_active) : null
      const assignedIds = new Set(access.assignedSports.map((sport) => sport.id))
      const visibleSports =
        access.permissionScopes['sports.view'] === 'sport'
          ? sports.data.data.filter((sport) => assignedIds.has(sport.id))
          : sports.data.data
      return {
        tab,
        sports: visibleSports.map((sport) => ({
          ...sport,
          categories: active ? active.filter((category) => category.sport_id === sport.id).length : null,
        })),
      }
    }

    if (tab === 'temporadas') {
      const [seasons, categories] = await Promise.all([
        listSeasons(),
        access.permissions.includes('categories.view') ? listCategories() : Promise.resolve(null),
      ])
      if (!seasons.ok) return { tab: 'error', result: seasons }
      if (categories && !categories.ok) return { tab: 'error', result: categories }
      const all = categories?.ok ? categories.data.data : []
      return {
        tab,
        seasons: seasons.data.data.map((s) => ({ ...s, categories: all.filter((c) => c.season_id === s.id).length })),
      }
    }

    if (tab === 'competencias') {
      const [sports, seasonsResult, categories] = await Promise.all([
        loadSportsFor('competitions.view', access),
        access.permissions.includes('seasons.view') ? listSeasons() : Promise.resolve(null),
        access.permissions.includes('categories.view') ? listCategories() : Promise.resolve(null),
      ])
      if (!sports.ok) return { tab: 'error', result: sports.result }
      if (seasonsResult && !seasonsResult.ok) return { tab: 'error', result: seasonsResult }
      if (categories && !categories.ok) return { tab: 'error', result: categories }
      const seasonList = seasonsResult?.ok ? seasonsResult.data.data : []
      // Por defecto, la temporada en curso.
      const season =
        filters.season === 'todos'
          ? undefined
          : Number(filters.season) || seasonList.find((s) => s.status === 'active')?.id
      const sport = Number(filters.sport) || undefined
      const competitions = await listCompetitions({ season_id: season, sport_id: sport })
      if (!competitions.ok) return { tab: 'error', result: competitions }
      return {
        tab,
        competitions: filterBySportScope(
          competitions.data.data,
          access.permissionScopes['competitions.view'],
          access.assignedSports.map((assigned) => assigned.id),
        ),
        sports: sports.sports,
        seasons: seasonList,
        categories: categories?.ok
          ? filterBySportScope(
              categories.data.data,
              access.permissionScopes['categories.view'],
              access.assignedSports.map((assigned) => assigned.id),
            )
          : [],
        sport,
        season,
      }
    }

    const sport = Number(filters.sport) || undefined
    const season = Number(filters.season) || undefined
    const [categories, sports, seasonsResult] = await Promise.all([
      listCategories({ sport_id: sport, season_id: season, branch: isBranch(filters.branch) ? filters.branch : undefined }),
      loadSportsFor('categories.view', access),
      access.permissions.includes('seasons.view') ? listSeasons() : Promise.resolve(null),
    ])
    if (!categories.ok) return { tab: 'error', result: categories }
    if (!sports.ok) return { tab: 'error', result: sports.result }
    if (seasonsResult && !seasonsResult.ok) return { tab: 'error', result: seasonsResult }
    return {
      tab,
      categories: filterBySportScope(
        categories.data.data,
        access.permissionScopes['categories.view'],
        access.assignedSports.map((assigned) => assigned.id),
      ),
      sports: sports.sports,
      seasons: seasonsResult?.ok ? seasonsResult.data.data : [],
      sport,
      season,
      branch: isBranch(filters.branch) ? filters.branch : undefined,
    }
  } catch {
    return { tab: 'error' }
  }
}

async function TabContent({
  club,
  tab,
  canEditProfile,
  crud,
  access,
  filters,
}: {
  club: string
  tab: ConfigTab
  canEditProfile: boolean
  crud: (resource: string) => Crud
  access: ConfigAccess
  filters: { sport: string; season: string; branch: string }
}) {
  const data = await loadTab(tab, filters, access)

  switch (data.tab) {
    case 'perfil':
      return (
        // Al guardar, los valores nuevos vuelven del servidor: la key remonta el formulario con ellos.
        <ProfileSection key={JSON.stringify(data.club)} club={data.club} canEdit={canEditProfile} />
      )
    case 'sedes':
      return <VenuesSection club={club} venues={data.venues} can={crud('venues')} />
    case 'deportes':
      return <SportsSection sports={data.sports} can={crud('sports')} />
    case 'temporadas':
      return <SeasonsSection seasons={data.seasons} can={crud('seasons')} />
    case 'categorias':
      return (
        <CategoriesSection
          categories={data.categories}
          sports={data.sports}
          seasons={data.seasons}
          filters={{ sport: data.sport ? String(data.sport) : 'todos', season: data.season ? String(data.season) : 'todos', branch: data.branch ?? 'todos' }}
          can={crud('categories')}
        />
      )
    case 'competencias':
      return (
        <CompetitionsSection
          competitions={data.competitions}
          sports={data.sports}
          seasons={data.seasons}
          categories={data.categories}
          filters={{ sport: data.sport ? String(data.sport) : 'todos', season: data.season ? String(data.season) : 'todos' }}
          can={crud('competitions')}
        />
      )
    default:
      return <LoadError result={data.result} />
  }
}

function LoadError({ result }: { result?: Failure }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
      <AlertTriangle className="size-8" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">
          {result ? 'No se pudo cargar esta sección' : 'Error de conexión con la API'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {result?.kind === 'forbidden'
            ? 'No tenés permiso para ver esta sección.'
            : result?.status === 404
              ? 'La sección o los datos solicitados ya no están disponibles.'
            : result?.message ?? 'Asegurate de que la API esté corriendo y probá recargar.'}
        </p>
      </div>
    </div>
  )
}
