import { notFound } from 'next/navigation'
import { ClubProvider } from '@/components/club/club-provider'
import { TopBar } from '@/components/club/top-bar'
import { requireClubSession, requireSession } from '@/lib/session'
import { getClubData } from '@/lib/data'
import { getTenant } from '@/lib/tenants'

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ club: string }>
}) {
  const { club } = await params
  // El [club] de /c/[club] es solo navegación: si no coincide con el club de la sesión, a /clubes.
  const clubSession = await requireClubSession(club)
  const session = await requireSession()

  const tenant = getTenant(club)
  if (!tenant) notFound()
  const data = getClubData(tenant)

  return (
    <ClubProvider key={tenant.slug} tenant={tenant} initialData={data}>
      <div className="flex min-h-dvh flex-col">
        {/* El rol dentro del club llega con /me en FRO-4. */}
        <TopBar
          userName={clubSession.user.name}
          userRole={clubSession.user.is_platform_admin ? 'Administración de plataforma' : 'Miembro del club'}
          userTenants={session.tenants}
        />
        <main className="flex-1">{children}</main>
      </div>
    </ClubProvider>
  )
}
