'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Mail, MessageCircle, Pencil, Phone, Plus, Trash2, UserX } from 'lucide-react'
import { assignCoachAction, deleteCoachAction, endAssignmentAction } from '@/app/(app)/c/[club]/profes/actions'
import { ConfirmDialog, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { FormSelect, Initials, Pill } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { CategoryCoach, Coach } from '@/lib/api/players'
import { formatDay } from '@/lib/format-date'
import { ASSIGNMENT_TYPE } from '@/lib/player-labels'
import { CoachForm } from './coaches-list'

type Flags = { update: boolean; delete: boolean; assign: boolean }
type Mode = 'view' | 'edit' | 'assign'

/** Ficha del profe en un panel lateral. Se abre con `?id=` en la URL. */
export function CoachSheet({
  coach,
  notFound,
  categories,
  can,
}: {
  coach: Coach | null
  notFound: boolean
  categories: { id: number; label: string }[]
  can: Flags
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [mode, setMode] = useState<Mode>('view')
  const [shownId, setShownId] = useState(coach?.id)
  if (coach?.id !== shownId) {
    setShownId(coach?.id)
    setMode('view')
  }
  const [removing, setRemoving] = useState(false)
  const [ending, setEnding] = useState<CategoryCoach | null>(null)

  const close = () => {
    const sp = new URLSearchParams(params.toString())
    sp.delete('id')
    const qs = sp.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const assignments = coach?.assignments ?? []
  const name = coach ? `${coach.first_name} ${coach.last_name}` : ''

  return (
    <Sheet open={Boolean(coach || notFound)} onOpenChange={(o) => !o && close()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        {!coach ? (
          <SheetHeader>
            <SheetTitle>No encontramos al profe</SheetTitle>
            <SheetDescription>Puede que lo hayan dado de baja.</SheetDescription>
          </SheetHeader>
        ) : mode !== 'view' ? (
          <>
            <SheetHeader className="flex-row items-center gap-2 border-b">
              <Button variant="ghost" size="icon" className="size-8" onClick={() => setMode('view')} aria-label="Volver a la ficha">
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Button>
              <div className="flex flex-col">
                <SheetTitle>{mode === 'edit' ? 'Editar profe' : 'Asignar una categoría'}</SheetTitle>
                <SheetDescription>{name}</SheetDescription>
              </div>
            </SheetHeader>
            <div className="flex flex-1 flex-col pt-4">
              {mode === 'edit' ? (
                <CoachForm coach={coach} onDone={() => setMode('view')} />
              ) : (
                <AssignForm coachId={coach.id} categories={categories} onDone={() => setMode('view')} />
              )}
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="gap-3 border-b p-6">
              <div className="flex items-center gap-4">
                <Initials name={name} className="size-14 text-lg" />
                <div className="flex min-w-0 flex-col gap-1">
                  <SheetTitle className="text-xl">{name}</SheetTitle>
                  <SheetDescription>
                    {assignments.length ? `${assignments.length} ${assignments.length === 1 ? 'categoría' : 'categorías'} a cargo` : 'Sin categorías a cargo'}
                  </SheetDescription>
                  {coach.status !== 'active' && <Pill tone="neutral" className="w-fit">Inactivo</Pill>}
                </div>
              </div>
            </SheetHeader>

            <div className="flex flex-col gap-6 p-6">
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Contacto</h3>
                  {can.update && (
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setMode('edit')}>
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Editar
                    </Button>
                  )}
                </div>
                {!coach.phone && !coach.email ? (
                  <p className="text-sm text-muted-foreground">Sin teléfono ni email.</p>
                ) : (
                  <ul className="flex flex-col gap-2 text-sm">
                    {coach.phone && (
                      <li className="flex items-center gap-2">
                        <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
                        <a href={`tel:${coach.phone.replace(/[^\d+]/g, '')}`} className="hover:underline">
                          {coach.phone}
                        </a>
                        <a
                          href={`https://wa.me/${coach.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <MessageCircle className="size-3.5" aria-hidden="true" />
                          WhatsApp
                        </a>
                      </li>
                    )}
                    {coach.email && (
                      <li className="flex items-center gap-2">
                        <Mail className="size-4 text-muted-foreground" aria-hidden="true" />
                        <a href={`mailto:${coach.email}`} className="truncate hover:underline">
                          {coach.email}
                        </a>
                      </li>
                    )}
                  </ul>
                )}
              </section>

              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Categorías a cargo</h3>
                  {can.assign && categories.length > 0 && (
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setMode('assign')}>
                      <Plus className="size-3.5" aria-hidden="true" />
                      Asignar
                    </Button>
                  )}
                </div>
                {assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Todavía no tiene categorías. Con una asignada, ve a sus jugadores, partidos y convocatorias.
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y rounded-lg border">
                    {assignments.map((a) => (
                      <li key={a.id} className="flex items-center gap-3 p-3">
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="font-medium">{a.category_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {ASSIGNMENT_TYPE[a.assignment_type] ?? a.assignment_type}
                            {a.start_date && ` · desde ${formatDay(a.start_date)}`}
                          </span>
                        </div>
                        {can.assign && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setEnding(a)}
                            aria-label={`Quitar ${a.category_name}`}
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {can.delete && (
                <Button variant="ghost" className="w-fit gap-1.5 text-destructive hover:text-destructive" onClick={() => setRemoving(true)}>
                  <UserX className="size-4" aria-hidden="true" />
                  Dar de baja al profe
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>

      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title={`¿Dar de baja a ${name}?`}
        description="Deja de aparecer en el listado. Si solo se tomó un tiempo, mejor marcalo como Inactivo."
        confirmLabel="Dar de baja"
        onConfirm={async () => {
          const result = await deleteCoachAction(coach!.id)
          if (result.ok) close()
          return result
        }}
      />
      <ConfirmDialog
        open={ending !== null}
        onOpenChange={(o) => !o && setEnding(null)}
        title={`¿Quitarle ${ending?.category_name ?? 'la categoría'}?`}
        description="La asignación se cierra con la fecha de hoy. Deja de ver los jugadores y partidos de esa categoría."
        confirmLabel="Quitar"
        onConfirm={() => endAssignmentAction(ending!.id)}
      />
    </Sheet>
  )
}

function AssignForm({ coachId, categories, onDone }: { coachId: number; categories: { id: number; label: string }[]; onDone: () => void }) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [categoryId, setCategoryId] = useState(String(categories[0]?.id ?? ''))
  const [type, setType] = useState('head_coach')

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData()
        data.set('category_id', categoryId)
        data.set('assignment_type', type)
        execute(() => assignCoachAction(coachId, data), onDone)
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <div className="flex flex-col gap-1.5">
          <FormSelect
            id="assign-category"
            label="Categoría"
            value={categoryId}
            onChange={setCategoryId}
            options={categories.map((c) => ({ value: String(c.id), label: c.label }))}
          />
          {fieldErrors.category_id && <p className="text-xs text-destructive">{fieldErrors.category_id}</p>}
        </div>
        <FormSelect
          id="assign-type"
          label="Rol en la categoría"
          value={type}
          onChange={setType}
          options={Object.entries(ASSIGNMENT_TYPE).map(([value, label]) => ({ value, label }))}
        />
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>Asignar categoría</SubmitButton>
      </SheetFooter>
    </form>
  )
}
