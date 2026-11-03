'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronRight, UserRound } from 'lucide-react'
import { EmptyConfig } from '@/components/club/empty-state'
import { Pill } from '@/components/club/shared'
import type { Player } from '@/lib/api/players'
import { PLAYER_STATUS, photoUrl } from '@/lib/player-labels'
import { PlayerAvatar } from './player-avatar'

export function PlayersTable({
  club,
  players,
  filtered,
  canCreate,
}: {
  club: string
  players: Player[]
  filtered: boolean
  canCreate: boolean
}) {
  const params = useSearchParams()
  const hrefFor = (id: number) => {
    const sp = new URLSearchParams(params.toString())
    sp.set('id', String(id))
    return `?${sp.toString()}`
  }

  if (players.length === 0) {
    return (
      <EmptyConfig
        icon={UserRound}
        title={filtered ? 'No hay jugadores con estos filtros' : 'Todavía no hay jugadores'}
        description={
          filtered
            ? 'Probá con otra búsqueda, categoría o estado.'
            : canCreate
              ? 'Cargá la primera ficha con "Nueva ficha": nombre, fecha de nacimiento y categoría.'
              : 'Cuando el club cargue jugadores en tus categorías, aparecen acá.'
        }
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <table className="w-full text-sm">
        <caption className="sr-only">Listado de jugadores</caption>
        <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">Jugador</th>
            <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">Edad</th>
            <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">Categoría</th>
            <th scope="col" className="hidden px-4 py-2.5 font-medium lg:table-cell">Puesto</th>
            <th scope="col" className="px-4 py-2.5 font-medium">Estado</th>
            <th scope="col" className="w-8 px-2 py-2.5"><span className="sr-only">Abrir</span></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {players.map((p) => {
            const status = PLAYER_STATUS[p.status] ?? { label: p.status, tone: 'neutral' as const }
            const categories = (p.memberships ?? []).map((m) => m.category_name).filter(Boolean).join(', ')
            const number = p.memberships?.find((m) => m.shirt_number != null)?.shirt_number
            return (
              <tr key={p.id} className="group relative transition-colors hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Link href={hrefFor(p.id)} scroll={false} className="flex items-center gap-3 after:absolute after:inset-0">
                    <PlayerAvatar first={p.first_name} last={p.last_name} src={photoUrl(club, p.photo_document_id)} number={number} />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium">
                        {p.last_name}, {p.first_name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground md:hidden">
                        {[categories, p.age != null ? `${p.age} años` : null].filter(Boolean).join(' · ') || 'Sin categoría'}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="hidden px-4 py-3 tabular-nums sm:table-cell">{p.age ?? '—'}</td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {categories || <span className="text-muted-foreground">Sin categoría</span>}
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">{p.preferred_position ?? '—'}</td>
                <td className="px-4 py-3">
                  <Pill tone={status.tone}>{status.label}</Pill>
                </td>
                <td className="px-2 py-3 text-muted-foreground">
                  <ChevronRight className="size-4" aria-hidden="true" />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
