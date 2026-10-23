import Link from 'next/link'
import { ArrowUpRight, LogOut, Plus } from 'lucide-react'
import { ClubCrest, Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/auth'
import { requireSession } from '@/lib/session'
import { TENANTS } from '@/lib/tenants'

export default async function ClubesPage() {
  const session = await requireSession()

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

      <section className="mx-auto flex max-w-5xl flex-col gap-10 px-6 pb-16 pt-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Hola, {session.user.name}</p>
          <h1 className="font-display text-5xl font-bold uppercase leading-none text-balance">¿A qué club entrás hoy?</h1>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            Cada club tiene su propio espacio en Tribuna: sus datos, sus colores y su equipo de trabajo.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TENANTS.map((t, i) => (
            <li key={t.slug} className="animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
              <Link
                href={`/c/${t.slug}`}
                className="group relative flex h-full flex-col gap-6 overflow-hidden rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: t.color }} aria-hidden="true" />
                <div className="flex items-start justify-between">
                  <ClubCrest short={t.short} color={t.color} className="size-12 text-base" />
                  <ArrowUpRight
                    className="size-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="font-display text-2xl font-bold uppercase leading-tight">{t.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t.city} · Fundado en {t.founded}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between border-t pt-4 text-sm">
                  <span className="text-muted-foreground">{t.sports.join(' · ')}</span>
                  <span className="font-medium tabular-nums">{t.members.toLocaleString('es-AR')} socios</span>
                </div>
              </Link>
            </li>
          ))}
          <li>
            <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">
              <Plus className="size-5" aria-hidden="true" />
              <span className="font-medium text-foreground">Sumar un club</span>
              <span>Alta de nuevos clubes desde administración central.</span>
            </div>
          </li>
        </ul>
      </section>
    </main>
  )
}
