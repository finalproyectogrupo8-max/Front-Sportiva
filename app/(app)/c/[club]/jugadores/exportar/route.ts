import { listCategories } from '@/lib/api/club'
import { listPlayers } from '@/lib/api/players'
import { csvResponse } from '@/lib/csv'
import { allPages, fmtDate } from '@/lib/exports'

// Plantel de una categoría como lista de buena fe (FRO-29). Usa el token del usuario: la API aplica
// sus permisos y alcance (un profe solo exporta sus categorías).
export async function GET(request: Request): Promise<Response> {
  const categoryId = Number(new URL(request.url).searchParams.get('categoria'))
  if (!categoryId) return new Response('Elegí una categoría.', { status: 400 })

  const [players, categories] = await Promise.all([
    allPages((page) => listPlayers({ category_id: categoryId, status: 'active', per_page: 100, page })),
    listCategories(),
  ])
  if (!players) return new Response('No se pudo leer el plantel.', { status: 502 })
  const category = categories.ok ? categories.data.data.find((c) => c.id === categoryId) : undefined

  const rows = players
    .map((p) => ({ p, number: p.memberships?.find((m) => m.category_id === categoryId)?.shirt_number ?? null }))
    .sort((a, b) => a.p.last_name.localeCompare(b.p.last_name, 'es') || a.p.first_name.localeCompare(b.p.first_name, 'es'))

  return csvResponse(
    [
      ['Apellido', 'Nombre', 'DNI', 'Fecha de nacimiento', 'Número', 'Ficha federativa', 'Categoría'],
      ...rows.map(({ p, number }) => [p.last_name, p.first_name, p.document_number, fmtDate(p.birth_date), number, p.registration_number, category?.name ?? '']),
    ],
    `lista-buena-fe-${category?.name ?? categoryId}.csv`,
  )
}
