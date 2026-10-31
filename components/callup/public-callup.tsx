import { AlertTriangle, Backpack, CalendarPlus, Clock, ExternalLink, MapPin, Shirt, Users } from 'lucide-react'
import { ClubCrest } from '@/components/brand/logo'
import type { PublicCallupPage } from '@/lib/api/public-callups'
import { formatLongDay, formatTime } from '@/lib/club-time'
import { cn } from '@/lib/utils'

/** Color del club si es un hex válido; si no, el de la marca. */
export function clubColor(color: string | null): string {
  return color && /^#[0-9a-f]{3,8}$/i.test(color) ? color : '#ad4c2b'
}

export function matchTitle(match: PublicCallupPage['match']): string {
  return `${match.is_home ? 'vs' : 'en cancha de'} ${match.opponent}`
}

/** Encabezado con el club y el partido: lo primero que se ve al abrir el link. */
export function CallupHeader({ page }: { page: PublicCallupPage }) {
  const { club, match } = page
  const short = club.short_name || club.name
  return (
    <header className="flex flex-col gap-5 rounded-b-3xl px-5 pb-7 pt-6 text-white" style={{ backgroundColor: clubColor(club.primary_color) }}>
      <div className="flex items-center gap-3">
        <ClubCrest short={short} color="rgba(0,0,0,.25)" logoUrl={club.logo_url} className="size-12 rounded-xl bg-white/90 text-base" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">{club.name}</span>
          <span className="text-xs uppercase tracking-widest text-white/80">Convocatoria</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-white/85">
          {match.category}
          {match.competition && ` · ${match.competition}`}
        </span>
        <h1 className="font-display text-4xl font-bold uppercase leading-none">{matchTitle(match)}</h1>
        <p className="mt-1 text-base font-medium first-letter:uppercase">
          {formatLongDay(match.match_date)} · {formatTime(match.match_date)} h
        </p>
      </div>
    </header>
  )
}

/** Avisos de estado: suspendido, postergado o actualizado después de publicar. */
export function CallupNotice({ match }: { match: PublicCallupPage['match'] }) {
  const notice =
    match.status === 'cancelled'
      ? { title: 'Partido suspendido', text: 'El club suspendió este partido.', tone: 'bad' }
      : match.status === 'postponed'
        ? { title: 'Partido postergado', text: 'El club va a avisar la nueva fecha.', tone: 'warn' }
        : match.updated
          ? { title: 'Actualizado', text: 'Cambiaron datos del partido después de publicarse: revisá día, hora y lugar.', tone: 'warn' }
          : null
  if (!notice) return null
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-2xl border p-4 text-sm',
        notice.tone === 'bad' ? 'border-destructive/30 bg-destructive/10' : 'border-warning/40 bg-warning/15',
      )}
    >
      <AlertTriangle className={cn('mt-0.5 size-5 shrink-0', notice.tone === 'bad' ? 'text-destructive' : 'text-warning')} aria-hidden="true" />
      <p>
        <strong className="font-semibold">{notice.title}.</strong> {notice.text}
      </p>
    </div>
  )
}

/** Los datos para ir al partido y la lista de convocados. */
export function CallupDetails({ page, calendarHref }: { page: PublicCallupPage; calendarHref: string }) {
  const { match, players } = page
  return (
    <>
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5" aria-label="Datos del partido">
        <Row icon={Clock} label="Presentación">
          {match.meet_at ? (
            <span className="text-lg font-semibold">{formatTime(match.meet_at)} h</span>
          ) : (
            <span>Sin horario de presentación</span>
          )}
          <span className="text-sm text-muted-foreground">Partido {formatTime(match.match_date)} h</span>
        </Row>
        {match.venue && (
          <Row icon={MapPin} label="Lugar">
            <span>{match.venue}</span>
            {match.maps_url && (
              <a
                href={match.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium text-primary hover:bg-muted"
              >
                Cómo llegar
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            )}
          </Row>
        )}
        {match.uniform && (
          <Row icon={Shirt} label="Camiseta">
            <span>
              {match.uniform === 'home' ? 'Titular' : 'Alternativa'}
              {match.uniform_color && ` · ${match.uniform_color}`}
            </span>
          </Row>
        )}
        {match.what_to_bring && (
          <Row icon={Backpack} label="Qué llevar">
            <span className="whitespace-pre-line">{match.what_to_bring}</span>
          </Row>
        )}
        <a
          href={calendarHref}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium hover:bg-muted"
        >
          <CalendarPlus className="size-4" aria-hidden="true" />
          Agregar al calendario
        </a>
      </section>

      {players.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5" aria-labelledby="callup-players">
          <h2 id="callup-players" className="flex items-center gap-2 text-sm font-semibold">
            <Users className="size-4 text-muted-foreground" aria-hidden="true" />
            Convocados ({players.length})
          </h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {players.map((p, i) => (
              <li key={`${p.name}-${i}`} className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-display text-xs font-bold tabular-nums">
                  {p.shirt_number ?? '·'}
                </span>
                <span className="truncate">{p.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto flex max-w-md flex-col gap-4 pb-10">{children}</main>
      <footer className="mx-auto flex max-w-md items-center justify-center gap-1 px-5 pb-8 text-xs text-muted-foreground">
        Convocatoria enviada con <span className="font-semibold text-foreground/80">Sportiva</span>
      </footer>
    </div>
  )
}

function Row({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        {children}
      </div>
    </div>
  )
}
