import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PrintHeader, PrintSheet } from '@/components/print/print-sheet'
import { PrintToolbar } from '@/components/print/print-toolbar'
import { getOrder } from '@/lib/api/orders'
import { fmtDate } from '@/lib/exports'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Pedido de indumentaria — Sportiva' }

// Pedido de indumentaria para el proveedor (FRO-29): talles, números y alias, en A4.
export default async function PrintOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession()
  if (!session.tenant) notFound()
  const order = await getOrder(Number((await params).id))
  if (!order.ok) notFound()
  const o = order.data.data
  const lines = [...(o.apparel_order_items ?? [])].sort(
    (a, b) => (a.apparel_item?.name ?? '').localeCompare(b.apparel_item?.name ?? '', 'es') || (Number(a.shirt_number) || 999) - (Number(b.shirt_number) || 999),
  )
  // Resumen por prenda y talle: lo que el proveedor tiene que fabricar.
  const totals = new Map<string, number>()
  for (const l of lines) {
    const key = `${l.apparel_item?.name ?? 'Prenda'} · ${l.size ?? 'Sin talle'}`
    totals.set(key, (totals.get(key) ?? 0) + Number(l.quantity))
  }

  return (
    <PrintSheet>
      <PrintToolbar backHref={`/c/${session.tenant.slug}/indumentaria?pedido=${o.id}`} />
      <PrintHeader
        club={session.tenant.name}
        title={`Pedido ${o.order_number}`}
        subtitle={[o.category?.name, o.created_at ? `Pedido el ${fmtDate(o.created_at)}` : null].filter(Boolean).join(' · ')}
      />
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1.5 pr-2">Prenda</th>
            <th className="py-1.5 pr-2">Jugador</th>
            <th className="py-1.5 pr-2">Talle</th>
            <th className="py-1.5 pr-2">N.º</th>
            <th className="py-1.5 pr-2">Alias</th>
            <th className="py-1.5 text-right">Cant.</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id} className="border-b border-black/20">
              <td className="py-1.5 pr-2">{l.apparel_item?.name}</td>
              <td className="py-1.5 pr-2">{l.player ? `${l.player.last_name}, ${l.player.first_name}` : ''}</td>
              <td className="py-1.5 pr-2 font-semibold">{l.size}</td>
              <td className="py-1.5 pr-2 tabular-nums">{l.shirt_number ?? ''}</td>
              <td className="py-1.5 pr-2 uppercase">{l.alias ?? ''}</td>
              <td className="py-1.5 text-right tabular-nums">{Number(l.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-6 mb-2 text-sm font-bold">Totales por prenda y talle</h2>
      <table className="w-auto border-collapse">
        <tbody>
          {[...totals].map(([key, qty]) => (
            <tr key={key} className="border-b border-black/20">
              <td className="py-1 pr-6">{key}</td>
              <td className="py-1 text-right tabular-nums font-semibold">{qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {o.description && <p className="mt-4 text-sm">Notas: {o.description}</p>}
    </PrintSheet>
  )
}
