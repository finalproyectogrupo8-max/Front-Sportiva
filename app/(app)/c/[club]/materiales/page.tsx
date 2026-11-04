import type { Metadata } from 'next'
import { MaterialsModule } from '@/components/club/inventory/materials-module'
import { NoAccess } from '@/components/club/no-access'
import { canOpenModule } from '@/lib/modules'
import { listCategories } from '@/lib/api/club'
import { listBalances, listLocations, listMaterials, listMovements } from '@/lib/api/inventory'
import { listOrders } from '@/lib/api/orders'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Materiales — Sportiva' }

const skip = Promise.resolve(null)

/**
 * Materiales: el stock (inventory.view), el catálogo (materials.view) y los pedidos
 * (material_orders.view). Cada parte se carga y se muestra solo con su permiso: el profe
 * entra solo a pedir materiales para sus categorías.
 */
export default async function MaterialsPage({ params, searchParams }: { params: Promise<{ club: string }>; searchParams: Promise<{ pedido?: string; nuevo?: string }> }) {
  const { club } = await params
  const query = await searchParams
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  const can = (p: string) => permissions.has(p)
  const viewStock = can('inventory.view')
  const viewCatalog = can('materials.view')
  const viewOrders = can('material_orders.view')
  if (!canOpenModule('materiales', session.permissions ?? [])) return <NoAccess moduleName="Materiales" homeHref={`/c/${club}`} />

  const orderCan = {
    create: can('material_orders.create'),
    update: can('material_orders.update'),
    delete: can('material_orders.delete'),
    approve: can('material_orders.approve'),
    deliver: can('material_orders.deliver'),
  }
  const seesLocations = viewStock || can('storage_locations.view')

  const [materials, locations, balances, movements, orders, categories] = await Promise.all([
    viewStock || viewCatalog || orderCan.create ? listMaterials() : skip,
    seesLocations ? listLocations() : skip,
    viewStock ? listBalances() : skip,
    viewStock ? listMovements() : skip,
    viewOrders ? listOrders({ type: 'material', per_page: 100 }) : skip,
    orderCan.create ? listCategories() : skip,
  ])

  return (
    <MaterialsModule
      materials={materials?.ok ? materials.data.data : []}
      locations={locations?.ok ? locations.data.data : []}
      balances={balances?.ok ? balances.data.data : []}
      movements={movements?.ok ? movements.data.data : []}
      orders={orders?.ok ? orders.data.data : []}
      categories={categories?.ok ? categories.data.data.filter((c) => c.is_active).map((c) => ({ id: c.id, name: c.name })) : []}
      openOrderId={Number(query.pedido) || null}
      startNew={query.nuevo === '1'}
      loadError={(materials !== null && !materials.ok) || (locations !== null && !locations.ok) || (orders !== null && !orders.ok)}
      can={{
        viewStock,
        viewCatalog,
        viewOrders,
        orders: orderCan,
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
