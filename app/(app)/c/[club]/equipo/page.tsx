import type { Metadata } from 'next'
import { NoAccess } from '@/components/club/no-access'
import { TeamModule } from '@/components/club/team/team-module'
import { listSports } from '@/lib/api/club'
import { listClubActivity, type ClubActivityType } from '@/lib/api/activity'
import { listTeam, listTeamRoles } from '@/lib/api/team'
import { requireSession } from '@/lib/session'
import { isValidDay } from '@/lib/club-time'

export const metadata: Metadata = { title: 'Equipo — Sportiva' }

const ACTIVITY_TYPES: ClubActivityType[] = ['order', 'player', 'club_user', 'announcement']

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ club: string }>
  searchParams: Promise<{
    nuevo?: string
    actividad_tipo?: string
    actividad_desde?: string
    actividad_hasta?: string
  }>
}) {
  const { club } = await params
  const query = await searchParams
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  if (!permissions.has('club_users.view')) return <NoAccess moduleName="Equipo" homeHref={`/c/${club}`} />

  // El registro de actividad solo lo ve quien tiene `audit.view` (por defecto, el admin del club).
  const canViewActivity = permissions.has('audit.view')
  const activityType = ACTIVITY_TYPES.find((type) => type === query.actividad_tipo)
  const activityFrom = isValidDay(query.actividad_desde) ? query.actividad_desde : undefined
  const activityTo = isValidDay(query.actividad_hasta) ? query.actividad_hasta : undefined

  const canInvite = permissions.has('club_users.invite')
  const canManage = canInvite || permissions.has('club_users.update')
  const [team, roles, sports, activity] = await Promise.all([
    listTeam(),
    canManage ? listTeamRoles() : Promise.resolve(null),
    canInvite ? listSports() : Promise.resolve(null),
    canViewActivity
      ? listClubActivity({
          type: activityType,
          from: activityFrom,
          to: activityTo,
          per_page: 30,
        }).catch(() => null)
      : Promise.resolve(null),
  ])
  const errors = [
    !team.ok ? `No se pudo cargar el equipo: ${team.message}` : null,
    roles && !roles.ok ? `No se pudieron cargar los roles: ${roles.message}` : null,
    sports && !sports.ok ? `No se pudieron cargar los deportes: ${sports.message}` : null,
  ].filter((message): message is string => message !== null)

  return (
    <>
      {errors.map((error) => (
        <p key={error} role="alert" aria-live="polite" className="mx-auto mt-6 max-w-5xl rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ))}
      <TeamModule
        members={team.ok ? team.data.data : []}
        roles={roles?.ok ? roles.data.data : []}
        sports={sports?.ok ? sports.data.data.filter((sport) => sport.is_active).map(({ id, name }) => ({ id, name })) : []}
        startInvite={query.nuevo === '1'}
        activity={canViewActivity ? (activity?.ok ? activity.data : null) : undefined}
        can={{ invite: canInvite, update: permissions.has('club_users.update'), disable: permissions.has('club_users.disable') }}
      />
    </>
  )
}
