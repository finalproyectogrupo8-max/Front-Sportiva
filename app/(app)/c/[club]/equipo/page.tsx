import { AlertTriangle, Users } from 'lucide-react'
import { InviteStaffSheet } from '@/components/club/invite-staff-sheet'
import { TeamTable } from '@/components/club/team-table'
import { NoAccess } from '@/components/club/no-access'
import { getClubRoles, getClubTeamUsers } from '@/lib/api/club-users'
import { requireClubSession } from '@/lib/session'

export default async function ClubTeamPage({ params }: { params: Promise<{ club: string }> }) {
  const { club } = await params
  const session = await requireClubSession(club)
  const permissions = new Set(session.permissions ?? [])
  const canView = permissions.has('club_users.view')
  const canInvite = permissions.has('club_users.invite')
  const canReadRoles = permissions.has('roles.view')

  if (!canView) {
    return <NoAccess moduleName="el equipo del club" homeHref={`/c/${club}`} />
  }

  const [usersCall, rolesCall] = await Promise.allSettled([
    getClubTeamUsers(),
    canInvite && canReadRoles ? getClubRoles() : Promise.resolve(null),
  ])
  const usersResult = usersCall.status === 'fulfilled' ? usersCall.value : null
  const rolesResult =
    rolesCall.status === 'fulfilled' && rolesCall.value !== null ? rolesCall.value : null
  const usersConnectionError = usersCall.status === 'rejected'
  const rolesConnectionError = rolesCall.status === 'rejected'

  const roles = rolesResult?.ok ? rolesResult.data.data : []
  const canShowInvite = canInvite && canReadRoles && roles.length > 0

  return (
    <div className="mx-auto flex max-w-[120rem] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Administración del club</p>
          <div className="flex items-center gap-2">
            <Users className="size-7 text-foreground" aria-hidden="true" />
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
              Equipo del club
            </h1>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Invitá a las personas que trabajan en el club y asignales los roles que necesitan.
          </p>
        </div>
        {canShowInvite && <InviteStaffSheet roles={roles} />}
      </div>

      {canInvite && !canReadRoles && (
        <p role="status" className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Para invitar personas también necesitás permiso para consultar los roles del club.
        </p>
      )}
      {canInvite && canReadRoles && rolesConnectionError && (
        <p role="alert" aria-live="polite" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          No pudimos conectar con el servidor para cargar los roles. Probá de nuevo más tarde.
        </p>
      )}
      {canInvite && canReadRoles && rolesResult && !rolesResult.ok && (
        <p role="alert" aria-live="polite" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          No se pudieron cargar los roles: {rolesResult.message}
        </p>
      )}
      {canInvite && canReadRoles && rolesResult?.ok && roles.length === 0 && (
        <p role="status" className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Este club todavía no tiene roles disponibles para asignar.
        </p>
      )}

      <section className="flex flex-col gap-4" aria-label="Personas del equipo">
        {usersConnectionError ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
            <AlertTriangle className="size-6" aria-hidden="true" />
            <p className="text-sm">No pudimos conectar con el servidor. Asegurate de que la API esté corriendo y probá recargar.</p>
          </div>
        ) : !usersResult || !usersResult.ok ? (
          <div role="alert" className="flex flex-col items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
            <AlertTriangle className="size-6" aria-hidden="true" />
            <p className="text-sm">
              No se pudo cargar el equipo: {usersResult && !usersResult.ok ? usersResult.message : 'error inesperado.'}
            </p>
          </div>
        ) : (
          <TeamTable
            users={usersResult.data.data}
            canResendInvites={permissions.has('club_users.update')}
          />
        )}
      </section>
    </div>
  )
}
