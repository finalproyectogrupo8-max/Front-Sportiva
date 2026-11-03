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

  const [team, roles, sports, activity] = await Promise.all([
    listTeam(),
    listTeamRoles().catch(() => null),
    listSports().catch(() => null),
    canViewActivity
      ? listClubActivity({
          type: activityType,
          from: activityFrom,
          to: activityTo,
          per_page: 30,
        }).catch(() => null)
      : Promise.resolve(null),
  ])

  return (
    <TeamModule
      members={team.ok ? team.data.data : []}
      roles={roles?.ok ? roles.data.data.map((r) => ({ slug: r.slug, name: r.name, description: r.description, is_system: r.is_system })) : []}
      sports={sports?.ok ? sports.data.data.filter((s) => s.is_active).map((s) => ({ id: s.id, name: s.name })) : []}
      startInvite={query.nuevo === '1'}
      activity={canViewActivity ? (activity?.ok ? activity.data : null) : undefined}
      can={{ invite: permissions.has('club_users.invite'), update: permissions.has('club_users.update'), disable: permissions.has('club_users.disable') }}
    />
  )
}
