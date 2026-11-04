'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ClipboardList, Loader2, Package, PackageCheck, Plus, Send, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { approveOrderAction, deleteOrderAction, rejectOrderAction, submitOrderAction } from '@/app/(app)/c/[club]/indumentaria/actions'
import { createMaterialOrderAction, deliverMaterialOrderAction } from '@/app/(app)/c/[club]/materiales/actions'
import { ORDER_STATUS } from '@/components/club/apparel/apparel-module'
import { EmptyConfig } from '@/components/club/empty-state'
import { ConfigSheet, ConfigTable, ConfirmDialog, FormError } from '@/components/club/forms'
import { FormSelect, Pill, Segmented, Stat, type Tone } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { ActionResult } from '@/lib/action-result'
import type { Material, StorageLocation } from '@/lib/api/inventory'
import type { Order } from '@/lib/api/orders'

export type OrderCan = { create: boolean; update: boolean; delete: boolean; approve: boolean; deliver: boolean }

const PRIORITY: Record<string, { label: string; tone: Tone }> = {
  low: { label: 'Baja', tone: 'neutral' },
  normal: { label: 'Normal', tone: 'neutral' },
  high: { label: 'Alta', tone: 'warn' },
  urgent: { label: 'Urgente', tone: 'bad' },
}
const OPEN = new Set(['draft', 'submitted', 'pending', 'approved', 'preparing', 'partially_delivered'])
const DELIVERABLE = new Set(['approved', 'preparing', 'partially_delivered'])
const WHEN = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
const DAY = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' })
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toLocaleString('es-AR', { maximumFractionDigits: 2 }))

type Filter = 'abiertos' | 'entregados' | 'rechazados' | 'todos'

/** Pedidos de materiales: el profe pide para su categoría, se aprueba y el utilero lo entrega (descuenta stock). */
export function MaterialOrders({
  orders,
  materials,
  locations,
  categories,
  openOrderId,
  creating,
  onCreatingChange,
  can,
}: {
  orders: Order[]
  materials: Material[]
  locations: StorageLocation[]
  categories: { id: number; name: string }[]
  openOrderId: number | null
  creating: boolean
  onCreatingChange: (open: boolean) => void
  can: OrderCan
}) {
  const [filter, setFilter] = useState<Filter>('abiertos')
  const [selectedId, setSelectedId] = useState<number | null>(openOrderId)
  const count = (statuses: string[]) => orders.filter((o) => statuses.includes(o.status)).length
  const shown = orders.filter((o) => (filter === 'todos' ? true : filter === 'abiertos' ? OPEN.has(o.status) : filter === 'entregados' ? o.status === 'delivered' : o.status === 'rejected'))
  const selected = orders.find((o) => o.id === selectedId) ?? null

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Borradores" value={count(['draft'])} />
        <Stat label="Para aprobar" value={<span className={count(['submitted', 'pending']) ? 'text-warning' : ''}>{count(['submitted', 'pending'])}</span>} />
        <Stat label="Para entregar" value={count(['approved', 'preparing', 'partially_delivered'])} />
        <Stat label="Entregados" value={count(['delivered'])} />
      </div>
      <Segmented
        label="Estado"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'abiertos', label: 'En curso', count: orders.filter((o) => OPEN.has(o.status)).length },
          { value: 'entregados', label: 'Entregados', count: count(['delivered']) },
          { value: 'rechazados', label: 'Rechazados', count: count(['rejected']) },
          { value: 'todos', label: 'Todos', count: orders.length },
        ]}
      />
      {shown.length === 0 ? (
        <EmptyConfig
          icon={ClipboardList}
          title={orders.length === 0 ? 'Todavía no hay pedidos de materiales' : 'No hay pedidos con ese estado'}
          description={materials.length === 0 ? 'Todavía no hay materiales cargados para pedir.' : 'Pedí pelotas, conos, pecheras o lo que necesite tu categoría.'}
          action={orders.length === 0 && can.create && materials.length > 0 && <Button onClick={() => onCreatingChange(true)}>Pedir materiales</Button>}
        />
      ) : (
        <ul className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
          {shown.map((o) => (
            <OrderRow key={o.id} order={o} onOpen={() => setSelectedId(o.id)} />
          ))}
        </ul>
      )}

      <ConfigSheet open={creating} onOpenChange={onCreatingChange} title="Pedir materiales" description="Elegí los materiales y la cantidad. Lo aprueba el club y lo entrega el utilero.">
        {creating && <NewOrderForm categories={categories} materials={materials} onDone={() => onCreatingChange(false)} />}
      </ConfigSheet>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
          {selected && <OrderDetail key={selected.id + selected.status} order={selected} locations={locations} can={can} onClose={() => setSelectedId(null)} />}
        </SheetContent>
      </Sheet>
    </>
  )
}

function OrderRow({ order, onOpen }: { order: Order; onOpen: () => void }) {
  const status = ORDER_STATUS[order.status] ?? { label: order.status, tone: 'neutral' as Tone }
  const lines = order.material_order_items ?? []
  const priority = PRIORITY[order.priority]
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-muted/50">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Package className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">{order.category?.name ?? 'Sin categoría'}</span>
            <span className="font-mono text-xs text-muted-foreground">{order.order_number}</span>
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {lines.map((l) => `${fmt(Number(l.quantity))} ${l.material?.name ?? `#${l.material_id}`}`).join(' · ') || 'Sin materiales'}
            {order.created_at && ` · ${DAY.format(new Date(order.created_at))}`}
          </span>
        </span>
        {priority && (order.priority === 'high' || order.priority === 'urgent') && (
          <Pill tone={priority.tone} className="hidden sm:inline-flex">
            {priority.label}
          </Pill>
        )}
        <Pill tone={status.tone}>{status.label}</Pill>
      </button>
    </li>
  )
}

type Line = { key: number; material_id: string; quantity: string }

function NewOrderForm({ categories, materials, onDone }: { categories: { id: number; name: string }[]; materials: Material[]; onDone: () => void }) {
  const router = useRouter()
  const [categoryId, setCategoryId] = useState(categories.length === 1 ? String(categories[0].id) : '')
  const [priority, setPriority] = useState('normal')
  const [description, setDescription] = useState('')
  const [lines, setLines] = useState<Line[]>([{ key: 1, material_id: String(materials[0]?.id ?? ''), quantity: '1' }])
  const [saving, startSaving] = useTransition()
  const [error, setError] = useState<string>()

  const patch = (key: number, change: Partial<Line>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...change } : l)))
  const unit = (id: string) => materials.find((m) => String(m.id) === id)?.unit ?? ''

  const save = (send: boolean) => {
    setError(undefined)
    const valid = lines.filter((l) => l.material_id && Number(l.quantity.replace(',', '.')) > 0)
    if (valid.length === 0) return setError('Agregá al menos un material con su cantidad.')
    const ids = valid.map((l) => l.material_id)
    if (new Set(ids).size !== ids.length) return setError('Hay un material repetido: sumá las cantidades en una sola línea.')
    startSaving(async () => {
      const result: ActionResult = await createMaterialOrderAction({
        category_id: Number(categoryId) || null,
        priority,
        description,
        send,
        lines: valid.map((l) => ({ material_id: Number(l.material_id), quantity: Number(l.quantity.replace(',', '.')) })),
      }).catch(() => ({ ok: false, error: 'No se pudo guardar. Probá de nuevo.' }))
      if (result.ok) {
        toast.success(result.message)
        onDone()
        router.refresh()
      } else {
        setError(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? 'Revisá el pedido.')
      }
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <fieldset disabled={saving} className="flex flex-col gap-4 px-4 pb-4">
        <FormSelect
          id="mo-category"
          label="Categoría"
          value={categoryId}
          onChange={setCategoryId}
          options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
          placeholder="Para qué categoría"
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Materiales</span>
          <ul className="flex flex-col gap-2">
            {lines.map((l) => (
              <li key={l.key} className="grid grid-cols-[minmax(0,1fr)_8.5rem_auto] items-center gap-2">
                <select
                  value={l.material_id}
                  onChange={(e) => patch(l.key, { material_id: e.target.value })}
                  aria-label="Material"
                  className="h-9 min-w-0 rounded-md border bg-background px-2 text-sm"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Input
                    value={l.quantity}
                    onChange={(e) => patch(l.key, { quantity: e.target.value.replace(/[^\d.,]/g, '').slice(0, 7) })}
                    inputMode="decimal"
                    aria-label="Cantidad"
                    className="h-9 pr-16 text-right"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">{unit(l.material_id)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  disabled={lines.length === 1}
                  onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                  aria-label="Quitar material"
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            size="sm"
            className="w-fit gap-1.5"
            onClick={() => setLines((prev) => [...prev, { key: Math.max(...prev.map((x) => x.key)) + 1, material_id: String(materials.find((m) => !prev.some((x) => x.material_id === String(m.id)))?.id ?? materials[0]?.id ?? ''), quantity: '1' }])}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Agregar otro material
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormSelect id="mo-priority" label="Prioridad" value={priority} onChange={setPriority} options={Object.entries(PRIORITY).map(([value, p]) => ({ value, label: p.label }))} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="mo-description">Nota</Label>
            <Input id="mo-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ej. Para el entrenamiento del sábado" />
          </div>
        </div>
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto flex-row gap-2 border-t">
        <Button variant="outline" className="flex-1" disabled={saving} onClick={() => save(false)}>
          Guardar borrador
        </Button>
        <Button className="flex-1 gap-2" disabled={saving} onClick={() => save(true)}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
          Enviar para aprobar
        </Button>
      </SheetFooter>
    </div>
  )
}

function OrderDetail({ order, locations, can, onClose }: { order: Order; locations: StorageLocation[]; can: OrderCan; onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [mode, setMode] = useState<'view' | 'reject' | 'deliver'>('view')
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  const [locationId, setLocationId] = useState(String(locations[0]?.id ?? ''))
  const lines = order.material_order_items ?? []
  const [delivered, setDelivered] = useState<Record<number, number>>(() => Object.fromEntries(lines.map((l) => [l.id, Number(l.delivered_quantity)])))
  const [removing, setRemoving] = useState(false)
  const status = ORDER_STATUS[order.status] ?? { label: order.status, tone: 'neutral' as Tone }
  const history = order.status_history ?? []
  const location = Number(locationId) || null

  const run = (action: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const result: ActionResult = await action().catch(() => ({ ok: false, error: 'No se pudo guardar. Probá de nuevo.' }))
      if (result.ok) {
        toast.success(result.message)
        setMode('view')
        router.refresh()
      } else {
        toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? 'No se pudo guardar.')
      }
    })

  return (
    <>
      <SheetHeader className="gap-1 border-b p-6 pr-12">
        <SheetDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
          Pedido de materiales · <span className="font-mono normal-case tracking-normal">{order.order_number}</span>
        </SheetDescription>
        <SheetTitle className="font-display text-2xl font-bold uppercase leading-none">{order.category?.name ?? 'Sin categoría'}</SheetTitle>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Pill tone={status.tone}>{status.label}</Pill>
          {PRIORITY[order.priority] && order.priority !== 'normal' && <Pill tone={PRIORITY[order.priority].tone}>Prioridad {PRIORITY[order.priority].label.toLowerCase()}</Pill>}
          {order.description && <span className="text-sm text-muted-foreground">{order.description}</span>}
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-6 p-6">
        <ConfigTable
          caption="Materiales del pedido"
          head={
            <tr>
              <th scope="col" className="px-3 py-2.5">Material</th>
              <th scope="col" className="px-3 py-2.5 text-right">{mode === 'deliver' ? 'Entregado' : 'Cantidad'}</th>
            </tr>
          }
        >
          {lines.map((l) => (
            <tr key={l.id}>
              <td className="px-3 py-2.5 font-medium">{l.material?.name ?? `#${l.material_id}`}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {mode === 'deliver' ? (
                  <span className="inline-flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={Number(l.quantity)}
                      value={delivered[l.id]}
                      onChange={(e) => setDelivered((prev) => ({ ...prev, [l.id]: Math.min(Number(l.quantity), Math.max(0, Number(e.target.value) || 0)) }))}
                      aria-label={`Cantidad entregada de ${l.material?.name ?? 'material'}`}
                      className="h-8 w-16 text-center"
                    />
                    <span className="text-muted-foreground">/ {fmt(Number(l.quantity))}</span>
                  </span>
                ) : (
                  <>
                    {DELIVERABLE.has(order.status) || order.status === 'delivered' ? `${fmt(Number(l.delivered_quantity))} / ` : ''}
                    {fmt(Number(l.quantity))} <span className="text-muted-foreground">{l.material?.unit}</span>
                  </>
                )}
              </td>
            </tr>
          ))}
        </ConfigTable>

        {DELIVERABLE.has(order.status) && can.deliver && locations.length > 0 && (
          <FormSelect
            id="mo-location"
            label="Sale del depósito"
            value={locationId}
            onChange={setLocationId}
            options={[...locations.map((l) => ({ value: String(l.id), label: l.name })), { value: '', label: 'No descontar stock' }]}
          />
        )}

        {mode === 'reject' && (
          <div className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <Label htmlFor="mo-reject-reason">Motivo del rechazo</Label>
            <Textarea id="mo-reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} placeholder="Lo ve quien hizo el pedido." autoFocus />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMode('view')} disabled={pending}>
                Cancelar
              </Button>
              <Button variant="destructive" disabled={pending || !reason.trim()} onClick={() => run(() => rejectOrderAction(order.id, reason))}>
                Rechazar pedido
              </Button>
            </div>
          </div>
        )}

        {mode === 'deliver' && (
          <div className="flex flex-col gap-2 rounded-xl border bg-muted/40 p-4">
            <Label htmlFor="mo-deliver-comment">Comentario de la entrega</Label>
            <Input id="mo-deliver-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={255} placeholder="ej. Faltan 5 conos, llegan el lunes" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMode('view')} disabled={pending}>
                Cancelar
              </Button>
              <Button
                disabled={pending}
                onClick={() => run(() => deliverMaterialOrderAction(order.id, Object.entries(delivered).map(([id, q]) => ({ id: Number(id), delivered_quantity: q })), location, comment))}
              >
                Guardar entrega
              </Button>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <section className="flex flex-col gap-3" aria-labelledby="mo-history">
            <h3 id="mo-history" className="text-sm font-semibold">
              Historial
            </h3>
            <ol className="relative flex flex-col gap-3 border-l pl-5">
              {[...history].reverse().map((h) => {
                const s = ORDER_STATUS[h.new_status] ?? { label: h.new_status, tone: 'neutral' as Tone }
                return (
                  <li key={h.id} className="relative">
                    <span className="absolute -left-[1.6rem] top-1 size-2.5 rounded-full border-2 border-card bg-primary" aria-hidden="true" />
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Pill tone={s.tone}>{s.label}</Pill>
                      {h.created_at && <span className="text-xs text-muted-foreground">{WHEN.format(new Date(h.created_at))}</span>}
                    </div>
                    {h.comment && <p className="mt-1 text-sm text-muted-foreground">{h.comment}</p>}
                  </li>
                )
              })}
            </ol>
          </section>
        )}
      </div>

      {mode === 'view' && (
        <SheetFooter className="mt-auto flex-row flex-wrap gap-2 border-t">
          {order.status === 'draft' && can.delete && (
            <Button variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" disabled={pending} onClick={() => setRemoving(true)}>
              <Trash2 className="size-4" aria-hidden="true" />
              Eliminar
            </Button>
          )}
          {order.status === 'draft' && can.update && (
            <Button className="ml-auto gap-1.5" disabled={pending} onClick={() => run(() => submitOrderAction(order.id))}>
              <Send className="size-4" aria-hidden="true" />
              Enviar para aprobar
            </Button>
          )}
          {(order.status === 'submitted' || order.status === 'pending') && (can.approve || can.update) && (
            <Button variant="outline" className="ml-auto gap-1.5" disabled={pending} onClick={() => setMode('reject')}>
              <X className="size-4" aria-hidden="true" />
              {can.approve ? 'Rechazar' : 'Retirar pedido'}
            </Button>
          )}
          {(order.status === 'submitted' || order.status === 'pending') && can.approve && (
            <Button className="gap-1.5" disabled={pending} onClick={() => run(() => approveOrderAction(order.id, ''))}>
              <Check className="size-4" aria-hidden="true" />
              Aprobar
            </Button>
          )}
          {DELIVERABLE.has(order.status) && can.deliver && (
            <>
              <Button variant="outline" className="ml-auto gap-1.5" disabled={pending} onClick={() => setMode('deliver')}>
                Entrega parcial
              </Button>
              <Button className="gap-1.5" disabled={pending} onClick={() => run(() => deliverMaterialOrderAction(order.id, null, location, ''))}>
                <PackageCheck className="size-4" aria-hidden="true" />
                Entregar todo
              </Button>
            </>
          )}
        </SheetFooter>
      )}

      <ConfirmDialog
        open={removing}
        onOpenChange={setRemoving}
        title={`¿Eliminar el borrador ${order.order_number}?`}
        description="Se borra el pedido con todos sus materiales."
        confirmLabel="Eliminar"
        onConfirm={async () => {
          const result = await deleteOrderAction(order.id)
          if (result.ok) {
            onClose()
            router.refresh()
          }
          return result
        }}
      />
    </>
  )
}
