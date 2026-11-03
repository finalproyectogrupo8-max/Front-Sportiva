'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftRight, House, Plus, Settings, UserRound } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Command } from '@/components/ui/command'
import { CONFIG_PERMISSIONS } from '@/lib/club-config'
import { QUICK_CREATE } from '@/lib/modules'
import { searchPlayersForPaletteAction } from '@/app/(app)/c/[club]/search-actions'
import { useClub } from './club-provider'

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter()
  const { tenant, modules, can, canSee } = useClub()
  const [query, setQuery] = useState('')
  const [players, setPlayers] = useState<{ id: number; name: string; category: string | null }[]>([])
  const searchPlayers = canSee('jugadores') && query.trim().length >= 2

  // Los jugadores se buscan en la API mientras se escribe.
  useEffect(() => {
    if (!searchPlayers) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const found = await searchPlayersForPaletteAction(query)
      if (!cancelled) setPlayers(found)
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, searchPlayers])

  const actions = QUICK_CREATE.filter((q) => can(q.permission) && canSee(q.module))
  const base = `/c/${tenant.slug}`

  const go = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Buscar en Sportiva" description="Módulos, jugadores y acciones">
      <Command>
        <CommandInput placeholder="Buscá un jugador, módulo o acción…" value={query} onValueChange={setQuery} />
        <CommandList className="max-h-96">
          <CommandEmpty>Sin resultados.</CommandEmpty>
          <CommandGroup heading="Ir a">
            <CommandItem onSelect={() => go(base)}>
              <House aria-hidden="true" />
              Hoy en el club
            </CommandItem>
            {modules.map((m) => (
              <CommandItem key={m.id} value={`${m.name} ${m.description}`} onSelect={() => go(`${base}/${m.id}`)}>
                <m.icon aria-hidden="true" />
                {m.name}
                <span className="ml-auto truncate text-xs text-muted-foreground">{m.description}</span>
              </CommandItem>
            ))}
            {CONFIG_PERMISSIONS.some(can) && (
              <CommandItem value="Configuración del club perfil deportes temporadas categorías" onSelect={() => go(`${base}/configuracion`)}>
                <Settings aria-hidden="true" />
                Configuración del club
              </CommandItem>
            )}
          </CommandGroup>
          {actions.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Acciones">
                {actions.map((q) => (
                  <CommandItem key={q.module} onSelect={() => go(`${base}/${q.module}?nuevo=1`)}>
                    <Plus aria-hidden="true" />
                    {q.action}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          {searchPlayers && players.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Jugadores">
                {players.map((p) => (
                  // El valor incluye lo que se escribió: la API ya filtró (también por documento).
                  <CommandItem key={p.id} value={`jugador ${p.id} ${p.name} ${query}`} onSelect={() => go(`${base}/jugadores?id=${p.id}`)}>
                    <UserRound aria-hidden="true" />
                    {p.name}
                    {p.category && <span className="ml-auto text-xs text-muted-foreground">{p.category}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          <CommandSeparator />
          <CommandGroup heading="Club">
            <CommandItem value="cambiar de club clubes" onSelect={() => go('/clubes')}>
              <ArrowLeftRight aria-hidden="true" />
              Cambiar de club
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
