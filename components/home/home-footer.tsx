import Link from 'next/link'
import { ArrowRight, LayoutDashboard, LogIn } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HomeFooterProps {
  hasSession: boolean
}

export function HomeFooter({ hasSession }: HomeFooterProps) {
  return (
    <>
      {/* Banner CTA Final */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-ink p-8 sm:p-12 lg:p-16 text-ink-foreground shadow-2xl">
          <div className="absolute -right-20 -top-20 size-80 rounded-full bg-brand/20 blur-3xl" aria-hidden="true" />
          <div className="absolute -left-20 -bottom-20 size-80 rounded-full bg-brand/10 blur-3xl" aria-hidden="true" />

          <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto gap-6">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Gestión deportiva al día
            </span>
            <h2 className="font-display text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl lg:text-6xl leading-[0.95]">
              Entrá a tu club
            </h2>
            <p className="text-base text-ink-foreground/80 leading-relaxed">
              Sumate a la plataforma pensada para ordenar la operación de cada fecha, cada entrenamiento y cada disciplina.
            </p>

            <div className="pt-2">
              {hasSession ? (
                <Link
                  href="/clubes"
                  className={cn(
                    buttonVariants({ variant: 'default', size: 'lg' }),
                    'h-12 px-8 gap-2 bg-brand text-brand-foreground hover:bg-brand/90 font-medium text-base shadow-lg',
                  )}
                >
                  <LayoutDashboard className="size-5" aria-hidden="true" />
                  <span>Ir a mis clubes</span>
                  <ArrowRight className="size-5" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: 'default', size: 'lg' }),
                    'h-12 px-8 gap-2 bg-brand text-brand-foreground hover:bg-brand/90 font-medium text-base shadow-lg',
                  )}
                >
                  <LogIn className="size-5" aria-hidden="true" />
                  <span>Ingresar al sistema</span>
                  <ArrowRight className="size-5" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer principal */}
      <footer className="border-t border-border/60 bg-muted/30 py-12 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>

            <nav aria-label="Enlaces del pie de página" className="flex flex-wrap items-center gap-6 text-sm">
              <a href="#funciones" className="transition hover:text-foreground">
                Funciones
              </a>
              <a href="#nosotros" className="transition hover:text-foreground">
                Quiénes somos
              </a>
              <a href="#contacto" className="transition hover:text-foreground">
                Contacto
              </a>
              <Link href="/login" className="font-medium text-foreground transition hover:text-brand">
                Ingresar
              </Link>
            </nav>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/40 pt-6 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
            <p>© 2026 Sportiva · Gestión operativa para clubes</p>
            <p>Plataforma integral para instituciones deportivas</p>
          </div>
        </div>
      </footer>
    </>
  )
}
