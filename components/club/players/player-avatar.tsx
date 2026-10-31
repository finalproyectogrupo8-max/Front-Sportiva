import { cn } from '@/lib/utils'
import { initials } from '@/lib/player-labels'

/** Foto del jugador, o sus iniciales. Con número de camiseta, va en una esquina. */
export function PlayerAvatar({
  first,
  last,
  src,
  number,
  className,
}: {
  first: string
  last: string
  src: string | null
  number?: number | null
  className?: string
}) {
  return (
    <span className={cn('relative inline-flex size-10 shrink-0', className)}>
      {src ? (
        // La foto la sirve el propio front (ruta con el token del club).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full rounded-full bg-muted object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
          {initials(first, last)}
        </span>
      )}
      {number != null && (
        <span className="absolute -bottom-1 -right-1 flex min-w-5 items-center justify-center rounded-md bg-ink px-1 font-display text-[10px] font-bold leading-4 text-ink-foreground tabular-nums">
          {number}
        </span>
      )}
    </span>
  )
}
