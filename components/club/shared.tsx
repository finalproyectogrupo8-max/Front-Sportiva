'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ModuleHeaderBackground } from './module-background'

export function ModuleHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  moduleId,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  children?: React.ReactNode
  moduleId?: string
}) {
  const pathname = usePathname()
  const resolvedModule = moduleId ?? pathname?.split('/')[3]

  return (
    <header className="relative overflow-hidden border-b border-border/70 bg-card/80 dark:bg-[#141413]/75 backdrop-blur-md shadow-xs">
      <ModuleHeaderBackground moduleId={resolvedModule} />
      <div className="relative z-10 mx-auto flex max-w-[120rem] flex-col gap-5 px-4 pb-4 pt-6 sm:px-6 lg:px-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1">
            {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-primary drop-shadow-xs">{eyebrow}</p>}
            <h1 className="font-display text-4xl font-bold uppercase leading-none text-balance">{title}</h1>
            {description && <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </header>
  )
}

export function PageBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
  moduleId?: string
}) {
  return (
    <div className={cn('mx-auto flex max-w-[120rem] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10', className)}>
      {children}
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; count?: number }[]
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex w-fit max-w-full flex-wrap gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition',
              active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn('tabular-nums text-xs', active ? 'text-primary' : 'text-muted-foreground')}>
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function FormSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Elegir…',
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select items={options} value={value || null} onValueChange={(v) => onChange((v as string) ?? '')}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const TONES = {
  ok: 'bg-success/12 text-success',
  warn: 'bg-warning/18 text-foreground',
  bad: 'bg-destructive/10 text-destructive',
  info: 'bg-primary/10 text-primary',
  neutral: 'bg-muted text-muted-foreground',
} as const
const DOTS = {
  ok: 'bg-success',
  warn: 'bg-warning',
  bad: 'bg-destructive',
  info: 'bg-primary',
  neutral: 'bg-muted-foreground/50',
} as const
export type Tone = keyof typeof TONES

export function Pill({ tone = 'neutral', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', TONES[tone], className)}>
      <span className={cn('size-1.5 rounded-full', DOTS[tone])} aria-hidden="true" />
      {children}
    </span>
  )
}

export function Meter({ value, max = 100, tone }: { value: number; max?: number; tone?: Tone }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const auto: Tone = tone ?? (pct >= 75 ? 'ok' : pct >= 50 ? 'warn' : 'bad')
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="presentation">
      <div className={cn('h-full rounded-full transition-all', DOTS[auto])} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Initials({ name, className }: { name: string; className?: string }) {
  const ini = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
  return (
    <span
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-sm font-semibold uppercase text-secondary-foreground',
        className,
      )}
      aria-hidden="true"
    >
      {ini}
    </span>
  )
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="font-display text-3xl font-bold leading-none tabular-nums">{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}
