'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PaginatedAdminUsers } from '@/lib/api/admin'

export function Pagination({
  meta,
  label = { one: 'usuario', many: 'usuarios' },
}: {
  meta: PaginatedAdminUsers['meta']
  /** Cómo se llaman los elementos del listado (en singular y plural). */
  label?: { one: string; many: string }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { current_page, last_page, from, to, total } = meta

  if (total === 0 || last_page <= 1) {
    if (total > 0) {
      return (
        <div className="flex items-center justify-between px-1 pt-2 text-xs text-muted-foreground">
          <span>
            Total: <strong className="font-medium text-foreground">{total}</strong> {total === 1 ? `${label.one} registrado` : `${label.many} registrados`}
          </span>
        </div>
      )
    }
    return null
  }

  const navigateToPage = (pageNumber: number) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (pageNumber === 1) {
      sp.delete('page')
    } else {
      sp.set('page', String(pageNumber))
    }
    const qs = sp.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // Generar rango visible de páginas
  const delta = 2
  const range: number[] = []
  for (
    let i = Math.max(2, current_page - delta);
    i <= Math.min(last_page - 1, current_page + delta);
    i++
  ) {
    range.push(i)
  }

  const pages: (number | 'ellipsis')[] = [1]
  if (current_page - delta > 2) {
    pages.push('ellipsis')
  }
  pages.push(...range)
  if (current_page + delta < last_page - 1) {
    pages.push('ellipsis')
  }
  if (last_page > 1) {
    pages.push(last_page)
  }

  const uniquePages = Array.from(new Set(pages))

  return (
    <div className="flex flex-col gap-3 px-1 pt-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        Mostrando del <strong className="font-medium text-foreground">{from ?? 0}</strong> al{' '}
        <strong className="font-medium text-foreground">{to ?? 0}</strong> de{' '}
        <strong className="font-medium text-foreground">{total}</strong> {label.many}
      </p>

      <div className="flex items-center gap-1.5 self-center sm:self-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigateToPage(current_page - 1)}
          disabled={current_page <= 1}
          className="h-8 gap-1 px-2.5 text-xs cursor-pointer"
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        <div className="flex items-center gap-1">
          {uniquePages.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className="select-none px-1 text-xs text-muted-foreground">
                  …
                </span>
              )
            }

            const isCurrent = p === current_page
            return (
              <Button
                key={p}
                type="button"
                variant={isCurrent ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigateToPage(p)}
                className={`h-8 w-8 p-0 text-xs cursor-pointer ${isCurrent ? 'font-semibold' : 'text-muted-foreground'}`}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Página ${p}`}
              >
                {p}
              </Button>
            )
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigateToPage(current_page + 1)}
          disabled={current_page >= last_page}
          className="h-8 gap-1 px-2.5 text-xs cursor-pointer"
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

