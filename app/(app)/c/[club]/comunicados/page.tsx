import type { Metadata } from 'next'
import { AnnouncementsModule } from '@/components/club/announcements/announcements-module'
import { NoAccess } from '@/components/club/no-access'
import { getAnnouncement, listAnnouncements, listRecipients, listRoles } from '@/lib/api/announcements'
import { listCategories, listSeasons } from '@/lib/api/club'
import { listClubUsers } from '@/lib/api/facilities'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Comunicados — Sportiva' }

export default async function AnnouncementsPage({
  params,
  searchParams,
}: {
  params: Promise<{ club: string }>
  searchParams: Promise<{ comunicado?: string; nuevo?: string; categoria?: string; asunto?: string; cuerpo?: string }>
}) {
  const { club } = await params
  const query = await searchParams
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  if (!permissions.has('announcements.view')) return <NoAccess moduleName="Comunicados" homeHref={`/c/${club}`} />

  const canSend = permissions.has('announcements.send')
  // Al staff (roles y usuarios del club) solo le escribe quien tiene alcance sobre todo el club.
  const canWriteStaff = canSend && (session.permissionScopes?.['announcements.send'] ?? 'all') === 'all'
  const openId = Number(query.comunicado) || null

  const [announcements, categories, seasons, roles, users, open, recipients] = await Promise.all([
    listAnnouncements(),
    canSend ? listCategories() : Promise.resolve(null),
    canSend ? listSeasons() : Promise.resolve(null),
    canWriteStaff && permissions.has('roles.view') ? listRoles().catch(() => null) : Promise.resolve(null),
    canWriteStaff ? listClubUsers().catch(() => null) : Promise.resolve(null),
    openId ? getAnnouncement(openId) : Promise.resolve(null),
    openId ? listRecipients(openId) : Promise.resolve(null),
  ])

  const seasonName = new Map((seasons?.ok ? seasons.data.data : []).map((s) => [s.id, s.name]))
  const activeCategories = (categories?.ok ? categories.data.data : []).filter((c) => c.is_active)
  const repeated = new Set(activeCategories.map((c) => c.name.toLowerCase()).filter((n, i, all) => all.indexOf(n) !== i))

  return (
    <AnnouncementsModule
      clubName={session.tenant?.short_name || session.tenant?.name || 'El club'}
      announcements={announcements.ok ? announcements.data.data : []}
      categories={activeCategories.map((c) => ({
        id: c.id,
        name: repeated.has(c.name.toLowerCase()) && seasonName.get(c.season_id) ? `${c.name} · ${seasonName.get(c.season_id)}` : c.name,
      }))}
      roles={roles?.ok ? roles.data.data.map((r) => ({ slug: r.slug, name: r.name })) : []}
      users={users?.ok ? users.data.data.map((u) => ({ id: u.id, name: u.display_name })) : []}
      open={open?.ok ? { announcement: open.data.data, recipients: recipients?.ok ? recipients.data.data : [] } : null}
      compose={
        canSend && query.nuevo === '1'
          ? { categoryId: Number(query.categoria) || null, subject: query.asunto?.slice(0, 150) ?? '', body: query.cuerpo?.slice(0, 2000) ?? '' }
          : null
      }
      can={{ send: canSend, staff: canWriteStaff }}
    />
  )
}
