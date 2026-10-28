'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Package,
  Shirt,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SlideItem {
  id: string
  tag: string
  title: string
  description: string
  icon: typeof CalendarDays
  renderVisual: () => React.JSX.Element
}

const SLIDES: SlideItem[] = [
  {
    id: 'partidos',
    tag: 'Competencia y Partidos',
    title: 'Calendario y fixture coordinado',
    description: 'Programá fechas, horarios y canchas asignadas con convocatoria de planteles en tiempo real.',
    icon: CalendarDays,
    renderVisual: () => (
      <div className="flex h-full w-full flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-ink via-ink/90 to-black/80 p-5 text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Próximas fechas · Primera
            </span>
          </div>
          <Badge variant="outline" className="border-brand/40 bg-brand/10 text-brand text-[10px]">
            Fin de semana
          </Badge>
        </div>

        <div className="flex flex-col gap-3 my-2">
          {/* Match card 1 */}
          <div className="flex items-center justify-between rounded-xl bg-white/5 p-3.5 backdrop-blur-sm border border-white/5">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-white">Sportiva vs. C.A. Belgrano</span>
              <span className="text-xs text-white/60">Sábado 16:30 hs · Cancha Principal 1</span>
            </div>
            <span className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              Confirmado
            </span>
          </div>

          {/* Match card 2 */}
          <div className="flex items-center justify-between rounded-xl bg-white/5 p-3.5 backdrop-blur-sm border border-white/5">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-white">Sportiva vs. Dep. Central</span>
              <span className="text-xs text-white/60">Domingo 11:00 hs · Cancha Sintética</span>
            </div>
            <span className="rounded-md bg-sky-500/20 px-2.5 py-1 text-xs font-semibold text-sky-300">
              Citación enviada
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-white/50 border-t border-white/10 pt-3">
          <span>Plantel: 18 convocados</span>
          <span className="text-brand font-medium">100% asistencias notificadas</span>
        </div>
      </div>
    ),
  },
  {
    id: 'jugadores',
    tag: 'Fichas de Jugadores',
    title: 'Legajo digital y aptos médicos',
    description: 'Documentación al día, categorías, contactos de emergencia y estado de habilitación por jugador.',
    icon: Users,
    renderVisual: () => (
      <div className="flex h-full w-full flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-ink via-ink/90 to-black/80 p-5 text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-brand text-brand-foreground font-display font-bold text-lg">
              LB
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Lucas Benítez #10</span>
              <span className="text-xs text-white/60">Categoría 2008 · Mediocampista</span>
            </div>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
            Habilitado
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2.5 my-2">
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <p className="text-[10px] uppercase font-semibold text-white/50">Apto Médico</p>
            <p className="text-xs font-medium text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="size-3" /> Vigente 2026
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <p className="text-[10px] uppercase font-semibold text-white/50">Contacto Urgencia</p>
            <p className="text-xs font-medium text-white/90 mt-1 truncate">María Benítez (Madre)</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <p className="text-[10px] uppercase font-semibold text-white/50">Seguro Deportivo</p>
            <p className="text-xs font-medium text-white/90 mt-1">Federación Oficial</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <p className="text-[10px] uppercase font-semibold text-white/50">Asistencia</p>
            <p className="text-xs font-medium text-brand mt-1">92% en el mes</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-white/50 border-t border-white/10 pt-3">
          <span>Legajo #8492</span>
          <span>Cuota social al día</span>
        </div>
      </div>
    ),
  },
  {
    id: 'utileria',
    tag: 'Inventario y Utilería',
    title: 'Control de material y stock',
    description: 'Seguimiento de pelotas, conos, pecheras y botiquín sin pérdidas ni sorpresas antes de entrenar.',
    icon: Package,
    renderVisual: () => (
      <div className="flex h-full w-full flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-ink via-ink/90 to-black/80 p-5 text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-brand" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Stock de entrenamiento
            </span>
          </div>
          <span className="text-xs text-white/50">Depósito Central</span>
        </div>

        <div className="flex flex-col gap-2.5 my-2">
          {/* Item 1 */}
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Pelotas Oficiales N° 5</span>
              <span className="text-emerald-400">26 / 30 en uso</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: '86%' }} />
            </div>
          </div>

          {/* Item 2 */}
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Pecheras Flúor (Lote A)</span>
              <span className="text-emerald-400">20 / 20 completo</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          {/* Item 3 */}
          <div className="rounded-xl bg-white/5 p-3 border border-white/5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Conos tortuga demarcación</span>
              <span className="text-amber-400">8 / 30 restantes</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: '26%' }} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-white/50 border-t border-white/10 pt-3">
          <span>Último arqueo: Hoy 14:00 hs</span>
          <span className="text-amber-300">1 alerta de reposición</span>
        </div>
      </div>
    ),
  },
  {
    id: 'canchas',
    tag: 'Infraestructura',
    title: 'Disponibilidad de canchas sin cruces',
    description: 'Grilla semanal de turnos, entrenamientos y partidos con estado de mantenimiento y luces.',
    icon: Activity,
    renderVisual: () => (
      <div className="flex h-full w-full flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-ink via-ink/90 to-black/80 p-5 text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Grilla de Canchas
            </span>
          </div>
          <span className="text-xs font-medium text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
            Operativa al 100%
          </span>
        </div>

        <div className="flex flex-col gap-2 my-2 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 border border-white/5">
            <div className="flex flex-col">
              <span className="font-semibold text-white">Cancha 1 (Césped natural)</span>
              <span className="text-white/60 text-[11px]">18:00 - 19:30 hs · Plantel Superior</span>
            </div>
            <span className="rounded bg-brand/20 px-2 py-1 text-brand text-[10px] font-semibold">
              Ocupada
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 border border-white/5">
            <div className="flex flex-col">
              <span className="font-semibold text-white">Gimnasio Cubierto</span>
              <span className="text-white/60 text-[11px]">19:30 - 21:00 hs · Vóley Femenino</span>
            </div>
            <span className="rounded bg-sky-500/20 px-2 py-1 text-sky-300 text-[10px] font-semibold">
              Reservada
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 border border-white/5">
            <div className="flex flex-col">
              <span className="font-semibold text-white">Cancha Sintética 2</span>
              <span className="text-white/60 text-[11px]">21:00 - 22:30 hs · Turno libre</span>
            </div>
            <span className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-300 text-[10px] font-semibold">
              Disponible
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-white/50 border-t border-white/10 pt-3">
          <span>Iluminación LED activada</span>
          <span>Redes y arcos verificados</span>
        </div>
      </div>
    ),
  },
  {
    id: 'pedidos',
    tag: 'Indumentaria y Pedidos',
    title: 'Kits y talles organizados',
    description: 'Relevamiento de pedidos de camisetas, conjuntos de viaje y entrega por jugador sin anotaciones sueltas.',
    icon: Shirt,
    renderVisual: () => (
      <div className="flex h-full w-full flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-ink via-ink/90 to-black/80 p-5 text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Shirt className="size-4 text-brand" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Lote Camisetas Temporada 2026
            </span>
          </div>
          <Badge className="bg-brand text-brand-foreground text-[10px]">En entrega</Badge>
        </div>

        <div className="flex flex-col gap-3 my-2">
          <div className="rounded-xl bg-white/5 p-3.5 border border-white/5">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-white">Progreso de entrega por talle</span>
              <span className="font-bold text-brand">38 / 42 kits</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-brand rounded-full" style={{ width: '90%' }} />
            </div>
            <div className="mt-3 flex gap-2">
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px]">Talle S: 8/8</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px]">Talle M: 16/16</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px]">Talle L: 14/18</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-white/5 p-3 border border-white/5 text-xs">
            <span className="text-white/70">Proveedor oficial asignado</span>
            <span className="font-medium text-emerald-400">Kits verificados</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-white/50 border-t border-white/10 pt-3">
          <span>Categoría: Juveniles M17</span>
          <span>4 pendientes de retiro</span>
        </div>
      </div>
    ),
  },
]

export function FeatureCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % SLIDES.length)
  }, [])

  const goToPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)
  }, [])

  // Autoplay con pausa en hover, focus y respeta prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches || isPaused) return

    const interval = setInterval(goToNext, 5000)
    return () => clearInterval(interval)
  }, [goToNext, isPaused])

  // Navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goToPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      goToNext()
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActiveIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActiveIndex(SLIDES.length - 1)
    }
  }

  // Deslizar con el dedo en mobile (touch swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX
    if (diff > 45) {
      goToNext()
    } else if (diff < -45) {
      goToPrev()
    }
    touchStartX.current = null
  }

  const currentSlide = SLIDES[activeIndex]
  const Icon = currentSlide.icon

  return (
    <section
      aria-label="Funciones destacadas de Sportiva"
      className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="flex flex-col items-center text-center gap-3 mb-10 sm:mb-14">
        <span className="text-xs font-bold uppercase tracking-widest text-brand">
          Una plataforma en acción
        </span>
        <h2 className="font-display text-4xl font-bold uppercase tracking-tight text-foreground sm:text-5xl">
          Todo tu club bajo control
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Deslizá para descubrir cómo Sportiva organiza los partidos, las fichas médicas, la utilería y las canchas de tu institución.
        </p>
      </div>

      <div
        ref={carouselRef}
        role="region"
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-4 sm:p-8 lg:p-10 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          {/* Columna de texto */}
          <div className="flex flex-col gap-5 lg:col-span-5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 border-brand/30 bg-brand/5 text-brand text-xs font-medium">
                <Icon className="size-3.5" aria-hidden="true" />
                {currentSlide.tag}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Slide {activeIndex + 1} de {SLIDES.length}
              </span>
            </div>

            <h3 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl leading-tight">
              {currentSlide.title}
            </h3>

            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {currentSlide.description}
            </p>

            {/* Controles de navegación y puntos */}
            <div className="flex items-center gap-4 pt-4 border-t border-border/40">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={goToPrev}
                  aria-label="Diapositiva anterior"
                  className="size-9 rounded-full cursor-pointer hover:bg-muted"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={goToNext}
                  aria-label="Siguiente diapositiva"
                  className="size-9 rounded-full cursor-pointer hover:bg-muted"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>

              {/* Indicadores de puntos */}
              <div className="flex items-center gap-2">
                {SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Ir a diapositiva ${idx + 1}: ${slide.title}`}
                    aria-current={idx === activeIndex ? 'true' : undefined}
                    className={cn(
                      'h-2 rounded-full transition-all cursor-pointer',
                      idx === activeIndex
                        ? 'w-7 bg-brand'
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50',
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Columna visual / maqueta interactiva */}
          <div className="lg:col-span-7">
            <div
              role="group"
              aria-roledescription="slide"
              aria-label={`${activeIndex + 1} de ${SLIDES.length}`}
              className="relative min-h-[340px] sm:min-h-[380px] w-full"
            >
              {currentSlide.renderVisual()}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
