import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Backpack, ExternalLink, MapPin, Megaphone, NotebookPen } from 'lucide-react'
import { MapPreview } from '@/components/club/address-picker'
import { AttendanceCard } from '@/components/club/matches/attendance-card'
import { CallupPanel } from '@/components/club/matches/callup-panel'
import { MatchActions, ResultForm } from '@/components/club/matches/match-detail'
import { NoAccess } from '@/components/club/no-access'
import { Pill, type Tone } from '@/components/club/shared'
import { listCategories, listCompetitions, listVenues } from '@/lib/api/club'
import { getAttendance, getCallup, getMatch } from '@/lib/api/matches'
import { dayKey, formatLongDay, formatTime } from '@/lib/club-time'
import { requireSession } from '@/lib/session'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Partido — Sportiva' }

const STATUS: Record<string, { label: string; tone: Tone }> = {
  scheduled: { label: 'Programado', tone: 'info' },
  played: { label: 'Jugado', tone: 'ok' },
  postponed: { label: 'Postergado', tone: 'warn' },
  cancelled: { label: 'Suspendido', tone: 'neutral' },
}

export default async function MatchPage({ params }: { params: Promise<{ club: string; id: string }> }) {
  const { club, id } = await params
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  const can = (p: string) => permissions.has(p)
  if (!can('matches.view')) return <NoAccess moduleName="Partidos" homeHref={`/c/${club}`} />

  const matchId = Number(id)
  if (!matchId) notFound()
  const canAttendance = can('attendance.record') || can('attendance.view')
  const [result, categories, competitions, venues, callup, attendance] = await Promise.all([
    getMatch(matchId),
    listCategories(),
    can('competitions.view') ? listCompetitions() : Promise.resolve(null),
    can('venues.view') ? listVenues() : Promise.resolve(null),
    can('callups.view') ? getCallup(matchId).catch(() => null) : Promise.resolve(null),
    canAttendance ? getAttendance('matches', matchId).catch(() => null) : Promise.resolve(null),
  ])
  if (!result.ok) notFound()

  const match = result.data.data
  const competitionList = competitions?.ok ? competitions.data.data : []
  const competition = competitionList.find((c) => c.id === match.competition_id)
  const status = STATUS[match.status] ?? STATUS.scheduled
  const back = `/c/${club}/partidos?desde=${dayKey(match.match_date)}`
  // El mapa sale del link de Google Maps (coordenadas o dirección) o, si no hay, del lugar escrito.
  const mapQuery = mapsQuery(match.maps_url) || match.venue
  const played = match.status === 'played' && match.our_score != null && match.opponent_score != null
  const won = played && match.our_score! > match.opponent_score!
  const lost = played && match.our_score! < match.opponent_score!
  const showCallup = can('callups.view')

  const side = (
    <>
      {canAttendance && attendance?.ok && (
        <AttendanceCard
          kind="matches"
          eventId={match.id}
          title={`${match.is_home ? 'vs' : 'en'} ${match.opponent}`}
          subtitle={match.category_name ?? 'Partido'}
          rows={attendance.data.data}
          canRecord={can('attendance.record')}
          pageHref={`/c/${club}/partidos/${match.id}/asistencia`}
        />
      )}
      {can('matches.update') && <ResultForm key={`${match.status}-${match.our_score}-${match.opponent_score}`} match={match} />}
      {match.notes && (
        <section className="flex flex-col gap-2 rounded-xl border bg-card p-5 text-sm" aria-labelledby="match-notes">
          <h2 id="match-notes" className="flex items-center gap-2 font-semibold">
            <NotebookPen className="size-4 text-muted-foreground" aria-hidden="true" />
            Notas internas
          </h2>
          <p className="whitespace-pre-line text-muted-foreground">{match.notes}</p>
        </section>
      )}
      <MatchActions
        club={club}
        venues={venues?.ok ? venues.data.data.filter((v) => v.is_active || v.id === match.venue_id) : []}
        match={match}
        backHref={back}
        categories={categories.ok ? categories.data.data.filter((c) => c.is_active || c.id === match.category_id).map((c) => ({ id: c.id, label: c.name })) : []}
        competitions={competitionList.map((c) => ({ id: c.id, label: c.name, category_ids: (c.categories ?? []).map((x) => x.id) }))}
        can={{ update: can('matches.update'), delete: can('matches.delete') }}
      />
    </>
  )

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
      <Link href={back} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al calendario
      </Link>

      {/* Encabezado: el partido y todo lo que necesita saber el jugador, con el mapa al costado. */}
      <header className={cn('grid overflow-hidden rounded-2xl bg-ink text-ink-foreground', mapQuery && 'lg:grid-cols-[minmax(0,1fr)_380px]')}>
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-ink-foreground/70">
            <span>{match.category_name}</span>
            {competition && <span>· {competition.name}</span>}
            <Pill tone={status.tone} className="ml-auto normal-case tracking-normal">
              {status.label}
            </Pill>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-ink-foreground/70">{match.is_home ? 'Local vs' : 'Visitante en cancha de'}</span>
              <h1 className="font-display text-4xl font-bold uppercase leading-none sm:text-5xl">{match.opponent}</h1>
              <p className="mt-1 text-sm text-ink-foreground/80 first-letter:uppercase">{formatLongDay(match.match_date)}</p>
            </div>
            {played && (
              <p className="flex items-baseline gap-2 font-display text-5xl font-bold tabular-nums leading-none" aria-label={`Resultado: ${match.our_score} a ${match.opponent_score}`}>
                <span className={cn(won && 'text-success', lost && 'text-destructive')}>{match.our_score}</span>
                <span className="text-ink-foreground/50">–</span>
                <span>{match.opponent_score}</span>
              </p>
            )}
          </div>

          <dl className="grid grid-cols-3 gap-3 border-t border-ink-foreground/15 pt-5">
            <Fact label="Presentación" value={match.meet_at ? `${formatTime(match.meet_at)} h` : '—'} accent />
            <Fact label="Partido" value={`${formatTime(match.match_date)} h`} />
            <Fact
              label="Camiseta"
              value={match.uniform ? (match.uniform === 'home' ? 'Titular' : 'Alternativa') : '—'}
              hint={match.uniform_color ?? undefined}
            />
          </dl>

          <div className="flex flex-col gap-3 text-sm">
            <p className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-ink-foreground/60" aria-hidden="true" />
              <span>
                {match.venue ?? <span className="text-ink-foreground/60">Lugar sin definir</span>}
                {match.maps_url && (
                  <a href={match.maps_url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 font-medium text-[#f0a37f] hover:underline">
                    Cómo llegar
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                )}
              </span>
            </p>
            {match.what_to_bring && (
              <p className="flex items-start gap-2.5">
                <Backpack className="mt-0.5 size-4 shrink-0 text-ink-foreground/60" aria-hidden="true" />
                <span className="whitespace-pre-line">{match.what_to_bring}</span>
              </p>
            )}
          </div>
        </div>
        {mapQuery && <MapPreview place={{ address: mapQuery, latitude: null, longitude: null }} className="h-56 rounded-none border-0 lg:h-full" />}
      </header>

      {showCallup ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* Convocatoria (FRO-35) */}
          {callup?.ok ? (
            <CallupPanel
              sheet={callup.data.data}
              pollQuestion={`¿Vas al partido ${match.is_home ? 'vs' : 'en cancha de'} ${match.opponent}? ${capitalize(formatLongDay(match.match_date))} · ${match.meet_at ? `presentación ${formatTime(match.meet_at)} h` : `${formatTime(match.match_date)} h`}`}
              can={{ update: can('callups.update'), publish: can('callups.publish') }}
            />
          ) : (
            <section className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-5" aria-labelledby="match-callup">
              <Megaphone className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <h2 id="match-callup" className="text-sm font-semibold">Convocatoria</h2>
                <p className="text-sm text-muted-foreground">No se pudo cargar la convocatoria. Probá recargar la página.</p>
              </div>
            </section>
          )}
          <aside className="flex flex-col gap-6">{side}</aside>
        </div>
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-2">{side}</div>
      )}
    </div>
  )
}

function Fact({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[11px] uppercase tracking-wide text-ink-foreground/60">{label}</dt>
      <dd className={cn('truncate font-display text-2xl font-bold leading-tight', accent && 'text-[#f0a37f]')}>{value}</dd>
      {hint && <dd className="truncate text-xs text-ink-foreground/70">{hint}</dd>}
    </div>
  )
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Lo que busca el link de Google Maps que arma la API (`?query=`). null si es otro tipo de link. */
function mapsQuery(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).searchParams.get('query')
  } catch {
    return null
  }
}
