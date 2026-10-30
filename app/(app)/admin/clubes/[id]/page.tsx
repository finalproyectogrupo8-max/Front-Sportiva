import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Database, Info, UserCheck, UserX, Users } from 'lucide-react'
import { requirePlatformAdmin } from '@/lib/session'
import { getAdminTenant, getTenantMemberships, getTenantRoles } from '@/lib/api/admin'
import { TenantStatusBadge } from '@/components/admin/club-table'
import { AddMemberSheet } from '@/components/admin/membership-form'
import { MembershipTable } from '@/components/admin/membership-table'
import { Pagination } from '@/components/admin/pagination'
import { ProvisioningPoller } from '@/components/admin/provisioning-poller'

export default async function AdminClubDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  await requirePlatformAdmin()

  const { id } = await params
  const tenantId = Number(id)
  if (!Number.isInteger(tenantId) || tenantId <= 0) notFound()

  const { page: rawPage } = await searchParams
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)

  let tenantResult
  let membershipsResult
  let activeResult
  let rolesResult
  try {
    ;[tenantResult, membershipsResult, activeResult, rolesResult] = await Promise.all([
      getAdminTenant(tenantId),
      getTenantMemberships(tenantId, { page, per_page: 20 }),
      // Solo para contar los activos: con per_page=1 alcanza el `meta.total`.
      getTenantMemberships(tenantId, { is_active: true, per_page: 1 }),
      // Vacío si el club todavía no está activo.
      getTenantRoles(tenantId),
    ])
  } catch {
    return <ConnectionError />
  }

  if (!tenantResult.ok) {
    if (tenantResult.status === 404) notFound()
    if (tenantResult.status === 403) redirect('/clubes')
    return <ConnectionError message={tenantResult.message} />
  }

  const tenant = tenantResult.data.data
  const isActive = tenant.status === 'active'
  const totalMembers = membershipsResult.ok ? membershipsResult.data.meta.total : null
  const activeMembers = activeResult.ok ? activeResult.data.meta.total : null
  const roles = rolesResult.ok ? rolesResult.data.data : []

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/clubes"
          className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Clubes
        </Link>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Club</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
              {tenant.name}
            </h1>
            <TenantStatusBadge status={tenant.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              Ruta: <code className="font-mono text-foreground">/c/{tenant.slug}</code>
            </span>
            <span className="flex items-center gap-1">
              <Database className="size-3.5" aria-hidden="true" />
              <code className="font-mono">{tenant.database_name}</code>
            </span>
          </div>
        </div>
      </div>

      {tenant.status === 'provisioning' && <ProvisioningPoller tenantIds={[tenant.id]} />}

      {totalMembers !== null && activeMembers !== null && (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat icon={Users} label="Miembros" value={totalMembers} tone="primary" />
          <Stat icon={UserCheck} label="Con acceso" value={activeMembers} tone="success" />
          <Stat icon={UserX} label="Desactivados" value={totalMembers - activeMembers} tone="muted" />
        </dl>
      )}

      <section className="flex flex-col gap-4" aria-labelledby="members-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-foreground" aria-hidden="true" />
            <h2 id="members-title" className="text-lg font-semibold text-foreground">
              Miembros
            </h2>
          </div>
          <AddMemberSheet tenantId={tenant.id} tenantSlug={tenant.slug} roles={roles} disabled={!isActive} />
        </div>

        {!isActive && (
          <p className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Info className="size-4 shrink-0" aria-hidden="true" />
            Solo se pueden agregar miembros a un club activo.
          </p>
        )}

        {membershipsResult.ok ? (
          <>
            <MembershipTable tenantId={tenant.id} memberships={membershipsResult.data.data} roles={roles} />
            <Pagination meta={membershipsResult.data.meta} label={{ one: 'miembro', many: 'miembros' }} />
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
            <AlertTriangle className="size-6" aria-hidden="true" />
            <p className="text-sm">No se pudieron cargar los miembros: {membershipsResult.message}</p>
          </div>
        )}
      </section>
    </div>
  )
}

const STAT_TONES = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  muted: 'bg-muted text-muted-foreground',
} as const

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users
  label: string
  value: number
  tone: keyof typeof STAT_TONES
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <div className={`flex size-10 items-center justify-center rounded-lg ${STAT_TONES[tone]}`}>
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="flex flex-col">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-display text-2xl font-bold leading-none text-foreground">{value}</dd>
      </div>
    </div>
  )
}

function ConnectionError({ message }: { message?: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
        <AlertTriangle className="size-8" aria-hidden="true" />
        <h2 className="text-base font-semibold">No se pudo cargar el club</h2>
        <p className="text-xs text-muted-foreground">
          {message ?? 'Asegurate de que la API esté corriendo y probá recargar.'}
        </p>
      </div>
    </div>
  )
}
