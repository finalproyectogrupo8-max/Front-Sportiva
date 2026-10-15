import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('size-8', className)}>
      <rect width="32" height="32" rx="8" className="fill-ink" />
      <path d="M7 9.5h18" className="stroke-ink-foreground" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M10 15h12" className="stroke-ink-foreground/70" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M13 20.5h6" className="stroke-ink-foreground/45" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="16" cy="25" r="2" className="fill-warning" />
    </svg>
  )
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      {!compact && (
        <span className="font-display text-2xl font-bold uppercase leading-none tracking-wide text-foreground">
          Tribuna
        </span>
      )}
    </span>
  )
}

export function ClubCrest({
  short,
  color,
  className,
}: {
  short: string
  color: string
  className?: string
}) {
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
