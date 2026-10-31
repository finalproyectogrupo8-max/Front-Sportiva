import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ClipboardCheck, Clock, ExternalLink, MapPin, Megaphone, Shirt, Trophy } from 'lucide-react'
import { MatchActions, ResultForm } from '@/components/club/matches/match-detail'
import { NoAccess } from '@/components/club/no-access'
import { Pill, type Tone } from '@/components/club/shared'
import { buttonVariants } from '@/components/ui/button'
import { listCategories, listCompetitions } from '@/lib/api/club'
import { getMatch } from '@/lib/api/matches'
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
  const [result, categories, competitions] = await Promise.all([
    getMatch(matchId),
    listCategories(),
    can('competitions.view') ? listCompetitions() : Promise.resolve(null),
  ])
  if (!result.ok) notFound()

  const match = result.data.data
  const competitionList = competitions?.ok ? competitions.data.data : []
  const competition = competitionList.find((c) => c.id === match.competition_id)
  const status = STATUS[match.status] ?? STATUS.scheduled
  const back = `/c/${club}/partidos?desde=${dayKey(match.match_date)}`
  const played = match.status === 'played' && match.our_score != null && match.opponent_score != null
  const won = played && match.our_score! > match.opponent_score!
  const lost = played && match.our_score! < match.opponent_score!

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
      <Link href={back} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver al calendario
      </Link>

      {/* Encabezado */}
      <header className="flex flex-col gap-4 rounded-2xl bg-ink p-6 text-ink-foreground sm:p-8">
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
          </div>
          {played && (
            <p className="flex items-baseline gap-2 font-display text-5xl font-bold tabular-nums leading-none" aria-label={`Resultado: ${match.our_score} a ${match.opponent_score}`}>
              <span className={cn(won && 'text-success', lost && 'text-destructive')}>{match.our_score}</span>
              <span className="text-ink-foreground/50">–</span>
              <span>{match.opponent_score}</span>
            </p>
          )}
        </div>
        <p className="text-sm first-letter:uppercase text-ink-foreground/80">
          {formatLongDay(match.match_date)} · {formatTime(match.match_date)} h
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          {/* Datos para los jugadores */}
          <section className="flex flex-col gap-3 rounded-xl border bg-card p-5" aria-labelledby="match-info">
            <h2 id="match-info" className="text-sm font-semibold">Lo que ven los jugadores</h2>
            <ul className="flex flex-col gap-3 text-sm">
              <Info icon={Clock} label="Presentación">
                {match.meet_at ? `${formatTime(match.meet_at)} h` : <span className="text-muted-foreground">Sin definir</span>}
              </Info>
              <Info icon={MapPin} label="Lugar">
                {match.venue ?? <span className="text-muted-foreground">Sin definir</span>}
                {match.maps_url && (
                  <a href={match.maps_url} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 font-medium text-primary hover:underline">
                    Cómo llegar
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                )}
              </Info>
              <Info icon={Shirt} label="Camiseta">
                {match.uniform ? (match.uniform === 'home' ? 'Titular' : 'Alternativa') : <span className="text-muted-foreground">Sin definir</span>}
                {match.uniform_color && ` · ${match.uniform_color}`}
              </Info>
              {match.what_to_bring && (
                <Info icon={Trophy} label="Qué llevar">
                  <span className="whitespace-pre-line">{match.what_to_bring}</span>
                </Info>
              )}
            </ul>
            {match.notes && <p className="whitespace-pre-line rounded-lg bg-muted p-3 text-sm"><strong className="font-medium">Notas internas:</strong> {match.notes}</p>}
          </section>

          {/* Convocatoria (FRO-35) */}
          <section className="flex items-start gap-3 rounded-xl border border-dashed bg-card/50 p-5" aria-labelledby="match-callup">
            <Megaphone className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h2 id="match-callup" className="text-sm font-semibold">Convocatoria</h2>
              <p className="text-sm text-muted-foreground">
                Próximamente: elegir a los convocados entre los habilitados y mandarles la citación por WhatsApp con un link para confirmar.
              </p>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          {(can('attendance.record') || can('attendance.view')) && (
            <Link href={`/c/${club}/partidos/${match.id}/asistencia`} className={cn(buttonVariants({ size: 'lg' }), 'h-12 gap-2 text-base')}>
              <ClipboardCheck className="size-5" aria-hidden="true" />
              {can('attendance.record') ? 'Tomar asistencia' : 'Ver asistencia'}
            </Link>
          )}
          {can('matches.update') && <ResultForm key={`${match.status}-${match.our_score}-${match.opponent_score}`} match={match} />}
          <MatchActions
            match={match}
            backHref={back}
            categories={categories.ok ? categories.data.data.filter((c) => c.is_active || c.id === match.category_id).map((c) => ({ id: c.id, label: c.name })) : []}
            competitions={competitionList.map((c) => ({ id: c.id, label: c.name, category_ids: (c.categories ?? []).map((x) => x.id) }))}
            can={{ update: can('matches.update'), delete: can('matches.delete') }}
          />
        </div>
      </div>
    </div>
  )
}

function Info({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span>{children}</span>
      </div>
    </li>
  )
}
