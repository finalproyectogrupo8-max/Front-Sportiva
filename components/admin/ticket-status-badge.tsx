import { CheckCircle2, Clock, Eye, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TICKET_STATUS_LABELS } from '@/lib/admin-labels'
import type { SupportTicketStatus } from '@/lib/admin-types'
import { cn } from '@/lib/utils'

interface TicketStatusBadgeProps {
  status: SupportTicketStatus
  className?: string
}

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  const label = TICKET_STATUS_LABELS[status] ?? status

  switch (status) {
    case 'new':
      return (
        <Badge
          variant="outline"
          className={cn(
            'gap-1.5 border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300 text-xs font-medium',
            className,
          )}
        >
          <Clock className="size-3" aria-hidden="true" />
          {label}
        </Badge>
      )
    case 'in_review':
      return (
        <Badge
          variant="outline"
          className={cn(
            'gap-1.5 border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium',
            className,
          )}
        >
          <Eye className="size-3" aria-hidden="true" />
          {label}
        </Badge>
      )
    case 'resolved':
      return (
        <Badge
          variant="outline"
          className={cn(
            'gap-1.5 border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium',
            className,
          )}
        >
          <CheckCircle2 className="size-3" aria-hidden="true" />
          {label}
        </Badge>
      )
    case 'discarded':
      return (
        <Badge
          variant="outline"
          className={cn(
            'gap-1.5 border-muted bg-muted/60 text-muted-foreground text-xs font-medium',
            className,
          )}
        >
          <XCircle className="size-3" aria-hidden="true" />
          {label}
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className={cn('text-xs font-medium', className)}>
          {label}
        </Badge>
      )
  }
}
