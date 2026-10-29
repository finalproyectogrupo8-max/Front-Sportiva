'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import {
  Building2,
  CheckCircle2,
  Clock,
  Database,
  ChevronRight,
  Users,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { retryTenantAction, updateTenantStatusAction } from '@/app/(app)/admin/clubes/actions'
import type { AdminTenant, TenantStatus } from '@/lib/api/admin'
import { formatShortDate } from '@/lib/format-date'


export function TenantStatusBadge({ status }: { status: string }) {
  switch (status as TenantStatus) {
    case 'active':
      return (
        <Badge
          variant="outline"
          className="gap-1.5 border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-normal"
        >
          <CheckCircle2 className="size-3" aria-hidden="true" />
          Activo
        </Badge>
      )
    case 'provisioning':
      return (
        <Badge
          variant="outline"
          className="gap-1.5 border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300 text-xs font-normal animate-pulse"
        >
          <Clock className="size-3" aria-hidden="true" />
          Aprovisionando
        </Badge>
      )
    case 'suspended':
      return (
        <Badge
          variant="outline"
          className="gap-1.5 border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-normal"
        >
          <PauseCircle className="size-3" aria-hidden="true" />
          Suspendido
        </Badge>
      )
    case 'failed':
      return (
        <Badge
          variant="outline"
          className="gap-1.5 border-destructive/25 bg-destructive/10 text-destructive text-xs font-normal"
        >
          <XCircle className="size-3" aria-hidden="true" />
          Error
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="gap-1 text-xs font-normal text-muted-foreground">
          {status}
        </Badge>
      )
  }
}

function TenantActions({ tenant }: { tenant: AdminTenant }) {
  const [isPending, startTransition] = useTransition()

  const handleToggleStatus = (newStatus: 'active' | 'suspended') => {
    startTransition(async () => {
      const res = await updateTenantStatusAction(tenant.id, newStatus)
      if (res.ok) {
        toast.success(
          newStatus === 'active'
            ? `Club "${tenant.name}" activado correctamente.`
            : `Club "${tenant.name}" suspendido.`,
        )
      } else {
        toast.error(res.error || 'No se pudo actualizar el estado del club.')
      }
    })
  }

  const handleRetry = () => {
    startTransition(async () => {
      const res = await retryTenantAction(tenant.id)
      if (res.ok) {
        toast.success(`Aprovisionamiento reintentado para "${tenant.name}".`)
      } else {
        toast.error(res.error || 'No se pudo reintentar el aprovisionamiento.')
      }
    })
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {/* Botón de reintento si está en estado fallido */}
      {tenant.status === 'failed' && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={isPending}
          className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          title="Reintentar aprovisionamiento"
        >
          {isPending ? (
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-3" aria-hidden="true" />
          )}
          <span>Reintentar</span>
        </Button>
      )}

      {/* Botón de suspender si está activo */}
      {tenant.status === 'active' && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleToggleStatus('suspended')}
          disabled={isPending}
          className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          title="Suspender club"
        >
          {isPending ? (
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          ) : (
            <PauseCircle className="size-3" aria-hidden="true" />
          )}
          <span>Suspender</span>
        </Button>
      )}

      {/* Botón de reactivar si está suspendido */}
      {tenant.status === 'suspended' && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleToggleStatus('active')}
          disabled={isPending}
          className="h-7 gap-1 px-2 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer"
          title="Activar club"
        >
          {isPending ? (
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          ) : (
            <PlayCircle className="size-3" aria-hidden="true" />
          )}
          <span>Activar</span>
        </Button>
      )}

      {/* Detalle del club: miembros */}
      <Link
        href={`/admin/clubes/${tenant.id}`}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'h-7 gap-1 border-primary/25 bg-primary/10 px-2 text-xs font-medium text-primary hover:bg-primary/15 hover:text-primary cursor-pointer',
        )}
        title={`Ver y agregar miembros de ${tenant.name}`}
      >
        <Users className="size-3" aria-hidden="true" />
        Miembros
        <ChevronRight className="size-3" aria-hidden="true" />
      </Link>
    </div>
  )
}

export function ClubTable({ tenants }: { tenants: AdminTenant[] }) {
  if (tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 p-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Building2 className="size-6" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <h3 className="text-base font-semibold text-foreground">No se encontraron clubes</h3>
          <p className="text-sm text-muted-foreground">
            No hay clubes registrados que coincidan con los criterios de búsqueda o filtro.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Listado de clubes e inquilinos de la plataforma</caption>
          <thead className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">
                Club
              </th>
              <th scope="col" className="hidden px-4 py-3 md:table-cell">
                Base de datos
              </th>
              <th scope="col" className="px-4 py-3">
                Estado
              </th>
              <th scope="col" className="hidden px-4 py-3 sm:table-cell">
                Fecha de alta
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="transition-colors hover:bg-muted/40">
                {/* Nombre y slug */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-display text-xs font-semibold text-primary">
                      {tenant.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <Link
                        href={`/admin/clubes/${tenant.id}`}
                        className="truncate font-medium text-foreground hover:underline"
                      >
                        {tenant.name}
                      </Link>
                      <code className="text-[11px] text-muted-foreground font-mono">
                        {tenant.slug}
                      </code>
                    </div>
                  </div>
                </td>

                {/* Base de datos */}
                <td className="hidden px-4 py-3 md:table-cell">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Database className="size-3.5 text-muted-foreground/70 shrink-0" aria-hidden="true" />
                    <span className="truncate">{tenant.database_name || `club_${tenant.slug}`}</span>
                  </div>
                </td>

                {/* Estado */}
                <td className="px-4 py-3">
                  <TenantStatusBadge status={tenant.status} />
                </td>

                {/* Fecha */}
                <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                  {formatShortDate(tenant.created_at)}
                </td>

                {/* Acciones */}
                <td className="px-4 py-3 text-right">
                  <TenantActions tenant={tenant} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

