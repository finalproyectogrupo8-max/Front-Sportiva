import { LogOut } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/auth'
import { requirePlatformAdmin } from '@/lib/session'

// Punto de entrada del admin de plataforma después del login.
// El panel (usuarios, clubes y membresías) se arma en FRO-5, FRO-6 y FRO-7.
export default async function AdminPage() {
  const session = await requirePlatformAdmin()

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Logo />
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <LogOut className="size-4" aria-hidden="true" />
            Salir
          </Button>
        </form>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col gap-2 px-6 pb-16 pt-8">
        <p className="text-sm text-muted-foreground">Hola, {session.user.name}</p>
        <h1 className="font-display text-5xl font-bold uppercase leading-none text-balance">Administración</h1>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          Desde acá vas a dar de alta usuarios y clubes, y asociar usuarios a cada club.
        </p>
      </section>
    </main>
  )
}
