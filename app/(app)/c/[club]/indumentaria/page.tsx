import type { Metadata } from 'next'
import { ApparelModule } from '@/components/club/apparel/apparel-module'
import { NoAccess } from '@/components/club/no-access'
import { canOpenModule } from '@/lib/modules'
import { listCategories } from '@/lib/api/club'
import { listApparelItems, listOrders } from '@/lib/api/orders'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Indumentaria — Sportiva' }

export default async function ApparelPage({
  params,
  searchParams,
}: {
  params: Promise<{ club: string }>
  searchParams: Promise<{ pedido?: string; nuevo?: string }>
}) {
  const { club } = await params
  const query = await searchParams
  const session = await requireSession()
  const permissions = new Set(session.permissions ?? [])
  const can = (p: string) => permissions.has(p)
  if (!canOpenModule('indumentaria', session.permissions ?? [])) return <NoAccess moduleName="Indumentaria" homeHref={`/c/${club}`} />

  const [orders, items, categories] = await Promise.all([
    can('apparel_orders.view') ? listOrders({ type: 'apparel', per_page: 100 }) : Promise.resolve(null),
    listApparelItems(),
    listCategories(),
  ])

  return (
    <ApparelModule
      orders={orders?.ok ? orders.data.data : []}
      items={items.ok ? items.data.data : []}
      categories={categories.ok ? categories.data.data.filter((c) => c.is_active).map((c) => ({ id: c.id, name: c.name })) : []}
      openOrderId={Number(query.pedido) || null}
      startNew={query.nuevo === '1'}
      can={{
        viewOrders: can('apparel_orders.view'),
        create: can('apparel_orders.create'),
        update: can('apparel_orders.update'),
        delete: can('apparel_orders.delete'),
        approve: can('apparel_orders.approve'),
        deliver: can('apparel_orders.deliver'),
        createItem: can('apparel_items.create'),
        updateItem: can('apparel_items.update'),
        deleteItem: can('apparel_items.delete'),
        announce: can('announcements.send'),
      }}
    />
  )
}
