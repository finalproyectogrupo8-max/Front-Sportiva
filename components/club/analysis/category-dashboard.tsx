'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, ArrowLeft, ChevronRight, Timer } from 'lucide-react'
import { ConfigSheet } from '@/components/club/forms'
import { Meter, ModuleHeader, PageBody, Pill, Segmented } from '@/components/club/shared'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CHART_COLORS, MetricTrend, ResultsChart, StatusBreakdown, WeeklyAttendanceChart } from './charts'
import { EvaluationList } from './evaluations'
import { longDate, needsAttention, PERIODS, rateTone, RESULT, shortDate, type Can, type CategoryDetail, type Evaluation, type Named, type PlayerStats } from './shared'

type View = 'equipo' | 'jugadores' | 'evaluaciones'

export function CategoryDashboard({
  backHref,
  matchesHref,
  period,
  detail,
  players,
  evaluations,
  coaches,
  view,
  playerId,
  can,
}: {
  backHref: string
  /** Para linkear cada partido a su página. */
  matchesHref: string
  period: string
  detail: CategoryDetail
  players: PlayerStats[]
  evaluations: Evaluation[]
  coaches: Named[]
  view: View
  playerId: number | null
  can: Can
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const attention = players.filter(needsAttention)
  const playerOptions = players.map((p) => ({ id: p.player_id, name: p.player_name }))
  const open = players.find((p) => p.player_id === playerId) ?? null

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null) params.delete(key)
    else params.set(key, value)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }
  const openPlayer = (id: number) => setParam('jugador', String(id))

  return (
    <div className={CHART_COLORS}>
      <ModuleHeader
        title={detail.category_name}
        description={`${detail.players} jugadores · ${detail.sessions} sesiones registradas en el período`}
        actions={
          <>
            <Segmented label="Período" value={period} onChange={(v) => setParam('periodo', v)} options={PERIODS.map((p) => ({ ...p }))} />
            {can.create && players.length > 0 && (
              <Link href={`${pathname}/prueba`} className={buttonVariants({ className: 'h-9 gap-2' })}>
                <Timer className="size-4" aria-hidden="true" />
                Tomar una prueba
              </Link>
            )}
          </>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Todas las categorías
          </Link>
          <Segmented
            label="Vista"
            value={view}
            onChange={(v) => setParam('vista', v === 'equipo' ? null : v)}
            options={[
              { value: 'equipo', label: 'Equipo' },
              { value: 'jugadores', label: 'Jugadores', count: players.length },
              { value: 'evaluaciones', label: 'Evaluaciones físicas', count: evaluations.length },
            ]}
          />
        </div>
      </ModuleHeader>

      <PageBody>
        {view === 'equipo' && <TeamView detail={detail} attention={attention} matchesHref={matchesHref} onPlayer={openPlayer} />}
        {view === 'jugadores' && <PlayersTable players={players} onPlayer={openPlayer} />}
        {view === 'evaluaciones' && <EvaluationList evaluations={evaluations} players={playerOptions} coaches={coaches} can={can} />}
      </PageBody>

      {open && (
        <PlayerSheet
          key={open.player_id}
          player={open}
          evaluations={evaluations.filter((e) => e.player_id === open.player_id)}
          players={playerOptions}
          coaches={coaches}
          can={can}
          onClose={() => setParam('jugador', null)}
        />
      )}
    </div>
  )
}

/** Un dato del resumen: la cifra y, debajo, de dónde sale. */
function Readout({ label, value, detail, tone }: { label: string; value: React.ReactNode; detail: React.ReactNode; tone?: 'bad' }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:px-5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={cn('text-2xl font-semibold leading-tight tabular-nums', tone === 'bad' && 'text-destructive')}>{value}</dd>
      <dd className="text-xs text-muted-foreground">{detail}</dd>
    </div>
  )
}

function Panel({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  const id = `panel-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`
  return (
    <section aria-labelledby={id} className={cn('flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5', className)}>
      <div className="flex flex-col gap-0.5">
        <h2 id={id} className="text-sm font-semibold">
          {title}
        </h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function TeamView({ detail, attention, matchesHref, onPlayer }: { detail: CategoryDetail; attention: PlayerStats[]; matchesHref: string; onPlayer: (id: number) => void }) {
  const r = detail.results
  const diff = r.goals_for - r.goals_against
  const hasWeeks = detail.weekly.some((w) => w.rate !== null)

  return (
    <>
      <dl className="grid grid-cols-2 divide-x divide-y rounded-xl border bg-card lg:grid-cols-4 lg:divide-y-0 [&>div:nth-child(2)]:border-r-0 lg:[&>div:nth-child(2)]:border-r">
        <Readout
          label="Asistencia"
          value={detail.attendance.rate === null ? '—' : `${detail.attendance.rate}%`}
          detail={detail.attendance.recorded ? `${detail.attendance.present} de ${detail.attendance.recorded} registros` : 'Sin asistencia registrada'}
        />
        <Readout label="Partidos ganados" value={r.played ? `${r.won} de ${r.played}` : '—'} detail={r.played ? `${r.drawn} ${r.drawn === 1 ? 'empatado' : 'empatados'} · ${r.lost} ${r.lost === 1 ? 'perdido' : 'perdidos'}` : 'Sin partidos jugados'} />
        <Readout
          label="A favor y en contra"
          value={r.played ? `${r.goals_for} – ${r.goals_against}` : '—'}
          detail={r.played ? `${diff > 0 ? '+' : ''}${diff} de diferencia` : 'Se cargan con el resultado del partido'}
        />
        <Readout
          label="Para mirar"
          value={attention.length ? `${attention.length} ${attention.length === 1 ? 'jugador' : 'jugadores'}` : 'Nadie'}
          detail="Faltan seguido o asisten menos del 60%"
          tone={attention.length ? 'bad' : undefined}
        />
      </dl>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Asistencia por semana" description="Presentes y tardes sobre lo registrado, entrenamientos y partidos.">
          {hasWeeks ? <WeeklyAttendanceChart weekly={detail.weekly} /> : <p className="text-sm text-muted-foreground">Todavía no hay asistencia registrada en este período.</p>}
        </Panel>
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Cómo se reparte la asistencia" description="Todos los registros del período.">
            <StatusBreakdown byStatus={detail.by_status} compact />
          </Panel>
          <Panel title="Para mirar" description="Jugadores que faltan seguido o asisten poco." className="flex-1">
            {attention.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nadie viene faltando seguido.</p>
            ) : (
              <ul className="flex flex-col divide-y text-sm">
                {attention.map((p) => (
                  <li key={p.player_id}>
                    <button type="button" onClick={() => onPlayer(p.player_id)} className="flex w-full items-center gap-3 py-2 text-left hover:text-primary">
                      <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{p.player_name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {p.absent_streak >= 2 ? `${p.absent_streak} faltas seguidas sin aviso` : `Asiste al ${p.attendance.rate}%`}
                        </span>
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="Resultados partido a partido" description="Tantos a favor y en contra de cada partido jugado. Tocá un partido para abrirlo.">
        {detail.matches.length ? (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-3">
              <ResultsChart matches={detail.matches} />
            </div>
            <ul className="flex flex-col divide-y self-start text-sm">
              {[...detail.matches].reverse().slice(0, 8).map((m) => (
                <li key={m.id}>
                  <Link href={`${matchesHref}/${m.id}`} className="flex items-center gap-3 py-2 hover:text-primary">
                    <Pill tone={RESULT[m.result].tone} className="w-7 justify-center px-0">
                      {RESULT[m.result].short}
                    </Pill>
                    <span className="min-w-0 flex-1 truncate">
                      {m.is_home ? 'vs' : 'en'} {m.opponent}
                    </span>
                    <span className="font-medium tabular-nums">
                      {m.our_score} – {m.opponent_score}
                    </span>
                    <span className="w-14 text-right text-xs text-muted-foreground">{shortDate(m.date)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay partidos con resultado cargado en este período.</p>
        )}
      </Panel>
    </>
  )
}

type Sort = 'nombre' | 'asistencia'

function PlayersTable({ players, onPlayer }: { players: PlayerStats[]; onPlayer: (id: number) => void }) {
  const [sort, setSort] = useState<Sort>('nombre')
  const rows = useMemo(
    () => (sort === 'nombre' ? players : [...players].sort((a, b) => (a.attendance.rate ?? 101) - (b.attendance.rate ?? 101))),
    [players, sort],
  )

  if (players.length === 0) return <p className="text-sm text-muted-foreground">La categoría no tiene jugadores activos.</p>

  return (
    <div className="flex flex-col gap-3">
      <Segmented
        label="Ordenar por"
        value={sort}
        onChange={setSort}
        options={[
          { value: 'nombre', label: 'Nombre' },
          { value: 'asistencia', label: 'Menor asistencia' },
        ]}
      />
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">Asistencia y evaluaciones por jugador. Elegí uno para ver su detalle.</caption>
          <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">Jugador</th>
              <th scope="col" className="w-52 px-4 py-2.5 font-medium">Asistencia</th>
              <th scope="col" className="px-2 py-2.5 text-right font-medium"><abbr title="Presente" className="no-underline">P</abbr></th>
              <th scope="col" className="px-2 py-2.5 text-right font-medium"><abbr title="Tarde" className="no-underline">T</abbr></th>
              <th scope="col" className="px-2 py-2.5 text-right font-medium"><abbr title="Faltó con aviso" className="no-underline">CA</abbr></th>
              <th scope="col" className="px-2 py-2.5 text-right font-medium"><abbr title="Faltó sin aviso" className="no-underline">SA</abbr></th>
              <th scope="col" className="px-4 py-2.5 font-medium">Última evaluación</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((p) => (
              <tr key={p.player_id} className="group relative transition-colors hover:bg-muted/40 focus-within:bg-muted/40">
                <td className="px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => onPlayer(p.player_id)}
                    className="text-left font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-sm focus-visible:after:ring-2 focus-visible:after:ring-ring"
                  >
                    {p.player_name}
                  </button>
                  {needsAttention(p) && (
                    <Pill tone="bad" className="ml-2">
                      Para mirar
                    </Pill>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {p.attendance.rate === null ? (
                    <span className="text-muted-foreground">Sin registros</span>
                  ) : (
                    <span className="flex items-center gap-3">
                      <Meter value={p.attendance.rate} tone={rateTone(p.attendance.rate)} />
                      <span className="w-10 text-right tabular-nums">{p.attendance.rate}%</span>
                    </span>
                  )}
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums">{p.by_status.present}</td>
                <td className="px-2 py-2.5 text-right tabular-nums">{p.by_status.late}</td>
                <td className="px-2 py-2.5 text-right tabular-nums">{p.by_status.excused}</td>
                <td className={cn('px-2 py-2.5 text-right tabular-nums', p.by_status.absent > 0 && 'font-semibold text-destructive')}>{p.by_status.absent}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.last_evaluated_at ? shortDate(p.last_evaluated_at) : 'Nunca'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlayerSheet({
  player,
  evaluations,
  players,
  coaches,
  can,
  onClose,
}: {
  player: PlayerStats
  evaluations: Evaluation[]
  players: Named[]
  coaches: Named[]
  can: Can
  onClose: () => void
}) {
  // Una tendencia por prueba numérica, con las mediciones de la más vieja a la más nueva.
  const trends = useMemo(() => {
    const byMetric = new Map<string, { name: string; unit: string | null; points: { at: string; value: number }[] }>()
    for (const e of [...evaluations].sort((a, b) => a.evaluated_at.localeCompare(b.evaluated_at))) {
      for (const m of e.measurements ?? []) {
        if (m.numeric_value === null) continue
        const entry = byMetric.get(m.metric_key) ?? { name: m.metric_name, unit: m.unit, points: [] }
        entry.points.push({ at: e.evaluated_at, value: m.numeric_value })
        byMetric.set(m.metric_key, entry)
      }
    }
    return [...byMetric.entries()].map(([key, v]) => ({ key, ...v }))
  }, [evaluations])

  return (
    <ConfigSheet open onOpenChange={(o) => !o && onClose()} title={player.player_name} description={player.last_evaluated_at ? `Última evaluación: ${longDate(player.last_evaluated_at)}` : 'Sin evaluaciones físicas'} wide>
      <div className={cn('flex flex-col gap-6 px-4 pb-6', CHART_COLORS)}>
        <dl className="grid grid-cols-3 divide-x rounded-xl border">
          <Readout label="Asistencia" value={player.attendance.rate === null ? '—' : `${player.attendance.rate}%`} detail={`${player.attendance.present} de ${player.attendance.recorded}`} />
          <Readout label="Faltas seguidas" value={player.absent_streak} detail="sin aviso, hasta hoy" tone={player.absent_streak >= 2 ? 'bad' : undefined} />
          <Readout label="Evaluaciones" value={player.evaluations} detail="en total" />
        </dl>

        <section aria-labelledby="player-attendance" className="flex flex-col gap-3">
          <h3 id="player-attendance" className="text-sm font-semibold">
            Asistencia del período
          </h3>
          <StatusBreakdown byStatus={player.by_status} compact />
        </section>

        <section aria-labelledby="player-evolution" className="flex flex-col gap-3">
          <h3 id="player-evolution" className="text-sm font-semibold">
            Evolución física
          </h3>
          {trends.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cuando tenga pruebas con valores numéricos, acá se ve cómo evoluciona cada una.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {trends.map((t) => (
                <MetricTrend key={t.key} name={t.name} unit={t.unit} points={t.points} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="player-evaluations" className="flex flex-col gap-3">
          <h3 id="player-evaluations" className="text-sm font-semibold">
            Evaluaciones
          </h3>
          <EvaluationList evaluations={evaluations} players={players} coaches={coaches} can={can} showPlayer={false} newFor={player.player_id} />
        </section>
      </div>
    </ConfigSheet>
  )
}
