import type { Metadata } from 'next'
import { FacilitiesModule } from '@/components/club/facilities/facilities-module'
import { NoAccess } from '@/components/club/no-access'
import { canOpenModule } from '@/lib/modules'
import { listClubUsers, listFacilities, listMaintenance, listRepairs } from '@/lib/api/facilities'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Canchas — Sportiva' }

export default async function FacilitiesPage({ params, searchParams }: { params: Promise<{ club: string }>; searchParams: Promise<{ reparacion?: string; nuevo?: string }> }) {
  const { club } = await params
  const query = await searchParams
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  const can = (p: string) => permissions.has(p)
  if (!canOpenModule('canchas', session.permissions ?? [])) return <NoAccess moduleName="Canchas" homeHref={`/c/${club}`} />

  const [facilities, repairs, maintenance, users] = await Promise.all([
    listFacilities(),
    can('repairs.view') ? listRepairs() : Promise.resolve(null),
    can('maintenance.view') ? listMaintenance() : Promise.resolve(null),
    listClubUsers().catch(() => null),
  ])

  return (
    <FacilitiesModule
      facilities={facilities.ok ? facilities.data.data : []}
      repairs={repairs?.ok ? repairs.data.data : []}
      maintenance={maintenance?.ok ? maintenance.data.data : []}
      users={users?.ok ? users.data.data : []}
      openRepairId={Number(query.reparacion) || null}
      startReport={query.nuevo === '1'}
      can={{
        viewRepairs: can('repairs.view'),
        viewMaintenance: can('maintenance.view'),
        createFacility: can('facilities.create'),
        updateFacility: can('facilities.update'),
        deleteFacility: can('facilities.delete'),
        report: can('repairs.create'),
        assign: can('repairs.assign'),
        resolve: can('repairs.update'),
      }}
    />
  )
}
