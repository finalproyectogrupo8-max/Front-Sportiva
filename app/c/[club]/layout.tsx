import { notFound } from 'next/navigation'
import { ClubProvider } from '@/components/club/club-provider'
import { TopBar } from '@/components/club/top-bar'
import { requireSession } from '@/lib/auth'
import { getClubData } from '@/lib/data'
import { getTenant } from '@/lib/tenants'

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ club: string }>
}) {
  const session = await requireSession()
  const { club } = await params
  const tenant = getTenant(club)
  if (!tenant) notFound()
  const data = getClubData(tenant)

  return (
    <ClubProvider key={tenant.slug} tenant={tenant} initialData={data}>
      <div className="flex min-h-dvh flex-col">
        <TopBar userName={session.nombre} userRole={session.rol} />
        <main className="flex-1">{children}</main>
      </div>
    </ClubProvider>
  )
}
