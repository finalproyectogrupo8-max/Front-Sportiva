'use client'

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { FormSelect, Segmented } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { addDays, addMonths, formatMonthTitle, formatRange, today } from '@/lib/club-time'
import { cn } from '@/lib/utils'

/** Vista (semana o mes), navegación y filtro por categoría. Todo en la URL. */
export function CalendarToolbar({
  view,
  from,
  to,
  anchor,
  categories,
}: {
  view: 'semana' | 'mes'
  from: string
  to: string
  anchor: string
  categories: { id: number; label: string }[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const go = (updates: Record<string, string | null>) => {
    const sp = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) sp.delete(k)
      else sp.set(k, v)
    }
    sp.delete('entrenamiento')
    const qs = sp.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  const step = (n: number) => go({ desde: view === 'semana' ? addDays(anchor, 7 * n) : addMonths(anchor, n) })
  const title = view === 'semana' ? formatRange(from, to) : formatMonthTitle(anchor)

  return (
    <div className={cn('flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between', pending && 'opacity-70')}>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="Vista"
          value={view}
          onChange={(v) => go({ vista: v === 'semana' ? null : v })}
          options={[
            { value: 'semana', label: 'Semana' },
            { value: 'mes', label: 'Mes' },
          ]}
        />
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-9" onClick={() => step(-1)} aria-label={view === 'semana' ? 'Semana anterior' : 'Mes anterior'}>
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" className="h-9" onClick={() => go({ desde: null })}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" className="size-9" onClick={() => step(1)} aria-label={view === 'semana' ? 'Semana siguiente' : 'Mes siguiente'}>
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <h2 className="text-base font-semibold first-letter:uppercase" aria-live="polite">
          {title}
          {anchor !== today() && <span className="sr-only"> (no es la semana actual)</span>}
        </h2>
      </div>
      {categories.length > 1 && (
        <div className="sm:w-56">
          <FormSelect
            id="calendar-category"
            label="Categoría"
            value={params.get('categoria') ?? 'todas'}
            onChange={(v) => go({ categoria: v === 'todas' ? null : v })}
            options={[{ value: 'todas', label: 'Todas' }, ...categories.map((c) => ({ value: String(c.id), label: c.label }))]}
          />
        </div>
      )}
    </div>
  )
}
