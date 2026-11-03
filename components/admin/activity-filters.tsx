'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { CalendarDays, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const SUBJECT_OPTIONS = [
  { value: 'all', label: 'Todo' },
  { value: 'tenant', label: 'Clubes' },
  { value: 'user', label: 'Usuarios' },
  { value: 'membership', label: 'Membresías' },
  { value: 'document', label: 'Documentos' },
  { value: 'auth', label: 'Accesos' },
]

const FILTER_KEYS = ['subject_type', 'actor_id', 'from', 'to'] as const

export function ActivityFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentSubject = searchParams.get('subject_type') ?? 'all'
  const currentFrom = searchParams.get('from') ?? ''
  const currentTo = searchParams.get('to') ?? ''

  const updateFilters = useCallback(
    (updates: Record<string, string | null>) => {
      const sp = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '' || (key === 'subject_type' && value === 'all')) {
          sp.delete(key)
        } else {
          sp.set(key, value)
        }
      }

      // Cualquier filtro nuevo vuelve a la primera página.
      sp.delete('page')

      const qs = sp.toString()
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      })
    },
    [pathname, router, searchParams],
  )

  const handleReset = () => {
    startTransition(() => {
      router.replace(pathname, { scroll: false })
    })
  }

  const hasActiveFilters = FILTER_KEYS.some((key) => searchParams.get(key))

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Tipo de registro</span>
          <div
            role="radiogroup"
            aria-label="Filtrar por tipo de registro"
            className="flex max-w-full flex-wrap gap-1 rounded-lg bg-muted p-1"
          >
            {SUBJECT_OPTIONS.map((option) => {
              const active = option.value === currentSubject
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => updateFilters({ subject_type: option.value })}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    active
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activity-from" className="text-xs font-medium text-muted-foreground">
              Desde
            </Label>
            <div className="relative">
              <CalendarDays
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="activity-from"
                type="date"
                value={currentFrom}
                max={currentTo || undefined}
                onChange={(event) => updateFilters({ from: event.target.value })}
                className="h-9 pl-8 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activity-to" className="text-xs font-medium text-muted-foreground">
              Hasta
            </Label>
            <div className="relative">
              <CalendarDays
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="activity-to"
                type="date"
                value={currentTo}
                min={currentFrom || undefined}
                onChange={(event) => updateFilters({ to: event.target.value })}
                className="h-9 pl-8 text-xs"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Limpiar filtros
            </Button>
          )}

          {isPending && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              <span className="sr-only">Actualizando actividad...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
