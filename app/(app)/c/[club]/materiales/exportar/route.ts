import { listBalances } from '@/lib/api/inventory'
import { csvResponse } from '@/lib/csv'
import { allPages } from '@/lib/exports'

// Stock actual por depósito (FRO-29).
export async function GET(): Promise<Response> {
  const balances = await allPages((page) => listBalances(page))
  if (!balances) return new Response('No se pudo leer el stock.', { status: 502 })

  const rows = [...balances].sort(
    (a, b) => (a.location?.name ?? '').localeCompare(b.location?.name ?? '', 'es') || (a.material?.name ?? '').localeCompare(b.material?.name ?? '', 'es'),
  )
  return csvResponse(
    [
      ['Depósito', 'Material', 'Unidad', 'Cantidad', 'Mínimo', 'Bajo el mínimo'],
      ...rows.map((b) => [b.location?.name, b.material?.name, b.material?.unit, Number(b.quantity), b.material?.minimum_stock ?? '', b.is_below_minimum ? 'Sí' : 'No']),
    ],
    `stock-${new Date().toISOString().slice(0, 10)}.csv`,
  )
}
