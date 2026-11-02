import Link from 'next/link'
import { LogOut, Shield } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { AppFooter } from '@/components/app-footer'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { logout } from '@/lib/auth'
import { requirePlatformAdmin } from '@/lib/session'
import { getAdminTickets } from '@/lib/api/admin'
import { AdminNav } from '@/components/admin/admin-nav'
import { ProvisioningWatcher } from '@/components/admin/provisioning-watcher'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requirePlatformAdmin()
  let newTicketsCount = 0
  try {
    const newTicketsRes = await getAdminTickets({ status: 'new', per_page: 1 })
    if (newTicketsRes.ok) {
      newTicketsCount = newTicketsRes.data.meta.total
    }
  } catch {
    // Si la API falla, mantenemos el contador en 0 para no romper el layout
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[120rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Logo />
              <Badge variant="secondary" className="gap-1 border font-medium">
                <Shield className="size-3 text-primary" aria-hidden="true" />
                Admin
              </Badge>
            </Link>

            <div className="hidden h-5 w-px bg-border md:block" aria-hidden="true" />

            <div className="hidden md:block">
              <AdminNav newTicketsCount={newTicketsCount} />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 text-right sm:flex">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">{session.user.name}</span>
                <span className="text-[10px] text-muted-foreground">{session.user.email}</span>
              </div>
            </div>

            <Link href="/perfil?volver=/admin" className="text-xs text-muted-foreground hover:text-foreground">
              Mi perfil
            </Link>

            <ThemeToggle />

            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Navegación móvil */}
        <div className="border-t px-4 py-2 md:hidden">
          <AdminNav newTicketsCount={newTicketsCount} />
        </div>
      </header>

      <main className="flex-1">
        <ProvisioningWatcher>{children}</ProvisioningWatcher>
      </main>
      <AppFooter />
    </div>
  )
}

