'use client'

import { useTransition } from 'react'
import { CheckCircle2, Loader2, ShieldCheck, UserX, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AssignClubDialog } from '@/components/admin/assign-club-dialog'
import { toggleUserStatusAction } from '@/app/admin/usuarios/actions'
import type { AdminUser } from '@/lib/api/admin'
import { formatShortDate } from '@/lib/format-date'


function StatusToggle({ user }: { user: AdminUser }) {
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleUserStatusAction(user.id, user.is_active)
      if (res.ok) {
        toast.success(
          res.is_active
            ? `Usuario "${user.name}" activado.`
            : `Usuario "${user.name}" desactivado.`,
        )
      } else {
        toast.error(res.error || 'No se pudo cambiar el estado.')
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
        'h-7 px-2 text-xs cursor-pointer',
        user.is_active
          ? 'border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive'
          : 'border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400',
      )}
      title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
    >
      {isPending ? (
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
      ) : user.is_active ? (
        'Desactivar'
      ) : (
        'Activar'
      )}
    </Button>
  )
}

export function UserTable({ users }: { users: AdminUser[] }) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 p-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UserX className="size-6" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <h3 className="text-base font-semibold text-foreground">No se encontraron usuarios</h3>
          <p className="text-sm text-muted-foreground">
            No hay usuarios que coincidan con la búsqueda o el filtro seleccionado.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Listado de usuarios de la plataforma</caption>
          <thead className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">
                Usuario
              </th>
              <th scope="col" className="hidden px-4 py-3 sm:table-cell">
                Rol
              </th>
              <th scope="col" className="px-4 py-3">
                Estado
              </th>
              <th scope="col" className="hidden px-4 py-3 md:table-cell">
                Fecha de alta
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-muted/40">
                {/* Nombre y Email */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-display text-xs font-semibold text-muted-foreground">
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-medium text-foreground">{user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </td>

                {/* Rol */}
                <td className="hidden px-4 py-3 sm:table-cell">
                  {user.is_platform_admin ? (
                    <Badge variant="secondary" className="gap-1 font-normal text-xs">
                      <ShieldCheck className="size-3 text-primary" aria-hidden="true" />
                      Admin
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Usuario</span>
                  )}
                </td>

                {/* Estado */}
                <td className="px-4 py-3">
                  {user.is_active ? (
                    <Badge
                      variant="outline"
                      className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-normal"
                    >
                      <CheckCircle2 className="size-3" aria-hidden="true" />
                      Activo
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="gap-1 border-muted bg-muted/60 text-muted-foreground text-xs font-normal"
                    >
                      <XCircle className="size-3" aria-hidden="true" />
                      Inactivo
                    </Badge>
                  )}
                </td>

                {/* Fecha */}
                <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-muted-foreground md:table-cell">
                  {formatShortDate(user.created_at)}
                </td>

                {/* Acciones */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Los admins de plataforma siempre entran a /admin: una membresía no les sirve. */}
                    {user.is_active && !user.is_platform_admin && <AssignClubDialog user={user} />}
                    <StatusToggle user={user} />
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
