'use server'

import { runCall } from '@/lib/action-result'
import { listPlayers } from '@/lib/api/players'

/** Jugadores para la paleta de comandos (Ctrl K). */
export async function searchPlayersForPaletteAction(search: string): Promise<{ id: number; name: string; category: string | null }[]> {
  if (search.trim().length < 2) return []
  const result = await runCall(() => listPlayers({ search: search.trim(), per_page: 8 }))
  if (!result.ok) return []
  return result.data.data.map((p) => ({
    id: p.id,
    name: `${p.first_name} ${p.last_name}`,
    category: p.memberships?.find((m) => m.status === 'active')?.category_name ?? null,
  }))
}
