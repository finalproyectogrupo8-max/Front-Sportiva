'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Loader2, RotateCcw, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function ClubFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentSearch = searchParams.get('search') ?? ''
  const currentStatus = searchParams.get('status') ?? 'all'
  const currentSort = searchParams.get('sort') ?? '-created_at'

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

      // Al cambiar filtros o búsqueda, reseteamos a página 1
      if ('search' in updates || 'status' in updates || 'sort' in updates || 'per_page' in updates) {
        sp.delete('page')
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
    const query = new FormData(form).get('search') as string
    updateFilters({ search: query.trim() })
  }

  const handleReset = () => {
    startTransition(() => {
      router.replace(pathname, { scroll: false })
    })
  }

  const hasActiveFilters = Boolean(
    searchParams.get('search') ||
      searchParams.get('status') ||
      searchParams.get('sort') ||
      searchParams.get('page'),
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
            name="search"
            type="search"
            placeholder="Buscar por nombre o slug..."
            defaultValue={currentSearch}
            className="h-9 pl-9 pr-8 text-sm"
          />
          {currentSearch && (
            <button
              type="button"
              onClick={() => updateFilters({ search: null })}
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
            <button
              type="button"
              onClick={() => updateFilters({ status: 'all' })}
              className={`rounded-md px-2.5 py-1 whitespace-nowrap transition cursor-pointer ${
                currentStatus === 'all'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => updateFilters({ status: 'active' })}
              className={`rounded-md px-2.5 py-1 whitespace-nowrap transition cursor-pointer ${
                currentStatus === 'active'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Activos
            </button>
            <button
              type="button"
              onClick={() => updateFilters({ status: 'provisioning' })}
              className={`rounded-md px-2.5 py-1 whitespace-nowrap transition cursor-pointer ${
                currentStatus === 'provisioning'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              En creación
            </button>
            <button
              type="button"
              onClick={() => updateFilters({ status: 'suspended' })}
              className={`rounded-md px-2.5 py-1 whitespace-nowrap transition cursor-pointer ${
                currentStatus === 'suspended'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Suspendidos
            </button>
            <button
              type="button"
              onClick={() => updateFilters({ status: 'failed' })}
              className={`rounded-md px-2.5 py-1 whitespace-nowrap transition cursor-pointer ${
                currentStatus === 'failed'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Fallidos
            </button>
          </div>

          {/* Orden */}
          <div className="relative">
            <select
              aria-label="Ordenar clubes"
              value={currentSort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs font-medium text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer"
            >
              <option value="-created_at">Más recientes</option>
              <option value="created_at">Más antiguos</option>
              <option value="name">Nombre (A-Z)</option>
              <option value="-name">Nombre (Z-A)</option>
              <option value="slug">Slug (A-Z)</option>
              <option value="status">Por estado</option>
            </select>
          </div>

          {/* Limpiar filtros */}
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Restablecer
            </Button>
          )}

          {isPending && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              <span className="sr-only">Actualizando listado...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

