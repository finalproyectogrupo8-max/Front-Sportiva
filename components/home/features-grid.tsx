import Link from 'next/link'
import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Lock,
  Package,
  Shirt,
  UserCheck,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FeaturesGridProps {
  hasSession: boolean
}

interface FeatureItem {
  id: string
  title: string
  description: string
  icon: typeof CalendarDays
  previewDetails: string[]
}

const FEATURES: FeatureItem[] = [
  {
    id: 'partidos',
    title: 'Partidos y fixtures',
    description: 'Programación de fechas, horarios, canchas asignadas y planillas oficiales de juego.',
    icon: CalendarDays,
    previewDetails: ['Fixture por categoría', 'Notificación a planteles', 'Resultados en vivo'],
  },
  {
    id: 'jugadores',
    title: 'Fichas de jugadores',
    description: 'Legajo digital de cada deportista con apto médico, seguro y contactos de emergencia.',
    icon: Users,
    previewDetails: ['Vencimiento de aptos médicos', 'Categorías y pases', 'Ficha de emergencia'],
  },
  {
    id: 'profes',
    title: 'Cuerpo técnico y profes',
    description: 'Gestión de entrenadores y preparadores físicos, asignación de equipos y asistencias.',
    icon: UserCheck,
    previewDetails: ['Asignación por división', 'Control de asistencias', 'Horarios de práctica'],
  },
  {
    id: 'utileria',
    title: 'Utilería e inventario',
    description: 'Control de stock de pelotas, conos, pecheras y botiquín sin faltantes antes de entrenar.',
    icon: Package,
    previewDetails: ['Arqueo de material', 'Alertas de reposición', 'Responsables por turno'],
  },
  {
    id: 'canchas',
    title: 'Canchas e instalaciones',
    description: 'Grilla semanal de disponibilidad de canchas y turnos para evitar cruces o superposiciones.',
    icon: Activity,
    previewDetails: ['Turnos por disciplina', 'Estado del campo e iluminación', 'Reservas de terceros'],
  },
  {
    id: 'pedidos',
    title: 'Pedidos e indumentaria',
    description: 'Relevamiento de pedidos de camisetas oficiales, talles y entrega organizada por división.',
    icon: Shirt,
    previewDetails: ['Control de talles', 'Entrega a jugadores', 'Proveedores asignados'],
  },
  {
    id: 'multiclub',
    title: 'Arquitectura Multi-club',
    description: 'Seguridad y aislamiento total: cada club gestiona sus datos con roles y permisos específicos.',
    icon: Building2,
    previewDetails: ['Espacios 100% aislados', 'Roles y administradores', 'Escalable a federaciones'],
  },
]

export function FeaturesGrid({ hasSession }: FeaturesGridProps) {
  const targetHref = hasSession ? '/clubes' : '/login'

  return (
    <section id="funciones" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="flex flex-col items-center text-center gap-3 mb-12 sm:mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-brand">
          Módulos operativos
        </span>
        <h2 className="font-display text-4xl font-bold uppercase tracking-tight text-foreground sm:text-5xl">
          Diseñado para el día a día del club
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {hasSession
            ? 'Tenés la sesión activa. Hacé clic en cualquier función para ingresar a tus clubes.'
            : 'Módulos diseñados para coordinadores y directivos. Iniciá sesión con tu cuenta para acceder a la gestión.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feat) => {
          const Icon = feat.icon

          return (
            <Link
              key={feat.id}
              href={targetHref}
              className={cn(
                'group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
                hasSession
                  ? 'bg-card border-border/80 hover:-translate-y-1 hover:border-brand/50 hover:shadow-md'
                  : 'bg-card/40 border-border/60 hover:border-border/90 hover:bg-card/70',
              )}
            >
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between gap-4">
                <div
                  className={cn(
                    'flex size-11 items-center justify-center rounded-xl transition-colors',
                    hasSession
                      ? 'bg-brand/10 text-brand group-hover:bg-brand group-hover:text-brand-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>

                {hasSession ? (
                  <Badge variant="secondary" className="gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    Disponible
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-[11px] font-medium text-muted-foreground bg-muted/50 border-border/80">
                    <Lock className="size-3" aria-hidden="true" />
                    Bloqueado
                  </Badge>
                )}
              </div>

              {/* Contenido */}
              <div className="mt-5 flex flex-col gap-2">
                <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground group-hover:text-brand transition-colors">
                  {feat.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feat.description}
                </p>

                {/* Preview bullets */}
                <div
                  className={cn(
                    'mt-4 flex flex-col gap-1.5 rounded-lg border p-3 text-xs transition-opacity',
                    hasSession
                      ? 'bg-muted/30 border-border/40 text-foreground/80'
                      : 'bg-muted/10 border-border/30 text-muted-foreground/60 select-none blur-[0.5px]',
                  )}
                >
                  {feat.previewDetails.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-brand/60" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer con llamado */}
              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-xs">
                {hasSession ? (
                  <>
                    <span className="font-semibold text-foreground group-hover:text-brand transition-colors">
                      Ir a mi club
                    </span>
                    <ArrowUpRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand transition-all" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1.5">
                      <Lock className="size-3" aria-hidden="true" />
                      Iniciá sesión para desbloquear
                    </span>
                    <ArrowUpRight className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" aria-hidden="true" />
                  </>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
