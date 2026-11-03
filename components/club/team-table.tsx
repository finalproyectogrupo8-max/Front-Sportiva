'use client'

import { Badge } from '@/components/ui/badge'
import { ResendInviteButton } from '@/components/admin/resend-invite-button'
import { UserStatusBadge } from '@/components/admin/user-status-badge'
import { resendClubInviteAction } from '@/app/(app)/c/[club]/equipo/actions'
import type { ClubTeamUser } from '@/lib/api/club-users'
import { formatShortDate } from '@/lib/format-date'

export function TeamTable({
  users,
  canResendInvites,
}: {
  users: ClubTeamUser[]
  canResendInvites: boolean
}) {
  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card/50 p-10 text-center">
        <h2 className="font-semibold text-foreground">Todavía no hay personas en el equipo</h2>
        <p className="mt-1 text-sm text-muted-foreground">Cuando invites a alguien, va a aparecer en esta lista.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Equipo del club</caption>
          <thead className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">Persona</th>
              <th scope="col" className="px-4 py-3">Roles</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="hidden px-4 py-3 md:table-cell">Desde</th>
              {canResendInvites && <th scope="col" className="px-4 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="transition-colors hover:bg-muted/40">
                <td className="px-4 py-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-foreground">{user.display_name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email ?? 'Sin correo'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.length > 0 ? user.roles.map((role) => (
                      <Badge key={role.slug} variant="outline" className="text-[11px] font-normal">
                        {role.name}
                      </Badge>
                    )) : <span className="text-xs text-muted-foreground">Sin roles</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <UserStatusBadge status={user.status} />
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-muted-foreground md:table-cell">
                  {user.created_at ? formatShortDate(user.created_at) : '—'}
                </td>
                {canResendInvites && (
                  <td className="px-4 py-3 text-right">
                    {user.status === 'invited' && (
                      <ResendInviteButton
                        name={user.email ?? user.display_name}
                        onResend={() => resendClubInviteAction(user.id)}
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
