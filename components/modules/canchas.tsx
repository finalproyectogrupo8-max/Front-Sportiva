'use client'

import { useState } from 'react'
import { AlertTriangle, Brush, CheckCircle2, CircleX, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useClub } from '@/components/club/club-provider'
import { FormSelect, ModuleHeader, PageBody, Pill, Stat, type Tone } from '@/components/club/shared'
import { useCreateDialog } from '@/hooks/use-url-state'
import { TODAY, formatDay, type Court, type EstadoElemento, type Incident, type Urgencia } from '@/lib/data'
import { cn } from '@/lib/utils'

const NEXT: Record<EstadoElemento, EstadoElemento> = { ok: 'revisar', revisar: 'fuera', fuera: 'ok' }
const LABEL: Record<EstadoElemento, string> = { ok: 'Operativo', revisar: 'Revisar', fuera: 'Fuera de servicio' }
const TONE: Record<EstadoElemento, Tone> = { ok: 'ok', revisar: 'warn', fuera: 'bad' }
const ICON = { ok: CheckCircle2, revisar: AlertTriangle, fuera: CircleX }
const INC_TONE: Record<Incident['estado'], Tone> = { Abierto: 'bad', 'En curso': 'warn', Resuelto: 'ok' }

function health(c: Court) {
  const total = c.elementos.length
  const score = c.elementos.reduce((s, e) => s + (e.estado === 'ok' ? 1 : e.estado === 'revisar' ? 0.5 : 0), 0)
  return Math.round((score / total) * 100)
}

export function CanchasModule() {
  const { data, update, can } = useClub()
  const canReport = can('repairs.create')
  const canUpdate = can('facilities.update')
  const [open, setOpen] = useCreateDialog()
  const [preset, setPreset] = useState<{ courtId: string; elemento: string }>({ courtId: '', elemento: '' })
  const today = TODAY.toISOString().slice(0, 10)

  const cycle = (court: Court, elId: string) => {
    let label = ''
    update('courts', (prev) =>
      prev.map((c) =>
        c.id !== court.id
          ? c
          : {
              ...c,
              elementos: c.elementos.map((e) => {
                if (e.id !== elId) return e
                const estado = NEXT[e.estado]
                label = `${e.nombre}: ${LABEL[estado]}`
                return { ...e, estado, revisado: today, nota: estado === 'ok' ? undefined : e.nota }
              }),
            },
      ),
    )
    toast(label || 'Estado actualizado', { description: court.nombre })
  }

  const clean = (court: Court) => {
    update('courts', (prev) =>
      prev.map((c) => (c.id === court.id ? { ...c, limpieza: { ...c.limpieza, estado: 'Hecha' as const, ultima: today } } : c)),
    )
    toast.success('Limpieza registrada', { description: court.nombre })
  }

  const resolve = (inc: Incident) => {
    const nextEstado: Incident['estado'] = inc.estado === 'Abierto' ? 'En curso' : 'Resuelto'
    update('incidents', (prev) => prev.map((i) => (i.id === inc.id ? { ...i, estado: nextEstado } : i)))
    if (nextEstado === 'Resuelto') {
      update('courts', (prev) =>
        prev.map((c) =>
          c.id === inc.courtId
            ? { ...c, elementos: c.elementos.map((e) => (e.nombre === inc.elemento ? { ...e, estado: 'ok' as const, nota: undefined, revisado: today } : e)) }
            : c,
        ),
      )
    }
    toast.success(`Incidencia ${nextEstado.toLowerCase()}`, { description: inc.elemento })
  }

  const report = (courtId: string, elemento: string) => {
    setPreset({ courtId, elemento })
    setOpen(true)
  }

  const all = data.courts.flatMap((c) => c.elementos)
  const openInc = data.incidents.filter((i) => i.estado !== 'Resuelto')

  return (
    <>
      <ModuleHeader
        eyebrow="Infraestructura"
        title="Estado de canchas"
        description="Aros, tableros, piso, arcos, relojes e iluminación. Limpieza diaria y mantenimiento con historial."
        actions={
          canReport && (
            <Button onClick={() => report('', '')} className="gap-1.5">
              <Wrench className="size-4" aria-hidden="true" />
              Reportar problema
            </Button>
          )
        }
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Elementos operativos" value={`${all.filter((e) => e.estado === 'ok').length}/${all.length}`} />
          <Stat label="A revisar" value={all.filter((e) => e.estado === 'revisar').length} />
          <Stat
            label="Fuera de servicio"
            value={<span className="text-destructive">{all.filter((e) => e.estado === 'fuera').length}</span>}
          />
          <Stat label="Limpiezas pendientes" value={data.courts.filter((c) => c.limpieza.estado === 'Pendiente').length} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
          <ul className="grid gap-4 md:grid-cols-2">
            {data.courts.map((c) => {
              const h = health(c)
              return (
                <li key={c.id} className="flex flex-col overflow-hidden rounded-xl border bg-card">
                  <div className="relative flex items-end justify-between gap-3 bg-ink p-4 text-ink-foreground">
                    <div className="court-lines absolute inset-0 text-ink-foreground" aria-hidden="true" />
                    <div className="relative flex flex-col">
                      <span className="text-xs text-ink-foreground/60">
                        {c.deporte} · {c.superficie}
                      </span>
                      <h2 className="font-display text-2xl font-bold uppercase leading-tight">{c.nombre}</h2>
                    </div>
                    <div className="relative flex flex-col items-end">
                      <span
                        className={cn(
                          'font-display text-4xl font-bold leading-none tabular-nums',
                          h >= 80 ? 'text-success' : h >= 60 ? 'text-warning' : 'text-destructive',
                        )}
                      >
                        {h}%
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-ink-foreground/60">Estado</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5 text-sm">
                    <span className="flex items-center gap-2">
                      <Brush className="size-4 text-muted-foreground" aria-hidden="true" />
                      <span>
                        Limpieza{' '}
                        <span className={c.limpieza.estado === 'Hecha' ? 'text-success' : 'font-medium text-warning-foreground'}>
                          {c.limpieza.estado === 'Hecha' ? 'hecha' : 'pendiente'}
                        </span>
                        <span className="text-muted-foreground"> · {formatDay(c.limpieza.ultima, { day: 'numeric', month: 'short' })}</span>
                      </span>
                    </span>
                    {c.limpieza.estado === 'Pendiente' && can('maintenance.update') ? (
                      <Button size="sm" variant="outline" className="h-7" onClick={() => clean(c)}>
                        Marcar hecha
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">{c.limpieza.responsable}</span>
                    )}
                  </div>

                  <ul className="flex flex-col divide-y">
                    {c.elementos.map((e) => {
                      const Icon = ICON[e.estado]
                      return (
                        <li key={e.id} className="flex items-center gap-3 px-4 py-2">
                          <button
                            type="button"
                            onClick={() => cycle(c, e.id)}
                            disabled={!canUpdate}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded text-left disabled:cursor-default"
                            aria-label={canUpdate ? `${e.nombre}: ${LABEL[e.estado]}. Cambiar estado` : `${e.nombre}: ${LABEL[e.estado]}`}
                          >
                            <Icon
                              className={cn(
                                'size-4 shrink-0',
                                e.estado === 'ok' ? 'text-success' : e.estado === 'revisar' ? 'text-warning' : 'text-destructive',
                              )}
                              aria-hidden="true"
                            />
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate text-sm">{e.nombre}</span>
                              {e.nota && <span className="truncate text-xs text-muted-foreground">{e.nota}</span>}
                            </span>
                          </button>
                          <Pill tone={TONE[e.estado]} className="hidden sm:inline-flex">
                            {LABEL[e.estado]}
                          </Pill>
                          {e.estado !== 'ok' && canReport && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              onClick={() => report(c.id, e.nombre)}
                              aria-label={`Reportar ${e.nombre}`}
                            >
                              <Wrench className="size-3.5" aria-hidden="true" />
                            </Button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </li>
              )
            })}
          </ul>

          <section aria-labelledby="inc" className="flex flex-col gap-3">
            <h2 id="inc" className="text-sm font-medium text-muted-foreground">
              Mantenimiento · {openInc.length} abiertas
            </h2>
            <ul className="flex flex-col gap-2">
              {data.incidents.map((i) => (
                <li key={i.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-snug">{i.elemento}</span>
                    <Pill tone={INC_TONE[i.estado]}>{i.estado}</Pill>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {data.courts.find((c) => c.id === i.courtId)?.nombre} · {i.descripcion} ·{' '}
                    {formatDay(i.fecha, { day: 'numeric', month: 'short' })}
                  </p>
                  <div className="flex items-center justify-between">
                    <Pill tone={i.prioridad === 'Alta' ? 'bad' : i.prioridad === 'Media' ? 'warn' : 'neutral'}>
                      Prioridad {i.prioridad.toLowerCase()}
                    </Pill>
                    {i.estado !== 'Resuelto' && can('repairs.update') && (
                      <Button size="sm" variant="ghost" className="h-7 text-primary" onClick={() => resolve(i)}>
                        {i.estado === 'Abierto' ? 'Tomar' : 'Resolver'}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </PageBody>

      {canReport && <ReportDialog key={`${open}-${preset.courtId}-${preset.elemento}`} open={open} onOpenChange={setOpen} preset={preset} />}
    </>
  )
}

function ReportDialog({
  open,
  onOpenChange,
  preset,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  preset: { courtId: string; elemento: string }
}) {
  const { data, update } = useClub()
  const [courtId, setCourtId] = useState(preset.courtId || data.courts[0].id)
  const [elemento, setElemento] = useState(preset.elemento)
  const [prioridad, setPrioridad] = useState<string>('Media')
  const [desc, setDesc] = useState('')
  const court = data.courts.find((c) => c.id === courtId)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!elemento || !desc.trim()) {
      toast.error('Elegí el elemento y describí el problema')
      return
    }
    const today = TODAY.toISOString().slice(0, 10)
    update('incidents', (prev) => [
      { id: `i${Date.now()}`, courtId, elemento, descripcion: desc.trim(), prioridad: prioridad as Urgencia, estado: 'Abierto', fecha: today },
      ...prev,
    ])
    update('courts', (prev) =>
      prev.map((c) =>
        c.id === courtId
          ? {
              ...c,
              elementos: c.elementos.map((x) =>
                x.nombre === elemento
                  ? { ...x, estado: (prioridad === 'Alta' ? 'fuera' : 'revisar') as EstadoElemento, nota: desc.trim(), revisado: today }
                  : x,
              ),
            }
          : c,
      ),
    )
    toast.success('Problema reportado', { description: `${elemento} · ${court?.nombre}` })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reportar problema</DialogTitle>
          <DialogDescription>Se genera una orden de mantenimiento y se actualiza el estado del elemento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <FormSelect
              id="cancha"
              label="Cancha"
              value={courtId}
              onChange={(v) => {
                setCourtId(v)
                setElemento('')
              }}
              options={data.courts.map((c) => ({ value: c.id, label: c.nombre }))}
            />
            <FormSelect
              id="elemento"
              label="Elemento"
              value={elemento}
              onChange={setElemento}
              options={(court?.elementos ?? []).map((x) => ({ value: x.nombre, label: x.nombre }))}
            />
          </div>
          <FormSelect
            id="prioridad"
            label="Prioridad"
            value={prioridad}
            onChange={setPrioridad}
            options={[
              { value: 'Baja', label: 'Baja · se puede usar' },
              { value: 'Media', label: 'Media · usar con cuidado' },
              { value: 'Alta', label: 'Alta · fuera de servicio' },
            ]}
          />
          <div className="flex flex-col gap-2">
            <Label htmlFor="desc">Descripción</Label>
            <Textarea id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ej.: el aro sur quedó flojo después del partido" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Reportar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
