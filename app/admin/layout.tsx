import Link from 'next/link'
import { ArrowLeft, LogOut, Shield } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { logout } from '@/lib/auth'
import { requirePlatformAdmin } from '@/lib/session'
import { listTickets } from '@/lib/api/admin'
import { AdminNav } from '@/components/admin/admin-nav'
import { cn } from '@/lib/utils'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requirePlatformAdmin()
  const newTickets = await listTickets('new')
  const newTicketsCount = newTickets.length

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
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
            <Link
              href="/clubes"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'gap-1.5 text-xs text-muted-foreground hover:text-foreground',
              )}
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Ir a</span> Clubes
            </Link>

            <div className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />

            <div className="hidden items-center gap-2 text-right sm:flex">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground">{session.user.name}</span>
                <span className="text-[10px] text-muted-foreground">{session.user.email}</span>
              </div>
            </div>

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

      <main className="flex-1">{children}</main>
    </div>
  )
}

