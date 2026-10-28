import { ShieldCheck, HeartHandshake, Compass } from 'lucide-react'

export function AboutSection() {
  return (
    <section id="nosotros" className="border-t border-b border-border/60 bg-muted/20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-start">
          {/* Columna izquierda con título */}
          <div className="flex flex-col gap-3 lg:col-span-5">
            <span className="text-xs font-bold uppercase tracking-widest text-brand">
              Quiénes somos
            </span>
            <h2 className="font-display text-4xl font-bold uppercase tracking-tight text-foreground sm:text-5xl leading-tight">
              Tecnología simple para la vida real de los clubes
            </h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              Desarrollamos una herramienta pensada para ordenar la gestión operativa deportiva, respetando el esfuerzo diario de quienes sostienen cada institución.
            </p>
          </div>

          {/* Columna derecha con texto y pilares */}
          <div className="flex flex-col gap-8 lg:col-span-7">
            <div className="flex flex-col gap-4 text-base leading-relaxed text-muted-foreground">
              <p>
                Sportiva nació a partir de una necesidad concreta: simplificar la coordinación cotidiana de los clubes deportivos sin imponer sistemas burocráticos ni planillas de cálculo dispersas.
              </p>
              <p>
                Conocemos la realidad de coordinadores, entrenadores y comisiones directivas que pasan horas confirmando partidos por mensajes sueltos, rastreando aptos médicos en carpetas de papel o resolviendo la superposición de canchas minutos antes de entrenar.
              </p>
              <p>
                Nuestra propuesta es brindar un entorno digital seguro, accesible y exclusivo para cada institución, donde la información esté al día y disponible para quienes la necesitan. Creemos que cuando la gestión se ordena, el tiempo vuelve a donde tiene que estar: en el juego, la formación y la comunidad del club.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-4 border-t border-border/60">
              <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-card p-4">
                <ShieldCheck className="size-5 text-brand" aria-hidden="true" />
                <h3 className="font-display text-lg font-bold uppercase tracking-tight text-foreground">
                  Datos seguros
                </h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Cada club cuenta con su entorno independiente y protegido.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-card p-4">
                <Compass className="size-5 text-brand" aria-hidden="true" />
                <h3 className="font-display text-lg font-bold uppercase tracking-tight text-foreground">
                  Enfoque práctico
                </h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Funciones directas para resolver problemas concretos de cancha.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-card p-4">
                <HeartHandshake className="size-5 text-brand" aria-hidden="true" />
                <h3 className="font-display text-lg font-bold uppercase tracking-tight text-foreground">
                  Para la comunidad
                </h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Pensado para clubes de barrio, ligas y federaciones deportivas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
