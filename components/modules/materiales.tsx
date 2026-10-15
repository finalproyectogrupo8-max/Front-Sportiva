'use client'

import { useState } from 'react'
import { Check, PackagePlus, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useClub } from '@/components/club/club-provider'
import { FormSelect, Meter, ModuleHeader, PageBody, Pill, Segmented, Stat, type Tone } from '@/components/club/shared'
import { useCreateDialog } from '@/hooks/use-url-state'
import { TODAY, formatDay, type Material, type MaterialRequest, type Urgencia } from '@/lib/data'

const TIPOS = ['Todos', 'Pelotas', 'Conos', 'Pesas', 'Colchonetas', 'Entrenamiento'] as const
type Tipo = (typeof TIPOS)[number]

function stockTone(m: Material): Tone {
  if (m.stock < m.minimo / 2) return 'bad'
  if (m.stock < m.minimo) return 'warn'
  return 'ok'
}

const URG_TONE: Record<Urgencia, Tone> = { Alta: 'bad', Media: 'warn', Baja: 'neutral' }
const EST_TONE: Record<MaterialRequest['estado'], Tone> = { Pendiente: 'warn', Aprobada: 'info', Recibida: 'ok' }

export function MaterialesModule() {
  const { data, update } = useClub()
  const [tipo, setTipo] = useState<Tipo>('Todos')
  const [open, setOpen] = useCreateDialog()
  const [preset, setPreset] = useState<string>('')

  const materials = data.materials.filter((m) => tipo === 'Todos' || m.tipo === tipo)
  const low = data.materials.filter((m) => m.stock < m.minimo)
  const pending = data.requests.filter((r) => r.estado !== 'Recibida')
  const matName = (id: string) => data.materials.find((m) => m.id === id)?.nombre ?? '—'

  const requestFor = (id: string) => {
    setPreset(id)
    setOpen(true)
  }

  const advance = (r: MaterialRequest) => {
    if (r.estado === 'Pendiente') {
      update('requests', (prev) => prev.map((x) => (x.id === r.id ? { ...x, estado: 'Aprobada' as const } : x)))
      toast.success('Solicitud aprobada', { description: `${r.cantidad} × ${matName(r.materialId)}` })
    } else if (r.estado === 'Aprobada') {
      update('requests', (prev) => prev.map((x) => (x.id === r.id ? { ...x, estado: 'Recibida' as const } : x)))
      update('materials', (prev) => prev.map((m) => (m.id === r.materialId ? { ...m, stock: m.stock + r.cantidad } : m)))
      toast.success('Material recibido e ingresado al stock', { description: `+${r.cantidad} ${matName(r.materialId)}` })
    }
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Operación"
        title="Materiales"
        description="Stock de utilería por depósito y circuito de reposición: solicitud, aprobación e ingreso."
        actions={
          <Button onClick={() => requestFor('')} className="gap-1.5">
            <PackagePlus className="size-4" aria-hidden="true" />
            Solicitar reposición
          </Button>
        }
      >
        <Segmented
          label="Filtrar por tipo"
          value={tipo}
          onChange={setTipo}
          options={TIPOS.map((t) => ({
            value: t,
            label: t,
            count: t === 'Todos' ? data.materials.length : data.materials.filter((m) => m.tipo === t).length,
          }))}
        />
      </ModuleHeader>

      <PageBody>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Ítems en inventario" value={data.materials.length} />
          <Stat label="Unidades totales" value={data.materials.reduce((s, m) => s + m.stock, 0)} />
          <Stat label="Bajo mínimo" value={<span className={low.length ? 'text-destructive' : ''}>{low.length}</span>} />
          <Stat label="Solicitudes abiertas" value={pending.length} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <section aria-labelledby="inv" className="flex flex-col gap-3">
            <h2 id="inv" className="text-sm font-medium text-muted-foreground">
              Inventario
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {materials.map((m) => {
                const tone = stockTone(m)
                return (
                  <li key={m.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col">
                        <span className="font-medium leading-snug">{m.nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {m.tipo} · {m.deporte} · {m.ubicacion}
                        </span>
                      </div>
                      <Pill tone={tone}>{tone === 'ok' ? 'OK' : tone === 'warn' ? 'Reponer' : 'Crítico'}</Pill>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="font-display text-3xl font-bold leading-none tabular-nums">{m.stock}</span>
                      <span className="text-xs text-muted-foreground">mín. {m.minimo}</span>
                    </div>
                    <Meter value={m.stock} max={m.minimo * 2} tone={tone} />
                    {tone !== 'ok' && (
                      <Button variant="outline" size="sm" onClick={() => requestFor(m.id)} className="w-fit">
                        Pedir {Math.max(m.minimo * 2 - m.stock, 1)} unidades
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          <section aria-labelledby="sol" className="flex flex-col gap-3">
            <h2 id="sol" className="text-sm font-medium text-muted-foreground">
              Solicitudes
            </h2>
            <ul className="flex flex-col divide-y rounded-xl border bg-card">
              {data.requests.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium leading-snug">
                      {r.cantidad} × {matName(r.materialId)}
                    </span>
                    <Pill tone={EST_TONE[r.estado]}>{r.estado}</Pill>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {r.motivo} · {r.solicitante} · {formatDay(r.fecha, { day: 'numeric', month: 'short' })}
                  </p>
                  <div className="flex items-center justify-between">
                    <Pill tone={URG_TONE[r.urgencia]}>Urgencia {r.urgencia.toLowerCase()}</Pill>
                    {r.estado !== 'Recibida' && (
                      <Button size="sm" variant="ghost" className="h-7 gap-1 text-primary" onClick={() => advance(r)}>
                        {r.estado === 'Pendiente' ? (
                          <>
                            <Check className="size-3.5" aria-hidden="true" /> Aprobar
                          </>
                        ) : (
                          <>
                            <Truck className="size-3.5" aria-hidden="true" /> Registrar ingreso
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </PageBody>

      <RequestDialog key={`${open}-${preset}`} open={open} onOpenChange={setOpen} preset={preset} />
    </>
  )
}

function RequestDialog({ open, onOpenChange, preset }: { open: boolean; onOpenChange: (o: boolean) => void; preset: string }) {
  const { data, update } = useClub()
  const presetMat = data.materials.find((m) => m.id === preset)
  const [materialId, setMaterialId] = useState(preset)
  const [cantidad, setCantidad] = useState(presetMat ? String(Math.max(presetMat.minimo * 2 - presetMat.stock, 1)) : '10')
  const [urgencia, setUrgencia] = useState<string>(presetMat && presetMat.stock < presetMat.minimo / 2 ? 'Alta' : 'Media')
  const [motivo, setMotivo] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = Number(cantidad)
    if (!materialId || !Number.isInteger(qty) || qty <= 0 || qty > 500) {
      toast.error('Completá material y una cantidad válida (1–500)')
      return
    }
    update('requests', (prev) => [
      {
        id: `r${Date.now()}`,
        materialId,
        cantidad: qty,
        urgencia: urgencia as Urgencia,
        solicitante: 'Administrador',
        estado: 'Pendiente',
        fecha: TODAY.toISOString().slice(0, 10),
        motivo: motivo.trim() || 'Reposición',
      },
      ...prev,
    ])
    toast.success('Solicitud enviada', { description: 'Queda pendiente de aprobación.' })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar reposición</DialogTitle>
          <DialogDescription>Pelotas, conos, pesas, colchonetas y utilería de entrenamiento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <FormSelect
            id="material"
            label="Material"
            value={materialId}
            onChange={setMaterialId}
            options={data.materials.map((m) => ({ value: m.id, label: `${m.nombre} (stock ${m.stock})` }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input id="cantidad" type="number" min={1} max={500} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
            </div>
            <FormSelect
              id="urgencia"
              label="Urgencia"
              value={urgencia}
              onChange={setUrgencia}
              options={['Baja', 'Media', 'Alta'].map((u) => ({ value: u, label: u }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: pelotas pinchadas en el entrenamiento de Sub-15" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Enviar solicitud</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
