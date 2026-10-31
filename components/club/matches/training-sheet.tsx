'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ClipboardCheck, Clock, MapPin, Pencil, Trash2 } from 'lucide-react'
import { deleteTrainingAction } from '@/app/(app)/c/[club]/partidos/actions'
import { ConfirmDialog } from '@/components/club/forms'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Training } from '@/lib/api/matches'
import { formatLongDay, formatTime } from '@/lib/club-time'
import { cn } from '@/lib/utils'
import type { CategoryOption } from './match-form'
import { TrainingForm } from './training-form'

/** Detalle del entrenamiento (`?entrenamiento=`): editar, borrar y tomar asistencia. */
export function TrainingSheet({
  club,
  training,
  notFound,
  categories,
  can,
}: {
  club: string
  training: Training | null
  notFound: boolean
  categories: CategoryOption[]
  can: { update: boolean; delete: boolean; attendance: boolean }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [shownId, setShownId] = useState(training?.id)
  if (training?.id !== shownId) {
    setShownId(training?.id)
    setEditing(false)
  }

  const close = () => {
    const sp = new URLSearchParams(params.toString())
    sp.delete('entrenamiento')
    const qs = sp.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <Sheet open={Boolean(training || notFound)} onOpenChange={(o) => !o && close()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        {!training ? (
          <SheetHeader>
            <SheetTitle>No encontramos el entrenamiento</SheetTitle>
            <SheetDescription>Puede que lo hayan borrado.</SheetDescription>
          </SheetHeader>
        ) : editing ? (
          <>
            <SheetHeader className="flex-row items-center gap-2 border-b">
              <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditing(false)} aria-label="Volver">
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Button>
              <SheetTitle>Editar entrenamiento</SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 flex-col pt-4">
              <TrainingForm training={training} categories={categories} onDone={() => setEditing(false)} />
            </div>
          </>
        ) : (
          <>
            <SheetHeader className="gap-1 border-b p-6">
              <SheetDescription>{training.category_name}</SheetDescription>
              <SheetTitle className="text-xl first-letter:uppercase">Entrenamiento del {formatLongDay(training.starts_at)}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-5 p-6">
              <ul className="flex flex-col gap-2 text-sm">
                <li className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
                  {formatTime(training.starts_at)} a {formatTime(training.ends_at)}
                </li>
                {training.location && (
                  <li className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
                    {training.location}
                  </li>
                )}
              </ul>
              {training.objectives && (
                <section className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold">Objetivos</h3>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{training.objectives}</p>
                </section>
              )}
              {training.notes && <p className="whitespace-pre-line rounded-lg bg-muted p-3 text-sm">{training.notes}</p>}

              {can.attendance && (
                <Link
                  href={`/c/${club}/partidos/entrenamientos/${training.id}/asistencia`}
                  className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}
                >
                  <ClipboardCheck className="size-4" aria-hidden="true" />
                  Tomar asistencia
                </Link>
              )}
              <div className="flex gap-1">
                {can.update && (
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Editar
                  </Button>
                )}
                {can.delete && (
                  <Button variant="ghost" size="sm" className="ml-auto gap-1.5 text-destructive hover:text-destructive" onClick={() => setRemoving(true)}>
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title="¿Eliminar el entrenamiento?"
        description="Deja de aparecer en el calendario."
        confirmLabel="Eliminar"
        onConfirm={async () => {
          const result = await deleteTrainingAction(training!.id)
          if (result.ok) close()
          return result
        }}
      />
    </Sheet>
  )
}
