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
  type Sport,
  type Venue,
} from '@/lib/api/club'
import { CONFIG_TABS, canSeeConfig, type ConfigTab } from '@/lib/club-config'
import { getSetupSteps } from '@/lib/club-setup'
import { isBranch } from '@/lib/branches'
import { requireSession } from '@/lib/session'
import { cn } from '@/lib/utils'

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
  const can = (permission: string) => permissions.includes(permission)

  if (!canSeeConfig(permissions)) {
    return <NoAccess moduleName="Configuración" homeHref={`/c/${club}`} />
  }

  const pending = new Set((await getSetupSteps())?.filter((s) => !s.done).map((s) => s.tab))
  const tabs = CONFIG_TABS.filter((t) => (t.permissions ?? []).every(can))
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
          // '' = sin filtro elegido (Competencias arranca en la temporada en curso); 'todos' = todas.
          filters={{ sport: query.deporte ?? '', season: query.temporada ?? '', branch: query.rama ?? '' }}
        />
      </PageBody>
    </>
  )
}

type Crud = { create: boolean; update: boolean; delete: boolean }
type Failure = Exclude<ApiResult<unknown>, { ok: true }>

/** Datos de la pestaña. `error` sin `result` es que la API no respondió. */
type TabData =
  | { tab: 'perfil'; club: Club }
  | { tab: 'sedes'; venues: Venue[] }
  | { tab: 'deportes'; sports: SportRow[] }
  | { tab: 'temporadas'; seasons: SeasonRow[] }
  | { tab: 'categorias'; categories: Category[]; sports: Sport[]; seasons: Season[]; sport?: number; season?: number; branch?: string }
  | {
      tab: 'competencias'
      competitions: Competition[]
      sports: Sport[]
      seasons: Season[]
      categories: Category[]
      sport?: number
      season?: number
    }
  | { tab: 'error'; result?: Failure }

async function loadTab(tab: ConfigTab, filters: { sport: string; season: string; branch: string }): Promise<TabData> {
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
      const [sports, categories] = await Promise.all([listSports(), listCategories()])
      if (!sports.ok) return { tab: 'error', result: sports }
      const active = categories.ok ? categories.data.data.filter((c) => c.is_active) : []
      return {
        tab,
        sports: sports.data.data.map((s) => ({ ...s, categories: active.filter((c) => c.sport_id === s.id).length })),
      }
    }

    if (tab === 'temporadas') {
      const [seasons, categories] = await Promise.all([listSeasons(), listCategories()])
      if (!seasons.ok) return { tab: 'error', result: seasons }
      const all = categories.ok ? categories.data.data : []
      return {
        tab,
        seasons: seasons.data.data.map((s) => ({ ...s, categories: all.filter((c) => c.season_id === s.id).length })),
      }
    }

    if (tab === 'competencias') {
      // El profe ve las competencias de sus categorías, pero no tiene sports.view ni seasons.view:
      // sin esas listas, la tarjeta muestra lo que tiene y no se puede editar.
      const [sports, seasons, categories] = await Promise.all([listSports(), listSeasons(), listCategories()])
      const seasonList = seasons.ok ? seasons.data.data : []
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
        competitions: competitions.data.data,
        sports: sports.ok ? sports.data.data : [],
        seasons: seasonList,
        categories: categories.ok ? categories.data.data : [],
        sport,
        season,
      }
    }

    const sport = Number(filters.sport) || undefined
    const season = Number(filters.season) || undefined
    const [categories, sports, seasons] = await Promise.all([
      listCategories({ sport_id: sport, season_id: season, branch: isBranch(filters.branch) ? filters.branch : undefined }),
      listSports(),
      listSeasons(),
    ])
    if (!categories.ok) return { tab: 'error', result: categories }
    return {
      tab,
      categories: categories.data.data,
      sports: sports.ok ? sports.data.data : [],
      seasons: seasons.ok ? seasons.data.data : [],
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
  filters,
}: {
  club: string
  tab: ConfigTab
  canEditProfile: boolean
  crud: (resource: string) => Crud
  filters: { sport: string; season: string; branch: string }
}) {
  const data = await loadTab(tab, filters)

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
            : result?.message ?? 'Asegurate de que la API esté corriendo y probá recargar.'}
        </p>
      </div>
    </div>
  )
}
