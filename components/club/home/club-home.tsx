import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  ClipboardCheck,
  Dumbbell,
  FileWarning,
  MapPin,
  Megaphone,
  Package,
  ShieldCheck,
  Shirt,
  Swords,
  UserX,
} from 'lucide-react'
import { Pill, type Tone } from '@/components/club/shared'
import { categoryStats, type CategoryStats } from '@/lib/api/analytics'
import { listBalances } from '@/lib/api/inventory'
import { AttendanceByCategory, CampaignByCategory, type CategoryRow } from './home-charts'
import { clubEligibility, type CategoryEligibility } from '@/lib/api/eligibility'
import { listNotifications, listOrders, type InventoryBalance, type Notification, type Order } from '@/lib/api/home'
import { calendar, getCallup, type CalendarEvent, type CallupSheet } from '@/lib/api/matches'
import { addDays, dayKey, formatTime, today } from '@/lib/club-time'
import { visibleModules } from '@/lib/modules'
import { notificationHref } from '@/lib/notification-links'
import { cn } from '@/lib/utils'

const LONG_DAY = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' })
const SHORT_DAY = new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: 'America/Argentina/Buenos_Aires' })
const DAY_NUM = new Intl.DateTimeFormat('es-AR', { day: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' })

const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
  submitted: { label: 'Para aprobar', tone: 'warn' },
  pending: { label: 'Para aprobar', tone: 'warn' },
  approved: { label: 'Para preparar', tone: 'info' },
  preparing: { label: 'Preparando', tone: 'info' },
  partially_delivered: { label: 'Entrega parcial', tone: 'info' },
}
const TO_APPROVE = new Set(['submitted', 'pending'])
const TO_DELIVER = new Set(['approved', 'preparing', 'partially_delivered'])

/** Pide algo a la API sin romper el inicio: si falla, esa tarjeta no se muestra. */
async function safe<T>(enabled: boolean, load: () => Promise<{ ok: true; data: T } | { ok: false }>): Promise<T | null> {
  if (!enabled) return null
  try {
    const result = await load()
    return result.ok ? result.data : null
  } catch {
    return null
  }
}

/**
 * Inicio del club según lo que puede hacer cada uno (FRO-38). Las tarjetas se eligen por permisos,
 * no por nombre de rol, así un rol a medida también ve lo suyo:
 * - quien toma asistencia ve "Hoy" con la asistencia a un toque;
 * - quien ve partidos y convocatorias, la semana con el estado de cada convocatoria;
 * - quien ve la habilitación, el tablero por categoría;
 * - quien maneja pedidos o stock, lo que hay para aprobar, entregar o reponer.
 */
export async function ClubHome({ club, userName, permissions }: { club: string; userName: string; permissions: string[] }) {
  const granted = new Set(permissions)
  const can = (p: string) => granted.has(p)
  const seesCalendar = can('matches.view') || can('trainings.view')
  const seesOrders = can('apparel_orders.view') || can('material_orders.view')
  const base = `/c/${club}`

  const day = today()
  const seesStats = can('physical_evaluations.view')
  // Indicadores de los últimos 90 días, como el período por defecto de Análisis.
  const statsRange = { from: addDays(day, -90), to: day }
  // La API filtra por día UTC: se pide de más y se recorta por día de Argentina.
  const [events, eligibility, notifications, orders, stock, stats] = await Promise.all([
    safe(seesCalendar, () => calendar({ from: addDays(day, -1), to: addDays(day, 8) })),
    safe(can('player_requirements.view'), () => clubEligibility()),
    safe(true, () => listNotifications({ unread: true, per_page: 20 })),
    safe(seesOrders, () => listOrders({ per_page: 50 })),
    safe(can('inventory.view'), () => listBalances()),
    safe(seesStats, () => categoryStats(statsRange)),
  ])

  const upcoming = (events?.data ?? []).filter((e) => dayKey(e.starts_at) >= day && dayKey(e.starts_at) <= addDays(day, 7) && e.status !== 'cancelled')
  const todays = upcoming.filter((e) => dayKey(e.starts_at) === day)
  const weekMatches = upcoming.filter((e) => e.type === 'match')
  const nextEvent = upcoming.find((e) => dayKey(e.starts_at) > day)

  // Estado de la convocatoria de los partidos de la semana (pocos: una llamada por partido).
  const callups = new Map<number, CallupSheet>()
  if (can('callups.view')) {
    const sheets = await Promise.all(weekMatches.slice(0, 8).map((m) => safe(true, () => getCallup(m.id))))
    sheets.forEach((s, i) => s && callups.set(weekMatches[i].id, s.data))
  }

  const alerts = notifications?.data ?? []
  const atRisk = alerts.filter((n) => n.type === 'attendance_drop')
  const otherAlerts = alerts.filter((n) => n.type !== 'attendance_drop')
  const openOrders = (orders?.data ?? []).filter((o) => TO_APPROVE.has(o.status) || TO_DELIVER.has(o.status))
  const materials = stockByMaterial(stock?.data ?? [])
  const lowCount = materials.filter((m) => m.low).length
  const categories = stats?.data ?? []
  const rows = categories.map(toRow)
  const totals = clubTotals(categories)
  const eligible = (eligibility?.data ?? []).reduce((acc, c) => ({ eligible: acc.eligible + c.eligible, players: acc.players + c.players }), { eligible: 0, players: 0 })
  const toApprove = openOrders.filter((o) => TO_APPROVE.has(o.status)).length
  const chartCount = (seesStats ? 2 : 0) + (can('inventory.view') ? 1 : 0)
  const chartLayout = chartCount === 3 ? 'lg:grid-cols-2 xl:grid-cols-3 lg:max-xl:[&>*:last-child]:col-span-2' : chartCount === 2 ? 'lg:grid-cols-2' : ''
  // Hasta 3 listas van lado a lado; con más, en mosaico de columnas para que no queden huecos.
  const listCount = [can('matches.view'), atRisk.length > 0, true, seesOrders, can('player_requirements.view') && !!eligibility].filter(Boolean).length
  const listLayout = listCount > 3 ? 'gap-6 lg:columns-2 2xl:columns-3 [&>*]:mb-6 [&>*]:break-inside-avoid' : 'grid items-start gap-6 lg:grid-cols-[repeat(auto-fit,minmax(24rem,1fr))]'

  const kpis: { label: string; value: React.ReactNode; hint: string; href?: string; tone?: 'warn' | 'bad' }[] = []
  if (seesStats && categories.length > 0) {
    kpis.push({ label: 'Jugadores', value: totals.players, hint: `en ${categories.length} ${categories.length === 1 ? 'categoría' : 'categorías'}`, href: `${base}/jugadores` })
    kpis.push({
      label: 'Asistencia',
      value: totals.rate === null ? '—' : `${totals.rate}%`,
      hint: totals.rate === null ? 'sin registros en 90 días' : `${totals.present} de ${totals.recorded} registros, 90 días`,
      href: `${base}/analisis`,
      tone: totals.rate !== null && totals.rate < 60 ? 'bad' : undefined,
    })
    kpis.push({ label: 'Partidos jugados', value: totals.played, hint: totals.played ? `${totals.won} G · ${totals.drawn} E · ${totals.lost} P en 90 días` : 'ninguno en 90 días', href: `${base}/partidos` })
  }
  if (can('player_requirements.view') && eligible.players > 0) {
    const pct = Math.round((eligible.eligible / eligible.players) * 100)
    kpis.push({ label: 'Habilitados', value: `${pct}%`, hint: `${eligible.eligible} de ${eligible.players} jugadores`, href: `${base}/habilitacion`, tone: pct < 60 ? 'bad' : pct < 90 ? 'warn' : undefined })
  }
  if (can('inventory.view') && materials.length > 0) {
    kpis.push({ label: 'Para reponer', value: lowCount, hint: lowCount ? `de ${materials.length} materiales, bajo el mínimo` : `los ${materials.length} materiales están bien`, href: `${base}/materiales`, tone: lowCount ? 'warn' : undefined })
  }
  if (seesOrders && kpis.length < 5) {
    const approves = can('apparel_orders.approve') || can('material_orders.approve')
    kpis.push(
      approves
        ? { label: 'Pedidos para aprobar', value: toApprove, hint: `${openOrders.length - toApprove} para entregar`, tone: toApprove ? 'warn' : undefined }
        : { label: 'Pedidos en curso', value: openOrders.length, hint: `${toApprove} esperando aprobación · ${openOrders.length - toApprove} para entregar` },
    )
  }
  const modules = visibleModules(permissions)
  const firstName = userName.split(' ')[0]

  const summary = [
    todays.length > 0 && `${todays.length === 1 ? 'una actividad' : `${todays.length} actividades`} hoy`,
    weekMatches.length > 0 && `${weekMatches.length === 1 ? 'un partido' : `${weekMatches.length} partidos`} esta semana`,
    alerts.length > 0 && `${alerts.length === 1 ? 'una alerta' : `${alerts.length} alertas`}`,
  ].filter(Boolean)

  return (
    <div className="flex flex-col">
      {/* Hoy */}
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <div className="court-lines absolute inset-0 text-ink-foreground" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[120rem] gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:px-10 lg:py-9">
          <div className="flex flex-col justify-center gap-2">
            <p className="text-sm text-ink-foreground/60 first-letter:uppercase">{LONG_DAY.format(new Date())}</p>
            <h1 className="font-display text-5xl font-bold uppercase leading-[0.92] sm:text-6xl">Hola, {firstName}</h1>
            <p className="max-w-md text-sm leading-relaxed text-ink-foreground/70">
              {summary.length > 0 ? `Tenés ${joinList(summary as string[])}.` : 'Todo tranquilo: sin actividad hoy ni alertas pendientes.'}
            </p>
          </div>

          {seesCalendar && (
            <div className="flex flex-col gap-3 rounded-2xl border border-ink-foreground/10 bg-ink-foreground/5 p-4 sm:p-5">
              <h2 className="text-xs font-medium uppercase tracking-widest text-ink-foreground/60">Hoy</h2>
              {todays.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {todays.map((e) => (
                    <TodayItem key={`${e.type}-${e.id}`} event={e} base={base} canAttendance={can('attendance.record') || can('attendance.view')} recording={can('attendance.record')} />
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col gap-1 py-2">
                  <p className="font-display text-2xl font-bold uppercase">Hoy no hay actividad</p>
                  {nextEvent ? (
                    <Link href={eventHref(base, nextEvent)} className="text-sm text-ink-foreground/70 hover:text-ink-foreground">
                      Lo próximo: <span className="font-medium text-ink-foreground">{nextEvent.title}</span> · <span className="first-letter:uppercase">{LONG_DAY.format(new Date(nextEvent.starts_at))}</span>, {formatTime(nextEvent.starts_at)} h
                    </Link>
                  ) : (
                    <p className="text-sm text-ink-foreground/70">No hay nada cargado para los próximos 7 días.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[120rem] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
        {kpis.length > 0 && (
          <section aria-label="El club en números" className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] max-md:[&>*:last-child:nth-child(odd)]:col-span-2">
            {kpis.map((k) => (
              <Kpi key={k.label} {...k} />
            ))}
          </section>
        )}

        {chartCount > 0 && (
          <div className={cn('grid gap-6', chartLayout)}>
            {seesStats && (
              <Card title="Asistencia por categoría" icon={ClipboardCheck} action={{ href: `${base}/analisis`, label: 'Análisis' }} subtitle="Últimos 90 días">
                <div className="px-4 py-4">
                  <AttendanceByCategory rows={rows} />
                </div>
              </Card>
            )}
            {seesStats && (
              <Card title="Campaña por categoría" icon={Swords} action={{ href: `${base}/analisis`, label: 'Análisis' }} subtitle="Últimos 90 días">
                <div className="px-4 py-4">
                  <CampaignByCategory rows={rows} />
                </div>
              </Card>
            )}
            {can('inventory.view') && (
              <Card title="Stock de materiales" icon={Package} action={{ href: `${base}/materiales`, label: 'Materiales' }} subtitle="Todos los depósitos">
                {materials.length === 0 ? <Empty>Todavía no hay materiales cargados.</Empty> : <StockLevels materials={materials.slice(0, 8)} />}
              </Card>
            )}
          </div>
        )}

        <div className={listLayout}>
          {can('matches.view') && (
            <Card title="Partidos de la semana" icon={CalendarDays} action={{ href: `${base}/partidos`, label: 'Calendario' }}>
              {weekMatches.length === 0 ? (
                <Empty>No hay partidos en los próximos 7 días.{can('matches.create') && ' Cargalos desde el calendario.'}</Empty>
              ) : (
                <ul className="flex flex-col divide-y">
                  {weekMatches.map((m) => (
                    <WeekMatch key={m.id} match={m} base={base} sheet={callups.get(m.id)} showCallup={can('callups.view')} />
                  ))}
                </ul>
              )}
            </Card>
          )}

          {atRisk.length > 0 && (
            <Card title="En riesgo de abandono" icon={UserX}>
              <ul className="flex flex-col divide-y">
                {atRisk.slice(0, 6).map((n) => (
                  <AlertRow key={n.id} alert={n} href={notificationHref(club, n)} />
                ))}
              </ul>
            </Card>
          )}

          <Card title="Alertas" icon={Bell}>
            {otherAlerts.length === 0 ? (
              <Empty>Sin alertas pendientes.</Empty>
            ) : (
              <ul className="flex flex-col divide-y">
                {otherAlerts.slice(0, 6).map((n) => (
                  <AlertRow key={n.id} alert={n} href={notificationHref(club, n)} />
                ))}
              </ul>
            )}
          </Card>

          {seesOrders && (
            <Card title="Pedidos" icon={Shirt} action={{ href: `${base}/${can('apparel_orders.view') ? 'indumentaria' : 'materiales'}`, label: 'Ver pedidos' }}>
              {openOrders.length === 0 ? (
                <Empty>No hay pedidos para aprobar ni para entregar.</Empty>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 px-4 pt-4">
                    <Counter value={toApprove} label="para aprobar" attention />
                    <Counter value={openOrders.length - toApprove} label="para entregar" />
                  </div>
                  <ul className="flex flex-col divide-y">
                    {openOrders.slice(0, 5).map((o) => (
                      <OrderRow key={o.id} order={o} href={`${base}/${o.type === 'apparel' ? 'indumentaria' : 'materiales'}?pedido=${o.id}`} />
                    ))}
                  </ul>
                </>
              )}
            </Card>
          )}

          {can('player_requirements.view') && eligibility && (
            <Card title="Habilitación" icon={ShieldCheck} action={{ href: `${base}/habilitacion`, label: 'Tablero' }}>
              {eligibility.data.length === 0 ? (
                <Empty>Ninguna categoría juega competencias con requisitos todavía.</Empty>
              ) : (
                <ul className="flex flex-col divide-y">
                  {eligibility.data.map((c) => (
                    <EligibilityRow key={c.category_id} row={c} href={`${base}/habilitacion?categoria=${c.category_id}`} />
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>

        {modules.length > 0 ? (
          <nav aria-labelledby="accesos" className="flex flex-col gap-2">
            <h2 id="accesos" className="px-1 text-sm font-medium text-muted-foreground">
              Módulos
            </h2>
            <ul className="flex flex-wrap gap-2">
              {modules.map((m) => (
                <li key={m.id}>
                  <Link href={`${base}/${m.id}`} className="flex items-center gap-2 rounded-full border bg-card py-2 pl-3 pr-4 text-sm font-medium transition hover:border-primary/40 hover:bg-primary/5">
                    <m.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{m.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">Tu rol todavía no tiene módulos habilitados. Pedile a un administrador del club que te asigne un rol.</p>
        )}
      </div>
    </div>
  )
}

function TodayItem({ event, base, canAttendance, recording }: { event: CalendarEvent; base: string; canAttendance: boolean; recording: boolean }) {
  const isMatch = event.type === 'match'
  const Icon = isMatch ? Swords : Dumbbell
  const attendanceHref = isMatch ? `${base}/partidos/${event.id}/asistencia` : `${base}/partidos/entrenamientos/${event.id}/asistencia`
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-ink-foreground/10 p-3 sm:flex-row sm:items-center">
      <Link href={eventHref(base, event)} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-ink-foreground/10">
          <Icon className="size-4 text-[#f0a37f]" aria-hidden="true" />
          <span className="font-display text-xs font-bold tabular-nums">{formatTime(event.starts_at)}</span>
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{event.title}</span>
          <span className="flex items-center gap-1 truncate text-xs text-ink-foreground/70">
            {event.category_name}
            {event.location && (
              <>
                <MapPin className="ml-1 size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{event.location}</span>
              </>
            )}
          </span>
        </span>
      </Link>
      {canAttendance && (
        <Link
          href={attendanceHref}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          <ClipboardCheck className="size-4" aria-hidden="true" />
          {recording ? 'Tomar asistencia' : 'Ver asistencia'}
        </Link>
      )}
    </li>
  )
}

function WeekMatch({ match, base, sheet, showCallup }: { match: CalendarEvent; base: string; sheet?: CallupSheet; showCallup: boolean }) {
  const date = new Date(match.starts_at)
  const total = sheet ? sheet.going + sheet.not_going + sheet.pending : 0
  let state: { label: string; tone: Tone } | null = null
  if (showCallup && sheet) {
    if (!sheet.published_at) state = { label: 'Convocatoria sin publicar', tone: 'warn' }
    else if (sheet.updated_after_publish) state = { label: 'Hubo cambios: volvé a avisar', tone: 'bad' }
    else state = { label: `${sheet.going} de ${total} confirmaron`, tone: sheet.pending > 0 ? 'info' : 'ok' }
  }
  return (
    <li>
      <Link href={`${base}/partidos/${match.id}`} className="flex items-center gap-4 px-4 py-3 transition hover:bg-muted/50">
        <span className="flex w-10 shrink-0 flex-col items-center">
          <span className="text-[10px] font-medium uppercase text-muted-foreground">{SHORT_DAY.format(date)}</span>
          <span className="font-display text-2xl font-bold leading-none tabular-nums">{DAY_NUM.format(date)}</span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-medium">{match.title}</span>
          <span className="truncate text-xs text-muted-foreground">
            {match.category_name} · {formatTime(match.starts_at)} h{match.location ? ` · ${match.location}` : ''}
          </span>
        </span>
        {state && (
          <Pill tone={state.tone} className="hidden shrink-0 sm:inline-flex">
            {state.label}
          </Pill>
        )}
        <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
      {state && (
        <div className="-mt-1 px-4 pb-3 pl-[4.5rem] sm:hidden">
          <Pill tone={state.tone}>{state.label}</Pill>
        </div>
      )}
    </li>
  )
}

function OrderRow({ order, href }: { order: Order; href: string }) {
  const status = ORDER_STATUS[order.status] ?? { label: order.status, tone: 'neutral' as Tone }
  const items = (order.apparel_order_items?.length ?? 0) + (order.material_order_items?.length ?? 0)
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {order.type === 'apparel' ? <Shirt className="size-4" aria-hidden="true" /> : <Package className="size-4" aria-hidden="true" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">
          {order.type === 'apparel' ? 'Indumentaria' : 'Materiales'} · {order.order_number}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {order.category?.name ?? 'Sin categoría'}
          {items > 0 && ` · ${items} ${items === 1 ? 'ítem' : 'ítems'}`}
          {order.priority === 'urgent' || order.priority === 'high' ? ' · Prioridad alta' : ''}
        </span>
      </span>
      <Pill tone={status.tone}>{status.label}</Pill>
      </Link>
    </li>
  )
}

type MaterialStock = { id: number; name: string; unit: string; quantity: number; minimum: number; low: boolean }

/** Suma el stock de cada material en todos los depósitos. Los que están bajo el mínimo van primero. */
function stockByMaterial(balances: InventoryBalance[]): MaterialStock[] {
  const byId = new Map<number, MaterialStock>()
  for (const b of balances) {
    if (b.material && !b.material.is_active) continue
    const current = byId.get(b.material_id) ?? { id: b.material_id, name: b.material?.name ?? `Material ${b.material_id}`, unit: b.material?.unit ?? '', quantity: 0, minimum: Number(b.material?.minimum_stock ?? 0), low: false }
    current.quantity += Number(b.quantity)
    byId.set(b.material_id, current)
  }
  return [...byId.values()]
    .map((m) => ({ ...m, low: m.quantity < m.minimum }))
    .sort((a, b) => Number(b.low) - Number(a.low) || a.quantity / Math.max(a.minimum, 1) - b.quantity / Math.max(b.minimum, 1))
}

/** Barra de stock por material con una marca en el mínimo. Lo que falta se marca con ícono y texto, no solo color. */
function StockLevels({ materials }: { materials: MaterialStock[] }) {
  return (
    <ul className="flex flex-col gap-3 px-4 py-4">
      {materials.map((m) => {
        const scale = Math.max(m.minimum * 2, m.quantity, 1)
        return (
          <li key={m.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 font-medium">
                {m.low && <AlertTriangle className="size-3.5 shrink-0 text-warning" aria-hidden="true" />}
                <span className="truncate">{m.name}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                <span className={cn('font-semibold', m.low && 'text-destructive')}>{m.quantity}</span>
                <span className="text-xs text-muted-foreground"> / mín. {m.minimum} {m.unit}</span>
                {m.low && <span className="sr-only"> (bajo el mínimo)</span>}
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-muted" aria-hidden="true">
              <div className={cn('h-full rounded-full', m.low ? 'bg-destructive' : 'bg-primary')} style={{ width: `${(m.quantity / scale) * 100}%` }} />
              {m.minimum > 0 && <span className="absolute -top-1 h-4 w-0.5 rounded-full bg-foreground/60" style={{ left: `calc(${(m.minimum / scale) * 100}% - 1px)` }} title={`Mínimo: ${m.minimum}`} />}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function toRow(c: CategoryStats): CategoryRow {
  const r = c.results
  return {
    name: c.category_name,
    rate: c.attendance.rate,
    present: c.attendance.present,
    recorded: c.attendance.recorded,
    goalsFor: r.goals_for,
    goalsAgainst: r.goals_against,
    played: r.played,
    won: r.won,
    drawn: r.drawn,
    lost: r.lost,
  }
}

function clubTotals(categories: CategoryStats[]) {
  const t = categories.reduce(
    (acc, c) => ({
      players: acc.players + c.players,
      present: acc.present + c.attendance.present,
      recorded: acc.recorded + c.attendance.recorded,
      played: acc.played + c.results.played,
      won: acc.won + c.results.won,
      drawn: acc.drawn + c.results.drawn,
      lost: acc.lost + c.results.lost,
    }),
    { players: 0, present: 0, recorded: 0, played: 0, won: 0, drawn: 0, lost: 0 },
  )
  return { ...t, rate: t.recorded > 0 ? Math.round((t.present / t.recorded) * 100) : null }
}

function Kpi({ label, value, hint, href, tone }: { label: string; value: React.ReactNode; hint: string; href?: string; tone?: 'warn' | 'bad' }) {
  const body = (
    <>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn('font-display text-4xl font-bold leading-none tabular-nums', tone === 'warn' && 'text-warning', tone === 'bad' && 'text-destructive')}>{value}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </>
  )
  const className = 'flex flex-col gap-1.5 rounded-xl border bg-card p-4'
  return href ? (
    <Link href={href} className={cn(className, 'transition hover:border-primary/40')}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

function EligibilityRow({ row, href }: { row: CategoryEligibility; href: string }) {
  const pct = row.players > 0 ? Math.round((row.eligible / row.players) * 100) : 0
  return (
    <li>
      <Link href={href} className="flex flex-col gap-2 px-4 py-3 transition hover:bg-muted/50">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate font-medium">{row.category_name}</span>
          <span className="shrink-0 text-sm">
            <span className="font-display text-lg font-bold tabular-nums">{row.eligible}</span>
            <span className="text-muted-foreground"> de {row.players} habilitados</span>
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
          <div className={cn('h-full rounded-full', pct >= 90 ? 'bg-success' : pct >= 60 ? 'bg-warning' : 'bg-destructive')} style={{ width: `${pct}%` }} />
        </div>
        {(row.days_to_deadline != null || row.expiring_soon > 0) && (
          <span className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            {row.days_to_deadline != null && <span className={cn(row.days_to_deadline <= 7 && row.eligible < row.players && 'font-medium text-destructive')}>Cierra la inscripción en {row.days_to_deadline} {row.days_to_deadline === 1 ? 'día' : 'días'}</span>}
            {row.expiring_soon > 0 && <span>{row.expiring_soon} papeles vencen pronto</span>}
          </span>
        )}
      </Link>
    </li>
  )
}

const ALERT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  callup_pending: Megaphone,
  attendance_drop: UserX,
  requirement_expiring: FileWarning,
  registration_closing: ShieldCheck,
  order_approved: Shirt,
  order_rejected: Shirt,
  order_delivered: Package,
  order_partially_delivered: Package,
}

function AlertRow({ alert, href }: { alert: Notification; href: string | null }) {
  const Icon = ALERT_ICON[alert.type] ?? Bell
  const content = (
    <>
      <Icon className={cn('mt-0.5 size-4 shrink-0', alert.type === 'attendance_drop' || alert.type === 'registration_closing' ? 'text-destructive' : 'text-warning')} aria-hidden="true" />
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium leading-snug">{alert.title}</span>
        <span className="line-clamp-2 text-xs text-muted-foreground">{alert.body}</span>
      </span>
    </>
  )
  return (
    <li>
      {href ? (
        <Link href={href} className="flex items-start gap-3 px-4 py-3 transition hover:bg-muted/50">
          {content}
        </Link>
      ) : (
        <div className="flex items-start gap-3 px-4 py-3">{content}</div>
      )}
    </li>
  )
}

function Card({
  title,
  icon: Icon,
  action,
  subtitle,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  action?: { href: string; label: string }
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="flex flex-1 items-baseline gap-2 text-sm font-semibold">
          {title}
          {subtitle && <span className="text-xs font-normal text-muted-foreground">{subtitle}</span>}
        </h2>
        {action && (
          <Link href={action.href} className="text-xs font-medium text-primary hover:underline">
            {action.label}
          </Link>
        )}
      </header>
      {children}
    </section>
  )
}

function Counter({ value, label, attention }: { value: number; label: string; attention?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5 rounded-lg bg-muted/50 px-3 py-2">
      <span className={cn('font-display text-2xl font-bold tabular-nums leading-none', attention && value > 0 && 'text-warning')}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-5 text-sm text-muted-foreground">{children}</p>
}

function eventHref(base: string, event: CalendarEvent): string {
  return event.type === 'match' ? `${base}/partidos/${event.id}` : `${base}/partidos?entrenamiento=${event.id}`
}

function joinList(items: string[]): string {
  return items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`
}
