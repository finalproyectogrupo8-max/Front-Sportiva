import { Badge } from '@/components/ui/badge'
import { isUserStatus, USER_STATUS_DETAILS } from '@/lib/user-status'

export function UserStatusBadge({ status }: { status: string }) {
  const knownStatus = isUserStatus(status) ? USER_STATUS_DETAILS[status] : null

  return (
    <Badge
      variant="outline"
      className={`text-xs font-normal ${knownStatus?.className ?? 'border-muted bg-muted/60 text-muted-foreground'}`}
    >
      {knownStatus?.label ?? 'Estado desconocido'}
    </Badge>
  )
}
