import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PrintHeader, PrintSheet } from '@/components/print/print-sheet'
import { PrintToolbar } from '@/components/print/print-toolbar'
import { listCategories, listCompetitions } from '@/lib/api/club'
import { listPlayers } from '@/lib/api/players'
import { allPages, fmtDate } from '@/lib/exports'
import { requireSession } from '@/lib/session'

export const metadata: Metadata = { title: 'Lista de buena fe — Sportiva' }

// Lista de buena fe de una categoría para la federación (FRO-29), lista para imprimir en A4.
export default async function GoodFaithListPage({ searchParams }: { searchParams: Promise<{ categoria?: string }> }) {
  const session = await requireSession()
  if (!session.tenant) notFound()
  const categoryId = Number((await searchParams).categoria)
  if (!categoryId) notFound()

  const [players, categories, competitions] = await Promise.all([
    allPages((page) => listPlayers({ category_id: categoryId, status: 'active', per_page: 100, page })),
    listCategories(),
    listCompetitions(),
  ])
  const category = categories.ok ? categories.data.data.find((c) => c.id === categoryId) : undefined
  if (!players || !category) notFound()
  const competitionNames = (competitions.ok ? competitions.data.data : []).filter((c) => c.categories?.some((x) => x.id === categoryId)).map((c) => c.name)

  const rows = players
    .map((p) => ({ p, number: p.memberships?.find((m) => m.category_id === categoryId)?.shirt_number ?? null }))
    .sort((a, b) => a.p.last_name.localeCompare(b.p.last_name, 'es') || a.p.first_name.localeCompare(b.p.first_name, 'es'))

  return (
    <PrintSheet>
      <PrintToolbar backHref={`/c/${session.tenant.slug}/jugadores?categoria=${categoryId}`} />
      <PrintHeader club={session.tenant.name} title={`Lista de buena fe · ${category.name}`} subtitle={competitionNames.length ? competitionNames.join(' · ') : undefined} />
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="w-8 py-1.5 pr-2">#</th>
            <th className="py-1.5 pr-2">Apellido y nombre</th>
            <th className="py-1.5 pr-2">DNI</th>
            <th className="py-1.5 pr-2">Nacimiento</th>
            <th className="py-1.5 pr-2">N.º</th>
            <th className="py-1.5">Ficha federativa</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ p, number }, i) => (
            <tr key={p.id} className="border-b border-black/20">
              <td className="py-1.5 pr-2 tabular-nums">{i + 1}</td>
              <td className="py-1.5 pr-2">
                {p.last_name}, {p.first_name}
              </td>
              <td className="py-1.5 pr-2 tabular-nums">{p.document_number ?? ''}</td>
              <td className="py-1.5 pr-2 tabular-nums">{fmtDate(p.birth_date)}</td>
              <td className="py-1.5 pr-2 tabular-nums">{number ?? ''}</td>
              <td className="py-1.5 tabular-nums">{p.registration_number ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs">{rows.length} jugadores.</p>
      <div className="mt-16 grid grid-cols-2 gap-12 text-center text-xs">
        <div className="border-t border-black pt-1">Firma y aclaración del delegado</div>
        <div className="border-t border-black pt-1">Sello del club</div>
      </div>
    </PrintSheet>
  )
}
