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
import { clubEligibility, type CategoryEligibility } from '@/lib/api/eligibility'
import { listNotifications, listOrders, lowStock, type InventoryBalance, type Notification, type Order } from '@/lib/api/home'
import { calendar, getCallup, type CalendarEvent, type CallupSheet } from '@/lib/api/matches'
import { addDays, dayKey, formatTime, today } from '@/lib/club-time'
import { visibleModules } from '@/lib/modules'
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
  // La API filtra por día UTC: se pide de más y se recorta por día de Argentina.
  const [events, eligibility, notifications, orders, stock] = await Promise.all([
    safe(seesCalendar, () => calendar({ from: addDays(day, -1), to: addDays(day, 8) })),
    safe(can('player_requirements.view'), () => clubEligibility()),
    safe(true, () => listNotifications({ unread: true, per_page: 20 })),
    safe(seesOrders, () => listOrders({ per_page: 50 })),
    safe(can('inventory.view'), () => lowStock()),
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
  const lowItems = stock?.data ?? []
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
        <div className="relative mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:px-10 lg:py-9">
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

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-10">
        <div className="flex min-w-0 flex-col gap-6">
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

          {seesOrders && (
            <Card title="Pedidos" icon={Shirt} action={can('apparel_orders.view') ? { href: `${base}/indumentaria`, label: 'Ver pedidos' } : undefined}>
              {openOrders.length === 0 ? (
                <Empty>No hay pedidos para aprobar ni para entregar.</Empty>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 px-4 pt-4">
                    <Counter value={openOrders.filter((o) => TO_APPROVE.has(o.status)).length} label="para aprobar" attention />
                    <Counter value={openOrders.filter((o) => TO_DELIVER.has(o.status)).length} label="para entregar" />
                  </div>
                  <ul className="flex flex-col divide-y">
                    {openOrders.slice(0, 5).map((o) => (
                      <OrderRow key={o.id} order={o} />
                    ))}
                  </ul>
                </>
              )}
            </Card>
          )}

          {can('inventory.view') && (
            <Card title="Stock bajo" icon={Package} action={{ href: `${base}/materiales`, label: 'Materiales' }}>
              {lowItems.length === 0 ? (
                <Empty>Todo el stock está por encima del mínimo.</Empty>
              ) : (
                <ul className="flex flex-col divide-y">
                  {lowItems.slice(0, 6).map((b) => (
                    <StockRow key={b.id} balance={b} />
                  ))}
                </ul>
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

        <aside className="flex min-w-0 flex-col gap-6">
          {atRisk.length > 0 && (
            <Card title="En riesgo de abandono" icon={UserX}>
              <ul className="flex flex-col divide-y">
                {atRisk.slice(0, 6).map((n) => (
                  <AlertRow key={n.id} alert={n} href={alertHref(base, n)} />
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
                  <AlertRow key={n.id} alert={n} href={alertHref(base, n)} />
                ))}
              </ul>
            )}
          </Card>

          {modules.length > 0 && (
            <nav aria-labelledby="accesos" className="flex flex-col gap-2">
              <h2 id="accesos" className="px-1 text-sm font-medium text-muted-foreground">
                Módulos
              </h2>
              <ul className="grid grid-cols-2 gap-2">
                {modules.map((m) => (
                  <li key={m.id}>
                    <Link href={`${base}/${m.id}`} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm font-medium transition hover:border-primary/40">
                      <m.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="truncate">{m.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {modules.length === 0 && (
            <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
              Tu rol todavía no tiene módulos habilitados. Pedile a un administrador del club que te asigne un rol.
            </p>
          )}
        </aside>
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

function OrderRow({ order }: { order: Order }) {
  const status = ORDER_STATUS[order.status] ?? { label: order.status, tone: 'neutral' as Tone }
  const items = (order.apparel_order_items?.length ?? 0) + (order.material_order_items?.length ?? 0)
  return (
    <li className="flex items-center gap-3 px-4 py-3">
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
    </li>
  )
}

function StockRow({ balance }: { balance: InventoryBalance }) {
  const min = balance.material?.minimum_stock ?? 0
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden="true" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{balance.material?.name ?? `Material ${balance.material_id}`}</span>
        <span className="truncate text-xs text-muted-foreground">{balance.location?.name ?? 'Depósito'}</span>
      </span>
      <span className="shrink-0 text-right text-sm">
        <span className="font-display text-lg font-bold tabular-nums text-destructive">{balance.quantity}</span>
        <span className="text-xs text-muted-foreground"> / mín. {min}</span>
      </span>
    </li>
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
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  action?: { href: string; label: string }
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="flex-1 text-sm font-semibold">{title}</h2>
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

/** A dónde lleva cada alerta automática de la API. */
function alertHref(base: string, alert: Notification): string | null {
  const data = (alert.data ?? {}) as Record<string, unknown>
  const id = (key: string) => (typeof data[key] === 'number' ? (data[key] as number) : null)
  switch (alert.type) {
    case 'callup_pending':
      return id('match_id') ? `${base}/partidos/${id('match_id')}` : null
    case 'attendance_drop':
    case 'requirement_expiring':
      return id('player_id') ? `${base}/jugadores?id=${id('player_id')}` : null
    case 'registration_closing':
      return id('category_id') ? `${base}/habilitacion?categoria=${id('category_id')}` : `${base}/habilitacion`
    default:
      return null
  }
}

function joinList(items: string[]): string {
  return items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`
}
