'use client'

import { useTransition } from 'react'
import { CheckCircle2, Loader2, PauseCircle, PlayCircle, Users, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { setMembershipActiveAction } from '@/app/admin/clubes/[id]/actions'
import { membershipRoleLabel } from '@/lib/membership-roles'
import type { AdminMembership } from '@/lib/api/admin'
import { formatShortDate } from '@/lib/format-date'


function MembershipActions({ tenantId, membership }: { tenantId: number; membership: AdminMembership }) {
  const [isPending, startTransition] = useTransition()
  const name = membership.user?.name ?? 'el usuario'

  const handleToggle = () => {
    const activate = !membership.is_active
    if (!activate && !window.confirm(`¿Desactivar a ${name}? Pierde el acceso a este club de inmediato.`)) {
      return
    }

    startTransition(async () => {
      const res = await setMembershipActiveAction(tenantId, membership.id, activate)
      if (res.ok) {
        toast.success(activate ? `${name} vuelve a tener acceso al club.` : `${name} ya no tiene acceso al club.`)
      } else {
        toast.error(res.error || 'No se pudo actualizar la membresía.')
      }
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        'h-7 cursor-pointer gap-1 px-2 text-xs',
        membership.is_active
          ? 'border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive'
          : 'border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400',
      )}
    >
      {isPending ? (
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
      ) : membership.is_active ? (
        <PauseCircle className="size-3" aria-hidden="true" />
      ) : (
        <PlayCircle className="size-3" aria-hidden="true" />
      )}
      <span>{membership.is_active ? 'Desactivar' : 'Activar'}</span>
    </Button>
  )
}

export function MembershipTable({
  tenantId,
  memberships,
}: {
  tenantId: number
  memberships: AdminMembership[]
}) {
  if (memberships.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 p-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Users className="size-6" aria-hidden="true" />
        </div>
        <div className="flex max-w-sm flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground">Este club todavía no tiene miembros</h3>
          <p className="text-sm text-muted-foreground">
            Agregá un usuario para que pueda entrar al club.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Miembros del club</caption>
          <thead className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">
                Usuario
              </th>
              <th scope="col" className="hidden px-4 py-3 md:table-cell">
                Rol
              </th>
              <th scope="col" className="px-4 py-3">
                Estado
              </th>
              <th scope="col" className="hidden px-4 py-3 sm:table-cell">
                Desde
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {memberships.map((membership) => (
              <tr key={membership.id} className="transition-colors hover:bg-muted/40">
                <td className="px-4 py-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-foreground">
                      {membership.user?.name ?? `Usuario #${membership.user_id}`}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{membership.user?.email}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                  {membershipRoleLabel(membership.role)}
                </td>
                <td className="px-4 py-3">
                  {membership.is_active ? (
                    <Badge
                      variant="outline"
                      className="gap-1.5 border-emerald-500/25 bg-emerald-500/10 text-xs font-normal text-emerald-700 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="size-3" aria-hidden="true" />
                      Activa
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1.5 text-xs font-normal text-muted-foreground">
                      <XCircle className="size-3" aria-hidden="true" />
                      Inactiva
                    </Badge>
                  )}
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                  {formatShortDate(membership.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <MembershipActions tenantId={tenantId} membership={membership} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
