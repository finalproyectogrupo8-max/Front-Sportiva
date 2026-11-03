'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ClipboardCheck, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { AttendanceRow } from '@/lib/api/matches'
import { cn } from '@/lib/utils'
import { AttendanceTaker, type CallupAnswer } from './attendance-taker'

/** Resumen de asistencia en la página del partido; la lista se toma en un panel lateral. */
export function AttendanceCard({
  kind,
  eventId,
  title,
  subtitle,
  rows,
  canRecord,
  callup,
  pageHref,
}: {
  kind: 'matches' | 'trainings'
  eventId: number
  title: string
  subtitle: string
  rows: AttendanceRow[]
  canRecord: boolean
  callup?: CallupAnswer[]
  /** La misma lista en página completa (para la cancha o para compartir el link). */
  pageHref: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const marked = rows.filter((r) => r.status !== null)
  const present = rows.filter((r) => r.status === 'present' || r.status === 'late').length
  const pct = rows.length > 0 ? Math.round((present / rows.length) * 100) : 0

  return (
    <>
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5" aria-labelledby="attendance-title">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 id="attendance-title" className="text-sm font-semibold">
            Asistencia
          </h2>
        </div>
        {marked.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no se tomó. {rows.length} jugadores en la categoría.</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p>
              <span className="font-display text-3xl font-bold tabular-nums leading-none">{present}</span>
              <span className="text-sm text-muted-foreground"> de {rows.length} presentes</span>
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
              <div className={cn('h-full rounded-full', pct >= 75 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-destructive')} style={{ width: `${pct}%` }} />
            </div>
            {marked.length < rows.length && <p className="text-xs text-muted-foreground">{rows.length - marked.length} sin marcar</p>}
          </div>
        )}
        <Button size="lg" className="h-11 gap-2" onClick={() => setOpen(true)}>
          <ClipboardCheck className="size-4" aria-hidden="true" />
          {canRecord ? (marked.length > 0 ? 'Editar asistencia' : 'Tomar asistencia') : 'Ver asistencia'}
        </Button>
      </section>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
          <SheetHeader className="gap-1 border-b p-6 pr-12">
            <SheetDescription className="text-xs font-medium uppercase tracking-widest text-primary">Asistencia · {subtitle}</SheetDescription>
            <SheetTitle className="font-display text-2xl font-bold uppercase leading-none">{title}</SheetTitle>
            <Link href={pageHref} className="mt-1 inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <Maximize2 className="size-3" aria-hidden="true" />
              Abrir en pantalla completa
            </Link>
          </SheetHeader>
          <div className="flex flex-1 flex-col px-6 pt-5">
            {open && (
              <AttendanceTaker
                kind={kind}
                eventId={eventId}
                rows={rows}
                canRecord={canRecord}
                callup={callup}
                inSheet
                onSaved={() => {
                  setOpen(false)
                  router.refresh()
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
