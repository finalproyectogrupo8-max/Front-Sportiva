import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowRight, LayoutDashboard, LogIn, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeroSectionProps {
  hasSession: boolean
}

export function HeroSection({ hasSession }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-ink py-24 sm:py-32 lg:py-40 text-ink-foreground">
      {/* Imagen de fondo optimizada con next/image */}
      <Image
        src="/images/club-gym.png"
        alt="Instalaciones deportivas y cancha del club"
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-25"
      />
      {/* Degradados para legibilidad y profundidad */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/75 to-background"
        aria-hidden="true"
      />
      <div
        className="absolute -top-40 right-0 size-96 rounded-full bg-brand/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center text-center px-4 sm:px-6">
        {/* Badge de contexto */}
        <Badge
          variant="outline"
          className="mb-6 gap-2 border-brand/40 bg-brand/15 text-brand px-3.5 py-1 text-xs font-semibold uppercase tracking-widest"
        >
          <Sparkles className="size-3" aria-hidden="true" />
          Plataforma de gestión operativa para clubes
        </Badge>

        {/* H1 principal (único en la página) */}
        <h1 className="max-w-4xl font-display text-5xl font-bold uppercase tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.92] text-balance">
          Toda la operación de tu club en un solo tablero
        </h1>

        {/* Bajada */}
        <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-ink-foreground/80 text-pretty">
          Partidos, fichas médicas de jugadores, profes, utilería e instalaciones organizados en tiempo real. Sin planillas perdidas ni cadenas de mensajes desordenadas.
        </p>

        {/* Botones de acción */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {hasSession ? (
            <Link
              href="/clubes"
              className={cn(
                buttonVariants({ variant: 'default', size: 'lg' }),
                'w-full sm:w-auto h-12 px-8 gap-2 bg-brand text-brand-foreground hover:bg-brand/90 font-medium text-base shadow-lg shadow-brand/20',
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
                'w-full sm:w-auto h-12 px-8 gap-2 bg-brand text-brand-foreground hover:bg-brand/90 font-medium text-base shadow-lg shadow-brand/20',
              )}
            >
              <LogIn className="size-5" aria-hidden="true" />
              <span>Empezar</span>
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          )}

          <a
            href="#funciones"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'w-full sm:w-auto h-12 px-6 gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white',
            )}
          >
            <span>Ver funciones</span>
            <ArrowDown className="size-4" aria-hidden="true" />
          </a>
        </div>

        {/* Etiquetas de disciplinas y modalidades */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 text-xs">
          {['Básquet', 'Fútbol', 'Vóley', 'Hockey', 'Natación', 'Multi-sede', 'Multi-club'].map((sport) => (
            <span
              key={sport}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-medium text-white/80 backdrop-blur-xs"
            >
              {sport}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
