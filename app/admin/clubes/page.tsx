import { redirect } from 'next/navigation'
import { AlertTriangle, Building2 } from 'lucide-react'
import { requirePlatformAdmin } from '@/lib/session'
import {
  getAdminTenants,
  type AdminTenantsSort,
  type TenantStatus,
} from '@/lib/api/admin'
import { ClubForm } from '@/components/admin/club-form'
import { ClubFilters } from '@/components/admin/club-filters'
import { ClubTable } from '@/components/admin/club-table'
import { Pagination } from '@/components/admin/pagination'

export default async function AdminClubesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
    per_page?: string
    sort?: string
  }>
}) {
  // Guard de acceso: si no es admin de plataforma, redirige a /clubes.
  await requirePlatformAdmin()

  const params = await searchParams

  const search = params.search?.trim() || undefined
  const status =
    params.status && params.status !== 'all'
      ? (params.status as TenantStatus)
      : undefined
  const page = params.page ? Math.max(1, parseInt(params.page, 10) || 1) : 1
  const perPage = params.per_page ? Math.max(1, parseInt(params.per_page, 10) || 15) : 15
  const sort = (params.sort as AdminTenantsSort) || '-created_at'

  let result
  let connectionError = false

  try {
    result = await getAdminTenants({
      search,
      status,
      page,
      per_page: perPage,
      sort,
    })
  } catch {
    connectionError = true
  }

  // Si la API responde 403 Forbidden, redirigimos a /clubes para usuarios no autorizados.
  if (result && !result.ok && result.status === 403) {
    redirect('/clubes')
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/* Header de la sección */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Administración central
        </p>
        <div className="flex items-center gap-2">
          <Building2 className="size-7 text-foreground" aria-hidden="true" />
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
            Clubes
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Alta, aprovisionamiento y administración del estado de los inquilinos (tenants) en la plataforma.
        </p>
      </div>

      {/* Grid: Formulario a la izquierda / Listado a la derecha */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Formulario de Alta */}
        <aside className="lg:col-span-4" aria-label="Formulario de alta de club">
          <ClubForm />
        </aside>

        {/* Listado con filtros y paginación */}
        <section className="flex flex-col gap-4 lg:col-span-8" aria-label="Listado de clubes">
          <ClubFilters />

          {connectionError ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
              <AlertTriangle className="size-8" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold">Error de conexión con la API</h2>
                <p className="text-xs text-muted-foreground">
                  No pudimos consultar los clubes. Asegurate de que la API esté corriendo y probá recargar.
                </p>
              </div>
            </div>
          ) : !result || !result.ok ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
              <AlertTriangle className="size-8" aria-hidden="true" />
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold">No se pudo cargar el listado</h2>
                <p className="text-xs text-muted-foreground">
                  {result && 'message' in result ? result.message : 'Error inesperado del servidor.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <ClubTable tenants={result.data.data} />
              <Pagination meta={result.data.meta} />
            </>
          )}
        </section>
      </div>
    </div>
  )
}

