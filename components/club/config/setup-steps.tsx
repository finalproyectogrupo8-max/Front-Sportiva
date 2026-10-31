import Link from 'next/link'
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type SetupStep = { label: string; description: string; done: boolean; href: string }

/** Onboarding de la home: lo mínimo para empezar a cargar jugadores (FRO-16). */
export function SetupSteps({ steps }: { steps: SetupStep[] }) {
  const next = steps.find((s) => !s.done)
  if (!next) return null

  return (
    <section
      aria-labelledby="setup-title"
      className="mx-auto mt-6 w-full max-w-[120rem] px-4 sm:px-6 lg:px-10"
    >
      <div className="flex flex-col gap-5 rounded-xl border border-primary/25 bg-primary/5 p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">Primeros pasos</p>
          <h2 id="setup-title" className="font-display text-2xl font-bold uppercase leading-none">
            Configurá tu club en {steps.length} pasos
          </h2>
          <p className="text-sm text-muted-foreground">
            Con esto listo ya podés cargar jugadores, armar el fixture y convocar.
          </p>
        </div>
        <ol className="grid gap-3 md:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.label}
              className={cn(
                'flex gap-3 rounded-lg border bg-card p-4',
                step === next && 'border-primary/40 ring-1 ring-primary/20',
              )}
            >
              {step.done ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <div className="flex flex-col gap-0.5">
                <span className={cn('font-medium', step.done && 'text-muted-foreground line-through')}>
                  {i + 1}. {step.label}
                  <span className="sr-only">{step.done ? ' (listo)' : ' (pendiente)'}</span>
                </span>
                <span className="text-xs text-muted-foreground">{step.description}</span>
              </div>
            </li>
          ))}
        </ol>
        <Link href={next.href} className={cn(buttonVariants(), 'w-fit gap-2')}>
          {next.label}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
