import { redirect } from 'next/navigation'
import { AppFooter } from '@/components/app-footer'
import { ClubProvider } from '@/components/club/club-provider'
import { MobileNav } from '@/components/club/mobile-nav'
import { TopBar } from '@/components/club/top-bar'
import { requireSession } from '@/lib/session'
import { getSetupSteps } from '@/lib/club-setup'

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ club: string }>
}) {
  const { club } = await params
  const session = await requireSession()

  // Validación de seguridad por URL (FRO-8):
  // Compara el parámetro [club] de la URL con el tenant.slug que viene en el token/sesión.
  // Si no coinciden, redirige inmediatamente a /clubes (la URL es solo para navegación).
  if (!session.tenant || session.tenant.slug !== club) {
    redirect('/clubes')
  }

  const setupSteps = await getSetupSteps()
  const roles = session.profile?.roles.map((role) => role.name) ?? []

  return (
    <ClubProvider
      key={session.tenant.slug}
      tenant={session.tenant}
      permissions={session.permissions ?? []}
      permissionScopes={session.permissionScopes}
    >
      <div className="flex min-h-dvh flex-col">
        <TopBar
          setupSteps={setupSteps}
          userName={session.user.name}
          userRole={roles.length > 0 ? roles.join(' · ') : 'Sin rol en el club'}
          userTenants={session.tenants}
        />
        <main className="flex-1">{children}</main>
        <AppFooter />
        <MobileNav />
      </div>
    </ClubProvider>
  )
}
