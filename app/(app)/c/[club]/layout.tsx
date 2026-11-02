import { redirect } from 'next/navigation'
import { AppFooter } from '@/components/app-footer'
import { ClubProvider } from '@/components/club/club-provider'
import { MobileNav } from '@/components/club/mobile-nav'
import { TopBar } from '@/components/club/top-bar'
import { requireSession } from '@/lib/session'
import { getClubData } from '@/lib/data'
import { getSetupSteps } from '@/lib/club-setup'
import { normalizeTenant } from '@/lib/tenants'

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

  // Decisión de arquitectura (FRO-8 - Opción A):
  // Para la demo, mantenemos los datos mockeados en las vistas internas de los módulos (getClubData).
  // Se normaliza el tenant de la sesión asignando valores por defecto para que la UI no se rompa.
  const tenant = normalizeTenant(session.tenant)
  const data = getClubData(tenant)
  const setupSteps = await getSetupSteps()
  const roles = session.profile?.roles.map((role) => role.name) ?? []

  return (
    <ClubProvider
      key={session.tenant.slug}
      tenant={session.tenant}
      initialData={data}
      permissions={session.permissions ?? []}
      permissionScopes={session.permissionScopes}
    >
      <div className="flex min-h-dvh flex-col">
        {/* Decisión de arquitectura (FRO-8 - Opción A):
            Para la demo, mantenemos los datos mockeados en las vistas internas de los módulos (getClubData),
            pero agregamos un banner visible en la parte superior del layout indicando que son datos de ejemplo. */}
        <div className="border-b border-amber-200 bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950 dark:text-amber-200">
          Modo Demo · Datos de ejemplo en módulos operativos
        </div>

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
