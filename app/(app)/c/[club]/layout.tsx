import { redirect } from 'next/navigation'
import { ClubProvider } from '@/components/club/club-provider'
import { TopBar } from '@/components/club/top-bar'
import { requireSession } from '@/lib/session'
import { getClubData } from '@/lib/data'
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

  return (
    <ClubProvider key={session.tenant.slug} tenant={session.tenant} initialData={data}>
      <div className="flex min-h-dvh flex-col">
        {/* Decisión de arquitectura (FRO-8 - Opción A):
            Para la demo, mantenemos los datos mockeados en las vistas internas de los módulos (getClubData),
            pero agregamos un banner visible en la parte superior del layout indicando que son datos de ejemplo. */}
        <div className="border-b border-amber-200 bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
          Modo Demo · Datos de ejemplo en módulos operativos
        </div>

        <TopBar
          userName={session.user.name}
          userRole="Miembro del club"
          userTenants={session.tenants}
        />
        <main className="flex-1">{children}</main>
      </div>
    </ClubProvider>
  )
}
