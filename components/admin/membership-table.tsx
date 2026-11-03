'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { Loader2, PauseCircle, PlayCircle, ShieldCheck, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  setMembershipActiveAction,
  updateMembershipRolesAction,
  type UpdateRolesState,
} from '@/app/(app)/admin/clubes/[id]/actions'
import { RoleChecklist } from '@/components/admin/role-checklist'
import type { AdminMembership, ClubRole } from '@/lib/api/admin'
import { formatShortDate } from '@/lib/format-date'
import { UserStatusBadge } from '@/components/admin/user-status-badge'

function RoleBadges({ membership }: { membership: AdminMembership }) {
  const roles = membership.roles ?? []
  if (roles.length === 0) return <span className="text-xs text-muted-foreground">Sin roles</span>

  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge key={role.slug} variant="outline" className="text-[11px] font-normal">
          {role.name}
        </Badge>
      ))}
    </div>
  )
}

function EditRolesForm({
  tenantId,
  membership,
  roles,
  onSaved,
}: {
  tenantId: number
  membership: AdminMembership
  roles: ClubRole[]
  onSaved: () => void
}) {
  const [state, action, pending] = useActionState<UpdateRolesState, FormData>(updateMembershipRolesAction, {})

  useEffect(() => {
    if (!state.ok) return
    toast.success(`Roles de ${membership.user?.name ?? 'el usuario'} actualizados.`)
    onSaved()
  }, [state.ok, state.timestamp]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="tenant_id" value={tenantId} />
      <input type="hidden" name="membership_id" value={membership.id} />
      <RoleChecklist
        roles={roles}
        defaultSelected={(membership.roles ?? []).map((role) => role.slug)}
        disabled={pending}
        error={state.error}
        idPrefix={`membership-${membership.id}`}
      />
      <DialogFooter>
        <Button type="submit" disabled={pending} className="cursor-pointer gap-2">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Guardar roles
        </Button>
      </DialogFooter>
    </form>
  )
}

function EditRolesButton({
  tenantId,
  membership,
  roles,
}: {
  tenantId: number
  membership: AdminMembership
  roles: ClubRole[]
}) {
  const [open, setOpen] = useState(false)
  const name = membership.user?.name ?? 'el usuario'

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-7 cursor-pointer gap-1 px-2 text-xs"
      >
        <ShieldCheck className="size-3" aria-hidden="true" />
        Roles
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Roles de {name}</DialogTitle>
            <DialogDescription>Definen qué puede ver y hacer en este club.</DialogDescription>
          </DialogHeader>
          {open && (
            <EditRolesForm tenantId={tenantId} membership={membership} roles={roles} onSaved={() => setOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}


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
  roles,
}: {
  tenantId: number
  memberships: AdminMembership[]
  /** Roles del club, para editar los de cada miembro. */
  roles: ClubRole[]
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
                Roles
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
                <td className="hidden px-4 py-3 md:table-cell">
                  <RoleBadges membership={membership} />
                </td>
                <td className="px-4 py-3">
                  <UserStatusBadge
                    status={
                      membership.user?.status === 'invited'
                        ? 'invited'
                        : membership.is_active
                          ? membership.user?.status ?? 'active'
                          : 'inactive'
                    }
                  />
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                  {formatShortDate(membership.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    {roles.length > 0 && (
                      <EditRolesButton tenantId={tenantId} membership={membership} roles={roles} />
                    )}
                    <MembershipActions tenantId={tenantId} membership={membership} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
