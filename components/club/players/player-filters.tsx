'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Search, X } from 'lucide-react'
import { FormSelect } from '@/components/club/shared'
import { GENDERS } from '@/lib/branches'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** Búsqueda y filtros del listado de jugadores. Viven en la URL: recargar la página los mantiene. */
export function PlayerFilters({ categories }: { categories: { id: number; label: string }[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const q = params.get('q') ?? ''
  const category = params.get('categoria') ?? 'todas'
  const status = params.get('estado') ?? 'active'
  const gender = params.get('genero') ?? 'todos'

  const set = (updates: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') sp.delete(key)
      else sp.set(key, value)
    }
    sp.delete('page')
    sp.delete('id')
    const qs = sp.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    <div className={cn('flex flex-col gap-3 lg:flex-row lg:items-end', pending && 'opacity-70')}>
      <form
        role="search"
        className="relative lg:w-80"
        onSubmit={(e) => {
          e.preventDefault()
          set({ q: String(new FormData(e.currentTarget).get('q') ?? '').trim() })
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          key={q}
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Nombre, DNI o número de ficha"
          aria-label="Buscar jugador"
          className="pl-9 pr-8"
        />
        {pending ? (
          <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden="true" />
        ) : (
          q && (
            <button
              type="button"
              onClick={() => set({ q: null })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Borrar búsqueda"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )
        )}
      </form>
      <div className="grid grid-cols-2 gap-3 sm:flex">
        <div className="sm:w-56">
          <FormSelect
            id="filter-category"
            label="Categoría"
            value={category}
            onChange={(v) => set({ categoria: v === 'todas' ? null : v })}
            options={[{ value: 'todas', label: 'Todas' }, ...categories.map((c) => ({ value: String(c.id), label: c.label }))]}
          />
        </div>
        <div className="sm:w-40">
          <FormSelect
            id="filter-gender"
            label="Género"
            value={gender}
            onChange={(v) => set({ genero: v === 'todos' ? null : v })}
            options={[{ value: 'todos', label: 'Todos' }, ...Object.entries(GENDERS).map(([value, label]) => ({ value, label }))]}
          />
        </div>
        <div className="sm:w-44">
          <FormSelect
            id="filter-status"
            label="Estado"
            value={status}
            onChange={(v) => set({ estado: v === 'active' ? null : v })}
            options={[
              { value: 'active', label: 'Activos' },
              { value: 'inactive', label: 'Inactivos' },
              { value: 'transferred', label: 'Transferidos' },
              { value: 'todos', label: 'Todos' },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
