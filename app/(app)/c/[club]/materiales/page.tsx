import type { Metadata } from 'next'
import { MaterialsModule } from '@/components/club/inventory/materials-module'
import { NoAccess } from '@/components/club/no-access'
import { listBalances, listLocations, listMaterials, listMovements } from '@/lib/api/inventory'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Materiales — Sportiva' }

export default async function MaterialsPage({ params }: { params: Promise<{ club: string }> }) {
  const { club } = await params
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  const can = (p: string) => permissions.has(p)
  if (!can('inventory.view') && !can('materials.view')) return <NoAccess moduleName="Materiales" homeHref={`/c/${club}`} />

  const [materials, locations, balances, movements] = await Promise.all([
    listMaterials(),
    listLocations(),
    can('inventory.view') ? listBalances() : Promise.resolve(null),
    can('inventory.view') ? listMovements() : Promise.resolve(null),
  ])

  return (
    <MaterialsModule
      materials={materials.ok ? materials.data.data : []}
      locations={locations.ok ? locations.data.data : []}
      balances={balances?.ok ? balances.data.data : []}
      movements={movements?.ok ? movements.data.data : []}
      loadError={!materials.ok || !locations.ok}
      can={{
        viewStock: can('inventory.view'),
        adjust: can('inventory.adjust'),
        transfer: can('inventory.transfer'),
        createMaterial: can('materials.create'),
        updateMaterial: can('materials.update'),
        deleteMaterial: can('materials.delete'),
        createLocation: can('storage_locations.create'),
        updateLocation: can('storage_locations.update'),
        deleteLocation: can('storage_locations.delete'),
      }}
    />
  )
}
