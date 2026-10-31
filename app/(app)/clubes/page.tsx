import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogOut, Plus, Settings2, ShieldAlert } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/brand/logo'
import { ClubSelector } from '@/components/club/club-selector'
import { Button, buttonVariants } from '@/components/ui/button'
import { logout } from '@/lib/auth'
import { requireSession } from '@/lib/session'
import { cn } from '@/lib/utils'

export default async function ClubesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await requireSession()
  const { error } = await searchParams

  // Caso 1 club: entra directo a /c/<slug> sin ver el selector, resuelto en el servidor sin parpadeo.
  // Si vino un error (ej. tenant_inactive o membership_inactive), no redirigimos para no entrar en bucle.
  if (session.tenants.length === 1 && !error) {
    redirect(`/clubes/select?tenant=${encodeURIComponent(session.tenants[0].slug)}`)
  }

  const hasNoTenants = session.tenants.length === 0

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-[120rem] items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-10">
        <Logo />
        <nav aria-label="Navegación de la plataforma" className="flex items-center gap-2">
          {session.user.is_platform_admin && (
            <Link
              href="/admin"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}
            >
              <Settings2 className="size-4" aria-hidden="true" />
              Administración
            </Link>
          )}
          <ThemeToggle />
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <LogOut className="size-4" aria-hidden="true" />
              Salir
            </Button>
          </form>
        </nav>
      </header>

      <section className="mx-auto flex max-w-[120rem] flex-col gap-10 px-4 pb-16 pt-8 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Hola, {session.user.name}</p>
          <h1 className="font-display text-5xl font-bold uppercase leading-none text-balance">
            {hasNoTenants ? 'Sin clubes asignados' : '¿A qué club entrás hoy?'}
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            {hasNoTenants
              ? 'Tu cuenta no tiene acceso activo a ningún club en este momento.'
              : 'Cada club tiene su propio espacio en Sportiva: sus datos, sus colores y su equipo de trabajo.'}
          </p>
        </div>

        {hasNoTenants ? (
          <div className="flex max-w-lg flex-col items-start gap-4 rounded-2xl border bg-card p-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ShieldAlert className="size-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">No tenés clubes asignados</h2>
              <p className="text-sm text-muted-foreground">
                Para ingresar a un club, un administrador de la plataforma debe asignarte una membresía activa.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <form action={logout}>
                <Button type="submit" variant="outline" size="sm">
                  Cerrar sesión
                </Button>
              </form>
              {session.user.is_platform_admin && (
                <Link
                  href="/admin"
                  className={buttonVariants({ variant: 'default', size: 'sm' })}
                >
                  Ir a administración
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <ClubSelector tenants={session.tenants} initialError={error} />

            {session.user.is_platform_admin && (
              <div className="flex max-w-sm">
                <Link
                  href="/admin"
                  className="flex w-full min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-5 text-center text-sm transition hover:border-primary hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Plus className="size-5 text-muted-foreground" aria-hidden="true" />
                  <span className="font-medium text-foreground">Sumar un club</span>
                  <span className="text-xs text-muted-foreground">Alta de nuevos clubes desde administración central.</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
