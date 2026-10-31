import { cn } from '@/lib/utils'

/** Isotipo de Sportiva: los dos trazos de la landing (naranja y arena). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('relative block h-[38px] w-[34px] shrink-0', className)}>
      <i className="absolute top-[6px] left-[2px] h-[11px] w-[31px] -rotate-[29deg] rounded-full bg-brand" />
      <i className="absolute bottom-[5px] left-[2px] h-[11px] w-[31px] -rotate-[29deg] rounded-full bg-[#dbc4aa]" />
    </span>
  )
}

/**
 * Logo completo, igual al de la landing: isotipo + "sportıva" con el punto de la i en naranja.
 * `light` lo pone en blanco para fondos oscuros.
 */
export function Logo({
  className,
  compact = false,
  light = false,
}: {
  className?: string
  compact?: boolean
  light?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 select-none', className)} aria-label="Sportiva">
      <LogoMark className="origin-left scale-[0.82]" />
      {!compact && (
        <span
          aria-hidden="true"
          className={cn(
            'text-[26px] leading-none font-extrabold tracking-[-0.055em]',
            light ? 'text-white' : 'text-foreground',
          )}
        >
          sport
          {/* "ı" sin punto: el punto lo pone el ::before en naranja, como en la landing. */}
          <span className="relative before:absolute before:top-[0.17em] before:left-1/2 before:size-[0.2em] before:-translate-x-1/2 before:rounded-full before:bg-brand">
            ı
          </span>
          va
        </span>
      )}
    </span>
  )
}

export function ClubCrest({
  short,
  color,
  logoUrl,
  className,
}: {
  short: string
  color: string
  /** Escudo subido por el club. Sin escudo se muestra la sigla sobre el color del club. */
  logoUrl?: string | null
  className?: string
}) {
  if (logoUrl) {
    return (
      // El escudo viene de la API (otro origen): next/image pediría configurar el dominio.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        aria-hidden="true"
        className={cn('inline-block size-9 shrink-0 rounded-lg bg-card object-contain', className)}
      />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold tracking-wider text-primary-foreground',
        className,
      )}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {short.slice(0, 4)}
    </span>
  )
}
