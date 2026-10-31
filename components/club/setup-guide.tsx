'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Circle, Settings } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { SetupStep } from '@/lib/club-config'

const SEEN_KEY = 'sportiva:guia-configuracion:'

/**
 * Guía de la configuración inicial (FRO-16): un botón en la barra mientras falten pasos.
 * La primera vez que alguien entra a un club sin configurar se abre sola, una única vez.
 */
export function SetupGuide({ steps, club }: { steps: SetupStep[]; club: string }) {
  const [open, setOpen] = useState(false)
  const done = steps.filter((s) => s.done).length
  const next = steps.find((s) => !s.done)
  const base = `/c/${club}/configuracion`

  useEffect(() => {
    if (!next) return
    try {
      if (localStorage.getItem(SEEN_KEY + club) === '1') return
    } catch {
      // Sin almacenamiento (modo privado): no se abre sola, el botón sigue ahí.
      return
    }
    // Se marca como vista recién al abrirse: en desarrollo React corre el efecto dos veces.
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(SEEN_KEY + club, '1')
      } catch {}
      setOpen(true)
    }, 600)
    return () => clearTimeout(timer)
  }, [club, next])

  if (!next) return null

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={<Button variant="outline" className="relative h-9 gap-2 border-primary/40 px-2.5 text-primary hover:text-primary max-sm:w-9 max-sm:px-0" />}
        aria-label={`Configurar el club: ${done} de ${steps.length} pasos listos`}
      >
        <Settings className="size-4" aria-hidden="true" />
        <span className="hidden lg:inline">Configurar club</span>
        <span className="hidden tabular-nums text-xs font-semibold sm:inline">
          {done}/{steps.length}
        </span>
        <span className="absolute -right-0.5 -top-0.5 flex size-2.5" aria-hidden="true">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 pb-2 pt-1 text-foreground">
            <span className="text-sm font-semibold">Configurá tu club</span>
            <span className="text-xs font-normal leading-snug text-muted-foreground">
              Antes de cargar jugadores y partidos, completá estos pasos.
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <ol className="flex flex-col gap-0.5">
          {steps.map((step, i) => (
            <li key={step.tab}>
              <Link
                href={`${base}?tab=${step.tab}`}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-start gap-2.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted',
                  step === next && 'bg-primary/5',
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                ) : (
                  <Circle className={cn('mt-0.5 size-4 shrink-0', step === next ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
                )}
                <span className="flex flex-col">
                  <span className={cn('font-medium', step.done && 'text-muted-foreground line-through')}>
                    {i + 1}. {step.label}
                    <span className="sr-only">{step.done ? ' (listo)' : ' (pendiente)'}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{step.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
        <DropdownMenuSeparator />
        <Link
          href={`${base}?tab=${next.tab}`}
          onClick={() => setOpen(false)}
          className={cn(buttonVariants({ size: 'sm' }), 'mt-1 w-full gap-2')}
        >
          {next.label}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
