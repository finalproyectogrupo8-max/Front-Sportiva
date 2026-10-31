import type { Metadata } from 'next'
import { AlertTriangle } from 'lucide-react'
import { Pagination } from '@/components/admin/pagination'
import { NoAccess } from '@/components/club/no-access'
import { NewPlayerButton } from '@/components/club/players/player-form'
import { PlayerFilters } from '@/components/club/players/player-filters'
import { PlayerSheet, type PlayerDetail } from '@/components/club/players/player-sheet'
import { PlayersTable } from '@/components/club/players/players-table'
import { ModuleHeader, PageBody } from '@/components/club/shared'
import { listCategories, listSports, type Category } from '@/lib/api/club'
import { getPlayer, listContacts, listPlayerMemberships, listPlayers } from '@/lib/api/players'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Jugadores — Sportiva' }

type Props = {
  params: Promise<{ club: string }>
  searchParams: Promise<{ q?: string; categoria?: string; estado?: string; page?: string; id?: string }>
}

/** Categorías activas con el deporte en el nombre si el club tiene más de uno ("Sub-15 · Fútbol"). */
async function categoryOptions(): Promise<(Category & { label: string })[]> {
  const [categories, sports] = await Promise.all([listCategories(), listSports().catch(() => null)])
  if (!categories.ok) return []
  const sportName = new Map(sports?.ok ? sports.data.data.map((s) => [s.id, s.name]) : [])
  const manySports = new Set(categories.data.data.map((c) => c.sport_id)).size > 1
  return categories.data.data
    .filter((c) => c.is_active)
    .map((c) => ({
      ...c,
      label: manySports && sportName.get(c.sport_id) ? `${c.name} · ${sportName.get(c.sport_id)}` : c.name,
    }))
}

async function loadDetail(id: number, canSeeContacts: boolean): Promise<PlayerDetail | null> {
  const [player, history, contacts] = await Promise.all([
    getPlayer(id),
    listPlayerMemberships(id),
    canSeeContacts ? listContacts(id) : Promise.resolve(null),
  ])
  if (!player.ok) return null
  return {
    player: player.data.data,
    history: history.ok ? history.data.data : [],
    contacts: contacts?.ok ? contacts.data.data : null,
  }
}

export default async function PlayersPage({ params, searchParams }: Props) {
  const { club } = await params
  const query = await searchParams
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  const can = (permission: string) => permissions.has(permission)

  if (!can('players.view')) return <NoAccess moduleName="Jugadores" homeHref={`/c/${club}`} />

  const page = Math.max(1, Number(query.page) || 1)
  const categoryId = Number(query.categoria) || undefined
  const selectedId = Number(query.id) || null

  let players, categories, detail
  try {
    ;[players, categories, detail] = await Promise.all([
      listPlayers({ search: query.q?.trim() || undefined, category_id: categoryId, status: query.estado === 'todos' ? undefined : query.estado || 'active', page }),
      categoryOptions(),
      selectedId ? loadDetail(selectedId, can('player_contacts.view')) : Promise.resolve(null),
    ])
  } catch {
    players = null
  }

  const flags = {
    create: can('players.create'),
    update: can('players.update'),
    delete: can('players.delete'),
    managePlayers: can('categories.manage_players'),
    contacts: can('player_contacts.update'),
    photo: can('player_documents.upload'),
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Deportivo"
        title="Jugadores"
        description="La ficha de cada jugador: datos, contactos de la familia, foto y las categorías en las que juega."
        actions={flags.create && <NewPlayerButton categories={categories ?? []} />}
      >
        <PlayerFilters categories={categories ?? []} />
      </ModuleHeader>

      <PageBody>
        {!players ? (
          <LoadError message="Asegurate de que la API esté corriendo y probá recargar." />
        ) : !players.ok ? (
          <LoadError message={players.message} />
        ) : (
          <>
            <PlayersTable
              club={club}
              players={players.data.data}
              filtered={Boolean(query.q || categoryId || (query.estado && query.estado !== 'active'))}
              canCreate={flags.create}
            />
            <Pagination meta={players.data.meta} label={{ one: 'jugador', many: 'jugadores' }} />
          </>
        )}
      </PageBody>

      <PlayerSheet
        club={club}
        detail={detail ?? null}
        notFound={Boolean(selectedId && !detail)}
        categories={categories ?? []}
        can={flags}
      />
    </>
  )
}

function LoadError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
      <AlertTriangle className="size-8" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">No se pudieron cargar los jugadores</h2>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
