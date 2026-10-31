'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight, ClipboardCheck, Mail, Phone, Plus, Search } from 'lucide-react'
import { saveCoachAction } from '@/app/(app)/c/[club]/profes/actions'
import { ConfigSheet, EmptyConfig, Field, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { FormSelect, Initials, Pill } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SheetFooter } from '@/components/ui/sheet'
import type { Coach } from '@/lib/api/players'
import { ASSIGNMENT_TYPE } from '@/lib/player-labels'
import { cn } from '@/lib/utils'

export function CoachFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const q = params.get('q') ?? ''

  const set = (key: string, value: string | null) => {
    const sp = new URLSearchParams(params.toString())
    if (value) sp.set(key, value)
    else sp.delete(key)
    sp.delete('page')
    sp.delete('id')
    const qs = sp.toString()
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end', pending && 'opacity-70')}>
      <form
        role="search"
        className="relative sm:w-80"
        onSubmit={(e) => {
          e.preventDefault()
          set('q', String(new FormData(e.currentTarget).get('q') ?? '').trim())
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input key={q} name="q" type="search" defaultValue={q} placeholder="Buscar por nombre" aria-label="Buscar profe" className="pl-9" />
      </form>
      <div className="sm:w-44">
        <FormSelect
          id="filter-coach-status"
          label="Estado"
          value={params.get('estado') ?? 'active'}
          onChange={(v) => set('estado', v === 'active' ? null : v)}
          options={[
            { value: 'active', label: 'Activos' },
            { value: 'inactive', label: 'Inactivos' },
            { value: 'todos', label: 'Todos' },
          ]}
        />
      </div>
    </div>
  )
}

export function CoachesList({ coaches, filtered, canCreate }: { coaches: Coach[]; filtered: boolean; canCreate: boolean }) {
  const params = useSearchParams()
  const hrefFor = (id: number) => {
    const sp = new URLSearchParams(params.toString())
    sp.set('id', String(id))
    return `?${sp.toString()}`
  }

  if (coaches.length === 0) {
    return (
      <EmptyConfig
        icon={ClipboardCheck}
        title={filtered ? 'No hay profes con estos filtros' : 'Todavía no hay profes cargados'}
        description={
          filtered
            ? 'Probá con otra búsqueda o estado.'
            : canCreate
              ? 'Cargá al cuerpo técnico con "Nuevo profe" y asignale sus categorías.'
              : 'Cuando el club cargue profes en tus categorías, aparecen acá.'
        }
      />
    )
  }

  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {coaches.map((c) => {
        const assignments = c.assignments ?? []
        return (
          <li key={c.id}>
            <Link
              href={hrefFor(c.id)}
              scroll={false}
              className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <Initials name={`${c.first_name} ${c.last_name}`} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">
                    {c.first_name} {c.last_name}
                  </span>
                  <span className="flex items-center gap-2 truncate text-xs text-muted-foreground">
                    {c.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3" aria-hidden="true" />
                        {c.phone}
                      </span>
                    )}
                    {!c.phone && c.email && (
                      <span className="inline-flex items-center gap-1 truncate">
                        <Mail className="size-3" aria-hidden="true" />
                        {c.email}
                      </span>
                    )}
                  </span>
                </div>
                {c.status !== 'active' && <Pill tone="neutral">Inactivo</Pill>}
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </div>
              {assignments.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {assignments.map((a) => (
                    <li key={a.id} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                      <span className="font-medium">{a.category_name}</span>
                      {a.assignment_type !== 'head_coach' && (
                        <span className="text-muted-foreground"> · {ASSIGNMENT_TYPE[a.assignment_type] ?? a.assignment_type}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-xs text-muted-foreground">Sin categorías a cargo</span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export function NewCoachButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="size-4" aria-hidden="true" />
        Nuevo profe
      </Button>
      <ConfigSheet open={open} onOpenChange={setOpen} title="Nuevo profe" description="Después le asignás las categorías desde su ficha.">
        <CoachForm coach={null} onDone={() => setOpen(false)} />
      </ConfigSheet>
    </>
  )
}

export function CoachForm({ coach, onDone }: { coach: Coach | null; onDone: () => void }) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [status, setStatus] = useState(coach?.status ?? 'active')

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('status', status)
        execute(() => saveCoachAction(coach?.id ?? null, data), () => onDone())
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="coach-first" name="first_name" label="Nombre" defaultValue={coach?.first_name} maxLength={100} required autoFocus error={fieldErrors.first_name} />
          <Field id="coach-last" name="last_name" label="Apellido" defaultValue={coach?.last_name} maxLength={100} required error={fieldErrors.last_name} />
        </div>
        <Field id="coach-phone" name="phone" type="tel" inputMode="tel" label="Celular" defaultValue={coach?.phone ?? ''} maxLength={40} error={fieldErrors.phone} />
        <Field id="coach-email" name="email" type="email" label="Email" defaultValue={coach?.email ?? ''} maxLength={255} error={fieldErrors.email} />
        {coach && (
          <FormSelect
            id="coach-status"
            label="Estado"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'active', label: 'Activo' },
              { value: 'inactive', label: 'Inactivo' },
            ]}
          />
        )}
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{coach ? 'Guardar cambios' : 'Crear profe'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}
