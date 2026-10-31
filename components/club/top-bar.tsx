'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Bell, Check, ChevronsUpDown, House, LayoutGrid, LogOut, Plus, Search, Settings } from 'lucide-react'
import { ClubCrest, LogoMark } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logout, selectTenant } from '@/lib/auth'
import type { Schemas } from '@/lib/api/client'
import { CONFIG_PERMISSIONS, type SetupStep } from '@/lib/club-config'
import { QUICK_CREATE, getModule } from '@/lib/modules'
import { TENANTS } from '@/lib/tenants'
import { cn } from '@/lib/utils'
import { useClub } from './club-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { CommandPalette } from './command-palette'
import { SetupGuide } from './setup-guide'
import { Initials } from './shared'
import { useAlerts } from './use-alerts'

export function TopBar({
  userName,
  userRole,
  userTenants,
  setupSteps,
}: {
  userName: string
  userRole: string
  userTenants?: Schemas['TenantSummaryResource'][]
  /** Pasos de la configuración inicial; null si el usuario no configura el club. */
  setupSteps?: SetupStep[] | null
}) {
  const router = useRouter()
  const { tenant, modules, can, canSee } = useClub()
  const pathname = usePathname()
  const base = `/c/${tenant.slug}`
  const section = pathname.split('/')[3] ?? ''
  const current = getModule(section)
  const inConfig = section === 'configuracion'
  const showConfig = CONFIG_PERMISSIONS.some(can)
  const quickCreate = QUICK_CREATE.filter((q) => can(q.permission) && canSee(q.module))
  const [paletteOpen, setPaletteOpen] = useState(false)
  const alerts = useAlerts()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const CurrentIcon = current?.icon ?? (inConfig ? Settings : House)

  return (
    <header className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[120rem] items-center gap-1 px-3 sm:gap-2 sm:px-6 lg:px-10">
        <Link href={base} aria-label="Inicio del club" className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring">
          <LogoMark />
        </Link>

        <span className="hidden text-border sm:inline" aria-hidden="true">
          /
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="h-9 gap-2 px-2" />}
            aria-label="Cambiar de club"
          >
            <ClubCrest short={tenant.short} color={tenant.color} logoUrl={tenant.logoUrl} className="size-6 rounded-md text-[10px]" />
            <span className="hidden max-w-40 truncate font-medium md:inline">{tenant.name}</span>
            <span className="font-medium md:hidden">{tenant.short}</span>
            <ChevronsUpDown className="hidden size-3.5 text-muted-foreground sm:block" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Tus clubes</DropdownMenuLabel>
              {userTenants && userTenants.length > 0
                ? userTenants.map((t) => (
                    <DropdownMenuItem
                      key={t.slug}
                      onClick={async () => {
                        if (t.slug !== tenant.slug) {
                          const res = await selectTenant(t.slug)
                          if (res?.error) {
                            router.push(`/clubes?error=${encodeURIComponent(res.error)}`)
                          }
                        }
                      }}
                      className="gap-3 py-2 cursor-pointer"
                    >
                      <div className="flex size-7 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground uppercase">
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{t.name}</span>
                        <span className="truncate text-xs text-muted-foreground font-mono">{t.slug}</span>
                      </span>
                      {t.slug === tenant.slug && <Check className="size-4 text-primary" aria-hidden="true" />}
                    </DropdownMenuItem>
                  ))
                : TENANTS.map((t) => (
                    <DropdownMenuItem key={t.slug} render={<Link href={`/c/${t.slug}`} />} className="gap-3 py-2">
                      <ClubCrest short={t.short} color={t.color} className="size-7 rounded-md text-[10px]" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">{t.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{t.city}</span>
                      </span>
                      {t.slug === tenant.slug && <Check className="size-4 text-primary" aria-hidden="true" />}
                    </DropdownMenuItem>
                  ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/clubes" />}>
              <LayoutGrid className="size-4" aria-hidden="true" />
              Ver todos los clubes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="hidden text-border sm:inline" aria-hidden="true">
          /
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="h-9 gap-1.5 px-1.5 sm:gap-2 sm:px-2" />}
            aria-label={`Cambiar de módulo (ahora: ${current?.name ?? (inConfig ? 'Configuración' : 'Hoy')})`}
          >
            <CurrentIcon className="size-4 text-primary" aria-hidden="true" />
            <span className="hidden font-medium sm:inline">{current?.name ?? (inConfig ? 'Configuración' : 'Hoy')}</span>
            <ChevronsUpDown className="hidden size-3.5 text-muted-foreground sm:block" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[min(92vw,30rem)] p-2">
            <DropdownMenuItem render={<Link href={base} />} className="mb-1 gap-3 py-2">
              <House className="size-4" aria-hidden="true" />
              <span className="font-medium">Hoy en el club</span>
            </DropdownMenuItem>
            <div className="grid grid-cols-2 gap-1">
              {modules.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  render={<Link href={`${base}/${m.id}`} />}
                  className={cn('items-start gap-3 rounded-lg p-2.5', current?.id === m.id && 'bg-muted')}
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <m.icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-xs leading-snug text-muted-foreground text-pretty">{m.description}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </div>
            {showConfig && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={<Link href={`${base}/configuracion`} />}
                  className={cn('gap-3 py-2', inConfig && 'bg-muted')}
                >
                  <Settings className="size-4" aria-hidden="true" />
                  <span className="flex flex-col">
                    <span className="font-medium">Configuración del club</span>
                    <span className="text-xs text-muted-foreground">Perfil, deportes, temporadas y categorías</span>
                  </span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {setupSteps && <SetupGuide steps={setupSteps} club={tenant.slug} />}

          <Button
            variant="outline"
            onClick={() => setPaletteOpen(true)}
            className="h-9 gap-2 px-2.5 text-muted-foreground sm:w-56 sm:justify-start"
            aria-label="Buscar o ejecutar una acción"
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Buscar o ejecutar…</span>
            <kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-sans text-[10px] font-medium sm:inline">
              Ctrl K
            </kbd>
          </Button>

          {quickCreate.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button className="h-9 gap-1.5 px-2.5" />} aria-label="Crear">
                <Plus className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Crear</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Carga rápida</DropdownMenuLabel>
                  {quickCreate.map((q) => {
                    const Icon = getModule(q.module)!.icon
                    return (
                      <DropdownMenuItem key={q.module} render={<Link href={`${base}/${q.module}?nuevo=1`} />}>
                        <Icon className="size-4" aria-hidden="true" />
                        {q.label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="relative hidden size-9 sm:inline-flex" />}
              aria-label={`Alertas: ${alerts.length}`}
            >
              <Bell className="size-4" aria-hidden="true" />
              {alerts.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-warning ring-2 ring-card" aria-hidden="true" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Requiere atención</DropdownMenuLabel>
                {alerts.slice(0, 6).map((a) => (
                  <DropdownMenuItem key={a.id} render={<Link href={a.href} />} className="items-start gap-2.5 py-2">
                    <span
                      className={cn('mt-1.5 size-2 shrink-0 rounded-full', a.tone === 'bad' ? 'bg-destructive' : 'bg-warning')}
                      aria-hidden="true"
                    />
                    <span className="flex flex-col">
                      <span className="font-medium">{a.title}</span>
                      <span className="text-xs text-muted-foreground">{a.detail}</span>
                    </span>
                  </DropdownMenuItem>
                ))}
                {alerts.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">Todo en orden.</p>}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" className="h-9 gap-2 rounded-full px-0.5 lg:pr-3" />}
              aria-label={`Cuenta: ${userName}, ${userRole}`}
            >
              <Initials name={userName} className="size-8 bg-ink text-ink-foreground" />
              <span className="hidden max-w-44 flex-col items-start leading-tight lg:flex">
                <span className="max-w-full truncate text-xs font-medium">{userName}</span>
                <span className="max-w-full truncate text-[11px] font-normal text-muted-foreground">{userRole}</span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex flex-col gap-0.5 text-foreground">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs font-normal text-muted-foreground">{userRole}</span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => logout()}>
                <LogOut className="size-4" aria-hidden="true" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  )
}
