'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Loader2, RotateCcw, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TICKET_STATUS_LABELS } from '@/lib/admin-labels'
import type { SupportTicketStatus } from '@/lib/admin-types'

const STATUS_OPTIONS: { value: 'all' | SupportTicketStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'new', label: TICKET_STATUS_LABELS.new },
  { value: 'in_review', label: TICKET_STATUS_LABELS.in_review },
  { value: 'resolved', label: TICKET_STATUS_LABELS.resolved },
  { value: 'discarded', label: TICKET_STATUS_LABELS.discarded },
]

export function TicketFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentSearch = searchParams.get('q') ?? ''
  const currentStatus = searchParams.get('status') ?? 'all'

  const updateFilters = useCallback(
    (updates: Record<string, string | null>) => {
      const sp = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '' || (key === 'status' && value === 'all')) {
          sp.delete(key)
        } else {
          sp.set(key, value)
        }
      }

      const qs = sp.toString()
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      })
    },
    [pathname, router, searchParams],
  )

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const query = new FormData(form).get('q') as string
    updateFilters({ q: query.trim() })
  }

  const handleReset = () => {
    startTransition(() => {
      router.replace(pathname, { scroll: false })
    })
  }

  const hasActiveFilters = Boolean(
    searchParams.get('q') ||
      (searchParams.get('status') && searchParams.get('status') !== 'all'),
  )

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Formulario de búsqueda */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            key={currentSearch}
            name="q"
            type="search"
            placeholder="Buscar por nombre, email, asunto o club..."
            defaultValue={currentSearch}
            className="h-9 pl-9 pr-8 text-sm"
          />
          {currentSearch && (
            <button
              type="button"
              onClick={() => updateFilters({ q: null })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Borrar búsqueda"
              aria-label="Borrar búsqueda"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented de estado */}
          <div
            role="group"
            aria-label="Filtrar por estado"
            className="flex items-center overflow-x-auto rounded-lg bg-muted p-1 text-xs font-medium max-w-full"
          >
            {STATUS_OPTIONS.map((opt) => {
              const active = currentStatus === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateFilters({ status: opt.value })}
                  className={`rounded-md px-2.5 py-1 whitespace-nowrap transition cursor-pointer ${
                    active
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Reset de filtros */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Limpiar filtros</span>
            </Button>
          )}

          {isPending && (
            <Loader2
              className="size-4 animate-spin text-muted-foreground"
              aria-label="Cargando..."
            />
          )}
        </div>
      </div>
    </div>
  )
}
