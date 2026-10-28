'use client'

import { useRouter } from 'next/navigation'
import { House, Plus, UserRound } from 'lucide-react'
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
import { ClubCrest } from '@/components/brand/logo'
import { MODULES } from '@/lib/modules'
import { TENANTS } from '@/lib/tenants'
import { useClub } from './club-provider'

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter()
  const { tenant, data } = useClub()
  const base = `/c/${tenant.slug}`

  const go = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Buscar en Sportiva" description="Módulos, jugadores y acciones">
      <Command>
        <CommandInput placeholder="Buscá un jugador, módulo o acción…" />
        <CommandList className="max-h-96">
          <CommandEmpty>Sin resultados.</CommandEmpty>
          <CommandGroup heading="Ir a">
            <CommandItem onSelect={() => go(base)}>
              <House aria-hidden="true" />
              Hoy en el club
            </CommandItem>
            {MODULES.map((m) => (
              <CommandItem key={m.id} value={`${m.name} ${m.description}`} onSelect={() => go(`${base}/${m.id}`)}>
                <m.icon aria-hidden="true" />
                {m.name}
                <span className="ml-auto truncate text-xs text-muted-foreground">{m.description}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Acciones">
            {[
              ['indumentaria', 'Nuevo pedido de indumentaria'],
              ['materiales', 'Solicitar reposición de materiales'],
              ['partidos', 'Cargar partido'],
              ['jugadores', 'Nueva ficha de jugador'],
              ['canchas', 'Reportar problema en cancha'],
            ].map(([mod, label]) => (
              <CommandItem key={mod} onSelect={() => go(`${base}/${mod}?nuevo=1`)}>
                <Plus aria-hidden="true" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Jugadores">
            {data.players.map((p) => (
              <CommandItem
                key={p.id}
                value={`${p.nombre} ${p.apellido} ${p.alias} ${p.puesto} ${p.deporte} ${p.categoria}`}
                onSelect={() => go(`${base}/jugadores?id=${p.id}`)}
              >
                <UserRound aria-hidden="true" />
                {p.nombre} {p.apellido}
                <span className="ml-auto text-xs text-muted-foreground">
                  {p.deporte} · {p.categoria} · #{p.numero}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Cambiar de club">
            {TENANTS.filter((t) => t.slug !== tenant.slug).map((t) => (
              <CommandItem key={t.slug} value={`club ${t.name}`} onSelect={() => go(`/c/${t.slug}`)}>
                <ClubCrest short={t.short} color={t.color} className="size-5 rounded text-[8px]" />
                {t.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
