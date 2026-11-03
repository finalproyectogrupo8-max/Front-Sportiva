import { AlertTriangle, Backpack, CalendarPlus, Clock, Download, ExternalLink, MapPin, Shirt } from 'lucide-react'
import { MapPreview } from '@/components/club/address-picker'
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

/** Marco de las páginas públicas: mismo papel, letras y tarjetas que el sistema. */
export function PublicShell({ club, children }: { club?: PublicCallupPage['club']; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-5 sm:py-10">
        {club && (
          <div className="flex items-center gap-3">
            <ClubCrest short={club.short_name || club.name} color={clubColor(club.primary_color)} logoUrl={club.logo_url} className="size-10" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{club.name}</span>
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Convocatoria</span>
            </div>
          </div>
        )}
        <main className="flex flex-col gap-4">{children}</main>
        <footer className="pt-4 text-center text-xs text-muted-foreground">
          Enviado con <span className="font-semibold text-foreground/80">Sportiva</span>
        </footer>
      </div>
    </div>
  )
}

/** El partido, como el encabezado de la página del partido en el sistema. */
export function CallupHeader({ page }: { page: PublicCallupPage }) {
  const { club, match } = page
  return (
    <header className="relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-ink p-6 text-ink-foreground">
      <span className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: clubColor(club.primary_color) }} aria-hidden="true" />
      <div className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-widest text-ink-foreground/70">
          {match.category}
          {match.competition && ` · ${match.competition}`}
        </span>
        <span className="text-sm text-ink-foreground/70">{match.is_home ? 'Local vs' : 'Visitante en cancha de'}</span>
        <h1 className="font-display text-4xl font-bold uppercase leading-none sm:text-5xl">{match.opponent}</h1>
        <p className="mt-1 text-sm text-ink-foreground/85 first-letter:uppercase">{formatLongDay(match.match_date)}</p>
      </div>
      <dl className="grid grid-cols-3 gap-2 border-t border-ink-foreground/15 pt-4">
        <Fact label="Presentación" value={match.meet_at ? `${formatTime(match.meet_at)} h` : '—'} strong />
        <Fact label="Partido" value={`${formatTime(match.match_date)} h`} />
        <Fact label="Camiseta" value={match.uniform ? (match.uniform === 'home' ? 'Titular' : 'Alternativa') : '—'} />
      </dl>
    </header>
  )
}

function Fact({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] uppercase tracking-wide text-ink-foreground/60">{label}</dt>
      <dd className={cn('font-display text-xl font-bold leading-tight', strong && 'text-[#f0a37f]')}>{value}</dd>
    </div>
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
        'flex items-start gap-3 rounded-xl border p-4 text-sm',
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

/** Lugar con mapa, qué llevar y agregar al calendario. */
export function CallupDetails({ page, token }: { page: PublicCallupPage; token: string }) {
  const { match } = page
  return (
    <>
      {match.venue && (
        <section className="flex flex-col gap-3 rounded-xl border bg-card p-5" aria-labelledby="callup-place">
          <h2 id="callup-place" className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
            Dónde
          </h2>
          <p className="text-sm">{match.venue}</p>
          <MapPreview place={{ address: mapsQuery(match.maps_url) || match.venue, latitude: null, longitude: null }} className="h-44" />
          {match.maps_url && (
            <a
              href={match.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Cómo llegar
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          )}
        </section>
      )}

      {(match.what_to_bring || match.uniform_color) && (
        <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 text-sm" aria-label="Qué llevar">
          {match.uniform && (
            <p className="flex items-start gap-3">
              <Shirt className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span>
                Camiseta {match.uniform === 'home' ? 'titular' : 'alternativa'}
                {match.uniform_color && ` · ${match.uniform_color}`}
              </span>
            </p>
          )}
          {match.what_to_bring && (
            <p className="flex items-start gap-3">
              <Backpack className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="whitespace-pre-line">{match.what_to_bring}</span>
            </p>
          )}
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5" aria-labelledby="callup-calendar">
        <h2 id="callup-calendar" className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
          Agendalo
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href={googleCalendarUrl(page)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium hover:bg-muted"
          >
            <CalendarPlus className="size-4" aria-hidden="true" />
            Google Calendar
          </a>
          <a
            href={`/convocatoria/${encodeURIComponent(token)}/calendario`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-medium hover:bg-muted"
          >
            <Download className="size-4" aria-hidden="true" />
            iPhone u Outlook
          </a>
        </div>
        <p className="text-xs text-muted-foreground">En iPhone u Outlook se descarga un archivo de calendario: abrilo y tocá “Agregar”.</p>
      </section>
    </>
  )
}

/** Link de Google Calendar con el evento armado (desde la presentación hasta 2 h después del partido). */
function googleCalendarUrl({ club, match }: PublicCallupPage): string {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const start = match.meet_at ?? match.match_date
  const end = new Date(new Date(match.match_date).getTime() + 2 * 3600_000).toISOString()
  const details = [
    match.meet_at && `Presentación ${formatTime(match.meet_at)} h · Partido ${formatTime(match.match_date)} h`,
    match.uniform && `Camiseta ${match.uniform === 'home' ? 'titular' : 'alternativa'}${match.uniform_color ? ` (${match.uniform_color})` : ''}`,
    match.what_to_bring && `Llevar: ${match.what_to_bring}`,
  ]
    .filter(Boolean)
    .join('\n')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${club.short_name || club.name} · ${match.category} ${matchTitle(match)}`,
    dates: `${stamp(start)}/${stamp(end)}`,
    details,
    location: match.venue ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

/** Lo que busca el link de Google Maps que arma la API (`?query=`). */
function mapsQuery(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).searchParams.get('query')
  } catch {
    return null
  }
}
