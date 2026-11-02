import type { Metadata } from 'next'
import { NoAccess } from '@/components/club/no-access'
import { TeamModule } from '@/components/club/team/team-module'
import { listSports } from '@/lib/api/club'
import { listTeam, listTeamRoles } from '@/lib/api/team'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Equipo — Sportiva' }

export default async function TeamPage({ params, searchParams }: { params: Promise<{ club: string }>; searchParams: Promise<{ nuevo?: string }> }) {
  const { club } = await params
  const query = await searchParams
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  if (!permissions.has('club_users.view')) return <NoAccess moduleName="Equipo" homeHref={`/c/${club}`} />

  const [team, roles, sports] = await Promise.all([listTeam(), listTeamRoles().catch(() => null), listSports().catch(() => null)])

  return (
    <TeamModule
      members={team.ok ? team.data.data : []}
      roles={roles?.ok ? roles.data.data.map((r) => ({ slug: r.slug, name: r.name, description: r.description, is_system: r.is_system })) : []}
      sports={sports?.ok ? sports.data.data.filter((s) => s.is_active).map((s) => ({ id: s.id, name: s.name })) : []}
      startInvite={query.nuevo === '1'}
      can={{ invite: permissions.has('club_users.invite'), update: permissions.has('club_users.update'), disable: permissions.has('club_users.disable') }}
    />
  )
}
