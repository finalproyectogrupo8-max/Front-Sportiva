'use client'

import Link from 'next/link'
import { ArrowRight, CalendarClock, MapPin } from 'lucide-react'
import { TODAY, daysFromToday, formatDay, points } from '@/lib/data'
import type { ModuleId } from '@/lib/modules'
import { cn } from '@/lib/utils'
import { useClub } from './club-provider'
import { Initials, Pill } from './shared'
import { useAlerts } from './use-alerts'
import { KitSwatch } from './kit-swatch'

function relative(days: number) {
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Mañana'
  if (days < 0) return `Hace ${Math.abs(days)} días`
  return `En ${days} días`
}

export function HomeDashboard() {
  const { tenant, data, modules, canSee } = useClub()
  const seesMatches = canSee('partidos')
  const seesCoaches = canSee('profes')
  const alerts = useAlerts()
  const base = `/c/${tenant.slug}`

  const upcoming = data.matches
    .filter((m) => daysFromToday(m.fecha) >= 0)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))
  const next = upcoming[0]
  const played = data.matches
    .filter((m) => m.resultado)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
  const last = played[0]

  const metrics: Record<ModuleId, { value: string; label: string; attention?: boolean }> = {
    partidos: { value: String(upcoming.length), label: 'próximos' },
    jugadores: { value: String(data.players.length), label: 'fichas activas' },
    analisis: {
      value: `${Math.round(data.players.reduce((s, p) => s + p.eficacia, 0) / data.players.length)}%`,
      label: 'eficacia media',
    },
    competencia: (() => {
      const s = data.standings[0]
      const sorted = [...s.rows].sort((a, b) => points(b) - points(a))
      const pos = sorted.findIndex((r) => r.propio) + 1
      return { value: `${pos}°`, label: s.torneo }
    })(),
    profes: {
      value: `${Math.round((data.coaches.reduce((s, c) => s + c.dictadas / c.planificadas, 0) / data.coaches.length) * 100)}%`,
      label: 'asistencia de profes',
    },
    indumentaria: {
      value: String(data.orders.filter((o) => o.estado !== 'Entregado').length),
      label: 'pedidos abiertos',
    },
    materiales: (() => {
      const low = data.materials.filter((m) => m.stock < m.minimo).length
      return { value: String(low), label: 'ítems bajo mínimo', attention: low > 0 }
    })(),
    canchas: (() => {
      const out = data.courts.flatMap((c) => c.elementos).filter((e) => e.estado === 'fuera').length
      return { value: String(out), label: 'elementos fuera de servicio', attention: out > 0 }
    })(),
  }

  const weekday = TODAY.getDay() - 1
  const coachesToday = data.coaches.map((c) => ({ ...c, presente: c.semana[weekday] }))

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="court-lines absolute inset-0 text-ink-foreground" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:py-10">
          <div className="flex flex-col justify-between gap-6 animate-rise">
            <div className="flex flex-col gap-2">
              <p className="text-sm text-ink-foreground/60 first-letter:uppercase">
                {TODAY.toLocaleDateString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'America/Argentina/Buenos_Aires',
                })}
              </p>
              <h1 className="font-display text-5xl font-bold uppercase leading-[0.92] text-balance sm:text-6xl">
                Hoy en {tenant.short}
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-ink-foreground/70">
                {alerts.length > 0
                  ? `Hay ${alerts.length} temas que requieren atención${seesMatches ? ` y ${upcoming.filter((m) => daysFromToday(m.fecha) <= 7).length} partidos esta semana` : ''}.`
                  : 'Todo en orden. Sin alertas operativas pendientes.'}
              </p>
            </div>
            {seesMatches && last?.resultado && (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-ink-foreground/60">Último resultado</span>
                <span className="rounded-md bg-ink-foreground/10 px-2 py-1 font-display text-lg font-semibold tabular-nums">
                  {tenant.short} {last.resultado.pf} – {last.resultado.pc} {last.rival}
                </span>
                <Pill
                  tone={last.resultado.pf > last.resultado.pc ? 'ok' : last.resultado.pf === last.resultado.pc ? 'neutral' : 'bad'}
                  className="bg-ink-foreground/10 text-ink-foreground"
                >
                  {last.resultado.pf > last.resultado.pc ? 'Victoria' : last.resultado.pf === last.resultado.pc ? 'Empate' : 'Derrota'}
                </Pill>
              </div>
            )}
          </div>

          {seesMatches && next && (
            <Link
              href={`${base}/partidos`}
              className="group flex flex-col gap-5 rounded-2xl border border-ink-foreground/10 bg-ink-foreground/5 p-5 transition hover:bg-ink-foreground/10 animate-rise [animation-delay:80ms]"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-ink-foreground/60">
                <span>
                  Próximo partido · {next.deporte} {next.categoria}
                </span>
                <span className="rounded-full bg-warning px-2 py-0.5 font-semibold text-warning-foreground">
                  {relative(daysFromToday(next.fecha))}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-display text-4xl font-bold uppercase leading-none sm:text-5xl">{tenant.short}</span>
                  <span className="text-xs text-ink-foreground/60">{next.condicion === 'Local' ? 'Local' : 'Visitante'}</span>
                </div>
                <span className="font-display text-3xl font-bold text-ink-foreground/40 tabular-nums">{next.hora}</span>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className="font-display text-2xl font-bold uppercase leading-none text-balance sm:text-3xl">
                    {next.rival}
                  </span>
                  <span className="text-xs text-ink-foreground/60">{next.torneo}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-foreground/10 pt-4 text-sm">
                <span className="flex items-center gap-2 text-ink-foreground/80">
                  <CalendarClock className="size-4" aria-hidden="true" />
                  <span className="inline-block first-letter:uppercase">{formatDay(next.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </span>
                <span className="flex items-center gap-2 text-ink-foreground/80">
                  <MapPin className="size-4" aria-hidden="true" />
                  {next.lugar}
                </span>
                <span className="flex items-center gap-2 text-ink-foreground/80">
                  <KitSwatch camiseta={next.camiseta} short={next.short} />
                  Ropa de juego
                </span>
              </div>
            </Link>
          )}
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="modulos" className="flex min-w-0 flex-col gap-3">
          <h2 id="modulos" className="text-sm font-medium text-muted-foreground">
            Módulos del club
          </h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {modules.length === 0 && (
              <li className="col-span-full rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground">
                Tu rol todavía no tiene módulos habilitados. Pedile a un administrador del club que te asigne un rol.
              </li>
            )}
            {modules.map((m, i) => {
              const metric = metrics[m.id]
              return (
                <li key={m.id} className="min-w-0 animate-rise" style={{ animationDelay: `${120 + i * 40}ms` }}>
                  <Link
                    href={`${base}/${m.id}`}
                    className="group flex h-full flex-col gap-4 rounded-xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <m.icon className="size-5" aria-hidden="true" />
                      </span>
                      <ArrowRight
                        className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold">{m.name}</span>
                      <span className="text-xs leading-snug text-muted-foreground text-pretty">{m.description}</span>
                    </div>
                    <div className="mt-auto flex items-baseline gap-1.5 border-t pt-3">
                      <span
                        className={cn(
                          'font-display text-2xl font-bold leading-none tabular-nums',
                          metric.attention && 'text-destructive',
                        )}
                      >
                        {metric.value}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">{metric.label}</span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>

          {seesMatches && (
            <>
              <h2 className="mt-4 text-sm font-medium text-muted-foreground">Agenda de la semana</h2>
              <ul className="flex flex-col divide-y rounded-xl border bg-card">
                {upcoming.slice(0, 5).map((m) => (
                  <li key={m.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex w-12 flex-col items-center">
                      <span className="text-[10px] font-medium uppercase text-muted-foreground">
                        {formatDay(m.fecha, { weekday: 'short' })}
                      </span>
                      <span className="font-display text-2xl font-bold leading-none tabular-nums">
                        {formatDay(m.fecha, { day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">
                        {m.condicion === 'Local' ? `${tenant.short} vs ${m.rival}` : `${m.rival} vs ${tenant.short}`}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {m.deporte} {m.categoria} · {m.hora} · {m.lugar}
                      </span>
                    </div>
                    <KitSwatch camiseta={m.camiseta} short={m.short} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="atencion" className="flex flex-col gap-3">
            <h2 id="atencion" className="text-sm font-medium text-muted-foreground">
              Requiere atención
            </h2>
            <ul className="flex flex-col gap-2">
              {alerts.slice(0, 6).map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    className="flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5 text-sm transition hover:border-primary/40"
                  >
                    <span
                      className={cn('mt-1.5 size-2 shrink-0 rounded-full', a.tone === 'bad' ? 'bg-destructive' : 'bg-warning')}
                      aria-hidden="true"
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium leading-snug">{a.title}</span>
                      <span className="truncate text-xs text-muted-foreground">{a.detail}</span>
                    </span>
                  </Link>
                </li>
              ))}
              {alerts.length === 0 && <li className="text-sm text-muted-foreground">Sin alertas.</li>}
            </ul>
          </section>

          {seesCoaches && (
            <section aria-labelledby="profes-hoy" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 id="profes-hoy" className="text-sm font-medium text-muted-foreground">
                  Profes hoy
                </h2>
                <Link href={`${base}/profes`} className="text-xs font-medium text-primary hover:underline">
                  Ver control
                </Link>
              </div>
              <ul className="flex flex-col divide-y rounded-xl border bg-card">
                {coachesToday.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                    <Initials name={c.nombre} className="size-8 text-xs" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{c.nombre}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {c.deporte} · {c.categorias.join(', ')}
                      </span>
                    </span>
                    <Pill tone={c.presente ? 'ok' : c.presente === false ? 'bad' : 'neutral'}>
                      {c.presente ? 'Presente' : c.presente === false ? 'Ausente' : 'Sin carga'}
                    </Pill>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
