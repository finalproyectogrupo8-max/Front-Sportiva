'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, House, Menu, Settings, Users } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CONFIG_PERMISSIONS } from '@/lib/club-config'
import { cn } from '@/lib/utils'
import { useClub } from './club-provider'

/**
 * Navegación del celular (FRO-38): barra inferior con Hoy, Calendario, Jugadores y Más.
 * Cada botón aparece solo si el usuario ve ese módulo; "Más" abre el resto.
 */
export function MobileNav() {
  const { tenant, modules, can, canSee } = useClub()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const base = `/c/${tenant.slug}`
  const section = pathname.split('/')[3] ?? ''

  const main = [
    { id: '', label: 'Hoy', icon: House, href: base, show: true },
    { id: 'partidos', label: 'Calendario', icon: CalendarDays, href: `${base}/partidos`, show: canSee('partidos') },
    { id: 'jugadores', label: 'Jugadores', icon: Users, href: `${base}/jugadores`, show: canSee('jugadores') },
  ].filter((i) => i.show)
  const mainIds = new Set(main.map((i) => i.id))
  const rest = modules.filter((m) => !mainIds.has(m.id))
  const showConfig = CONFIG_PERMISSIONS.some(can)
  const inRest = !mainIds.has(section)

  return (
    <>
      {/* Lugar para que la barra no tape el final de la página. */}
      <div className="h-16 md:hidden" aria-hidden="true" />
      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="grid h-16" style={{ gridTemplateColumns: `repeat(${main.length + 1}, minmax(0, 1fr))` }}>
          {main.map((item) => {
            const active = section === item.id
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium', active ? 'text-primary' : 'text-muted-foreground')}
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            )
          })}
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cn('flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium', inRest ? 'text-primary' : 'text-muted-foreground')}
            >
              <Menu className="size-5" aria-hidden="true" />
              Más
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>Módulos</SheetTitle>
          </SheetHeader>
          <ul className="grid grid-cols-2 gap-2 p-4">
            {rest.map((m) => (
              <li key={m.id}>
                <Link
                  href={`${base}/${m.id}`}
                  onClick={() => setOpen(false)}
                  className={cn('flex h-full items-start gap-3 rounded-xl border bg-card p-3', section === m.id && 'border-primary/50 bg-primary/5')}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <m.icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{m.name}</span>
                    <span className="text-xs leading-snug text-muted-foreground">{m.description}</span>
                  </span>
                </Link>
              </li>
            ))}
            {showConfig && (
              <li className="col-span-2">
                <Link
                  href={`${base}/configuracion`}
                  onClick={() => setOpen(false)}
                  className={cn('flex items-center gap-3 rounded-xl border bg-card p-3', section === 'configuracion' && 'border-primary/50 bg-primary/5')}
                >
                  <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium">Configuración del club</span>
                </Link>
              </li>
            )}
            {rest.length === 0 && !showConfig && <li className="col-span-2 text-sm text-muted-foreground">No hay más módulos para tu rol.</li>}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  )
}
