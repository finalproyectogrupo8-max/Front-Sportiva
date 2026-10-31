import { AlertTriangle, Check, Clock, Minus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Semáforo de cada papel. El color no va solo: cada estado tiene ícono y texto (accesibilidad).

export const REQUIREMENT_STATUS: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  approved: { label: 'Aprobado', icon: Check, className: 'bg-success/15 text-success' },
  submitted: { label: 'Presentado', icon: Clock, className: 'bg-primary/12 text-primary' },
  pending: { label: 'Falta', icon: Minus, className: 'bg-muted text-muted-foreground' },
  rejected: { label: 'Rechazado', icon: X, className: 'bg-destructive/12 text-destructive' },
  expired: { label: 'Vencido', icon: AlertTriangle, className: 'bg-warning/20 text-foreground' },
  not_applicable: { label: 'No aplica', icon: Minus, className: 'text-muted-foreground/50' },
}

export function StatusBadge({ status, expiringSoon, className }: { status: string; expiringSoon?: boolean; className?: string }) {
  const s = REQUIREMENT_STATUS[status] ?? REQUIREMENT_STATUS.pending
  const Icon = s.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', s.className, className)}>
      <Icon className="size-3" aria-hidden="true" />
      {s.label}
      {expiringSoon && <span className="ml-0.5 size-1.5 rounded-full bg-warning" aria-label="vence pronto" />}
    </span>
  )
}
