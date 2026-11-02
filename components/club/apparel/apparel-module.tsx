'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ClipboardList, Loader2, PackageCheck, Pencil, Plus, Send, Shirt, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  approveOrderAction,
  categoryPlayersAction,
  createApparelOrderAction,
  deleteApparelItemAction,
  deleteOrderAction,
  deliverOrderAction,
  rejectOrderAction,
  saveApparelItemAction,
  submitOrderAction,
  type SquadPlayer,
} from '@/app/(app)/c/[club]/indumentaria/actions'
import { EmptyConfig } from '@/components/club/empty-state'
import { ConfigSheet, ConfigTable, ConfirmDialog, Field, FormError, RowActions, SubmitButton, useConfigAction } from '@/components/club/forms'
import { FormSelect, ModuleHeader, PageBody, Pill, Segmented, Stat, type Tone } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { ActionResult } from '@/lib/action-result'
import type { ApparelItem, Order } from '@/lib/api/orders'
import { cn } from '@/lib/utils'

type Can = {
  viewOrders: boolean
  create: boolean
  update: boolean
  delete: boolean
  approve: boolean
  deliver: boolean
  createItem: boolean
  updateItem: boolean
  deleteItem: boolean
}

export const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: 'Borrador', tone: 'neutral' },
  submitted: { label: 'Para aprobar', tone: 'warn' },
  pending: { label: 'Para aprobar', tone: 'warn' },
  approved: { label: 'Aprobado', tone: 'info' },
  preparing: { label: 'Preparando', tone: 'info' },
  partially_delivered: { label: 'Entrega parcial', tone: 'info' },
  delivered: { label: 'Entregado', tone: 'ok' },
  rejected: { label: 'Rechazado', tone: 'bad' },
}
const PRIORITY: Record<string, { label: string; tone: Tone }> = {
  low: { label: 'Baja', tone: 'neutral' },
  normal: { label: 'Normal', tone: 'neutral' },
  high: { label: 'Alta', tone: 'warn' },
  urgent: { label: 'Urgente', tone: 'bad' },
}
const SIZES = ['6', '8', '10', '12', '14', '16', 'XS', 'S', 'M', 'L', 'XL', 'XXL']
const OPEN = new Set(['draft', 'submitted', 'pending', 'approved', 'preparing', 'partially_delivered'])
const DELIVERABLE = new Set(['approved', 'preparing', 'partially_delivered'])
const WHEN = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
const DAY = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' })

type Filter = 'abiertos' | 'entregados' | 'rechazados' | 'todos'
type Tab = 'pedidos' | 'prendas'

/** Indumentaria (FRO-19): pedidos por categoría con talle, número y alias, y su circuito de aprobación y entrega. */
export function ApparelModule({
  orders,
  items,
  categories,
  openOrderId,
  startNew,
  can,
}: {
  orders: Order[]
  items: ApparelItem[]
  categories: { id: number; name: string }[]
  openOrderId: number | null
  startNew: boolean
  can: Can
}) {
  const [tab, setTab] = useState<Tab>(can.viewOrders ? 'pedidos' : 'prendas')
  const [filter, setFilter] = useState<Filter>('abiertos')
  const [selectedId, setSelectedId] = useState<number | null>(openOrderId)
  const [creating, setCreating] = useState(startNew && can.create)
  const activeItems = items.filter((i) => i.is_active)

  const matches = (o: Order) =>
    filter === 'todos' ? true : filter === 'abiertos' ? OPEN.has(o.status) : filter === 'entregados' ? o.status === 'delivered' : o.status === 'rejected'
  const shown = orders.filter(matches)
  const selected = orders.find((o) => o.id === selectedId) ?? null
  const count = (statuses: string[]) => orders.filter((o) => statuses.includes(o.status)).length

  return (
    <>
      <ModuleHeader
        eyebrow="Operación"
        title="Indumentaria"
        description="Pedidos por categoría con talle, número y alias de cada jugador: se envían, se aprueban o rechazan y se registra la entrega."
        actions={
          can.create &&
          tab === 'pedidos' && (
            <Button className="gap-1.5" onClick={() => setCreating(true)} disabled={activeItems.length === 0} title={activeItems.length === 0 ? 'Primero cargá las prendas' : undefined}>
              <Plus className="size-4" aria-hidden="true" />
              Nuevo pedido
            </Button>
          )
        }
      >
        <Segmented
          label="Vista"
          value={tab}
          onChange={setTab}
          options={[...(can.viewOrders ? [{ value: 'pedidos' as Tab, label: 'Pedidos', count: orders.length }] : []), { value: 'prendas' as Tab, label: 'Prendas', count: items.length }]}
        />
      </ModuleHeader>

      <PageBody>
        {tab === 'pedidos' && (
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
                title={orders.length === 0 ? 'Todavía no hay pedidos' : 'No hay pedidos con ese estado'}
                description={activeItems.length === 0 ? 'Primero cargá las prendas (camiseta, short, buzo…) en la pestaña Prendas.' : 'Armá un pedido para una categoría: el plantel se carga solo.'}
                action={
                  orders.length === 0 &&
                  (activeItems.length === 0
                    ? can.createItem && <Button onClick={() => setTab('prendas')}>Cargar prendas</Button>
                    : can.create && <Button onClick={() => setCreating(true)}>Nuevo pedido</Button>)
                }
              />
            ) : (
              <ul className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
                {shown.map((o) => (
                  <OrderRow key={o.id} order={o} onOpen={() => setSelectedId(o.id)} />
                ))}
              </ul>
            )}
          </>
        )}

        {tab === 'prendas' && <ItemsCatalog items={items} can={can} />}
      </PageBody>

      <ConfigSheet open={creating} onOpenChange={setCreating} title="Nuevo pedido de indumentaria" description="Elegí la categoría: aparecen sus jugadores con el número de camiseta." wide>
        {creating && <NewOrderForm categories={categories} items={activeItems} onDone={() => setCreating(false)} />}
      </ConfigSheet>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
          {selected && <OrderDetail key={selected.id + selected.status} order={selected} can={can} onClose={() => setSelectedId(null)} />}
        </SheetContent>
      </Sheet>
    </>
  )
}

function OrderRow({ order, onOpen }: { order: Order; onOpen: () => void }) {
  const status = ORDER_STATUS[order.status] ?? { label: order.status, tone: 'neutral' as Tone }
  const lines = order.apparel_order_items ?? []
  const units = lines.reduce((s, l) => s + Number(l.quantity), 0)
  const priority = PRIORITY[order.priority]
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-muted/50">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Shirt className="size-5" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">{order.category?.name ?? 'Sin categoría'}</span>
            <span className="font-mono text-xs text-muted-foreground">{order.order_number}</span>
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {lines.length} {lines.length === 1 ? 'jugador' : 'jugadores'} · {units} prendas
            {order.created_at && ` · ${DAY.format(new Date(order.created_at))}`}
            {order.description && ` · ${order.description}`}
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

type Line = { selected: boolean; size: string; shirt_number: string; alias: string; quantity: string }

function NewOrderForm({ categories, items, onDone }: { categories: { id: number; name: string }[]; items: ApparelItem[]; onDone: () => void }) {
  const router = useRouter()
  const [categoryId, setCategoryId] = useState('')
  const [itemId, setItemId] = useState(String(items[0]?.id ?? ''))
  const [priority, setPriority] = useState('normal')
  const [description, setDescription] = useState('')
  const [players, setPlayers] = useState<SquadPlayer[] | null>(null)
  const [lines, setLines] = useState<Record<number, Line>>({})
  const [loading, startLoading] = useTransition()
  const [saving, startSaving] = useTransition()
  const [error, setError] = useState<string>()

  const loadSquad = (value: string) => {
    setCategoryId(value)
    setPlayers(null)
    startLoading(async () => {
      const squad = await categoryPlayersAction(Number(value))
      setPlayers(squad)
      setLines(Object.fromEntries(squad.map((p) => [p.id, { selected: true, size: '', shirt_number: p.shirt_number?.toString() ?? '', alias: '', quantity: '1' }])))
    })
  }
  const patch = (id: number, change: Partial<Line>) => setLines((prev) => ({ ...prev, [id]: { ...prev[id], ...change } }))
  const chosen = (players ?? []).filter((p) => lines[p.id]?.selected)
  const missingSize = chosen.filter((p) => !lines[p.id].size).length

  const save = (send: boolean) => {
    setError(undefined)
    if (chosen.length === 0) return setError('Marcá al menos un jugador.')
    if (missingSize > 0) return setError(`Falta el talle de ${missingSize} ${missingSize === 1 ? 'jugador' : 'jugadores'}.`)
    startSaving(async () => {
      let result: ActionResult
      try {
        result = await createApparelOrderAction({
          category_id: Number(categoryId) || null,
          priority,
          description,
          send,
          lines: chosen.map((p) => ({
            player_id: p.id,
            apparel_item_id: Number(itemId),
            size: lines[p.id].size,
            shirt_number: lines[p.id].shirt_number === '' ? null : Number(lines[p.id].shirt_number),
            alias: lines[p.id].alias || null,
            quantity: Math.max(1, Number(lines[p.id].quantity) || 1),
          })),
        })
      } catch {
        result = { ok: false, error: 'No se pudo guardar. Probá de nuevo.' }
      }
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
        <div className="grid gap-4 sm:grid-cols-2">
          <FormSelect id="ord-category" label="Categoría" value={categoryId} onChange={loadSquad} options={categories.map((c) => ({ value: String(c.id), label: c.name }))} placeholder="Elegí la categoría" />
          <FormSelect id="ord-item" label="Prenda" value={itemId} onChange={setItemId} options={items.map((i) => ({ value: String(i.id), label: i.name }))} />
        </div>

        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Cargando el plantel…
          </p>
        )}
        {players && players.length === 0 && <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">La categoría no tiene jugadores activos.</p>}
        {players && players.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {chosen.length} de {players.length} jugadores
              </span>
              <div className="flex items-center gap-2">
                <Label htmlFor="ord-size-all" className="text-xs text-muted-foreground">
                  Talle para todos
                </Label>
                <select
                  id="ord-size-all"
                  className="h-8 rounded-md border bg-background px-2 text-sm"
                  defaultValue=""
                  onChange={(e) => e.target.value && setLines((prev) => Object.fromEntries(Object.entries(prev).map(([id, l]) => [id, { ...l, size: e.target.value }])))}
                >
                  <option value="">—</option>
                  {SIZES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <ul className="flex flex-col divide-y rounded-xl border">
              {players.map((p) => {
                const line = lines[p.id]
                return (
                  <li key={p.id} className={cn('grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 p-3 sm:grid-cols-[auto_minmax(0,1fr)_5rem_4rem_7rem_3.5rem]', !line.selected && 'opacity-50')}>
                    <input type="checkbox" checked={line.selected} onChange={(e) => patch(p.id, { selected: e.target.checked })} className="size-4 accent-primary" aria-label={`Incluir a ${p.name}`} />
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    <div className="col-span-2 grid grid-cols-[5rem_4rem_minmax(0,1fr)_3.5rem] gap-2 sm:contents">
                      <select
                        value={line.size}
                        onChange={(e) => patch(p.id, { size: e.target.value })}
                        disabled={!line.selected}
                        aria-label={`Talle de ${p.name}`}
                        className={cn('h-9 rounded-md border bg-background px-2 text-sm', line.selected && !line.size && 'border-warning')}
                      >
                        <option value="">Talle</option>
                        {SIZES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                      <Input value={line.shirt_number} onChange={(e) => patch(p.id, { shirt_number: e.target.value.replace(/\D/g, '').slice(0, 3) })} disabled={!line.selected} inputMode="numeric" placeholder="N.º" aria-label={`Número de ${p.name}`} className="h-9" />
                      <Input value={line.alias} onChange={(e) => patch(p.id, { alias: e.target.value })} disabled={!line.selected} maxLength={50} placeholder="Alias" aria-label={`Alias de ${p.name}`} className="h-9" />
                      <Input value={line.quantity} onChange={(e) => patch(p.id, { quantity: e.target.value.replace(/\D/g, '').slice(0, 2) })} disabled={!line.selected} inputMode="numeric" aria-label={`Cantidad para ${p.name}`} className="h-9 text-center" />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormSelect id="ord-priority" label="Prioridad" value={priority} onChange={setPriority} options={Object.entries(PRIORITY).map(([value, p]) => ({ value, label: p.label }))} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="ord-description">Nota</Label>
            <Input id="ord-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ej. Para el torneo de verano" />
          </div>
        </div>
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto flex-row gap-2 border-t">
        <Button variant="outline" className="flex-1" disabled={saving || !players?.length} onClick={() => save(false)}>
          Guardar borrador
        </Button>
        <Button className="flex-1 gap-2" disabled={saving || !players?.length} onClick={() => save(true)}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
          Enviar para aprobar
        </Button>
      </SheetFooter>
    </div>
  )
}

function OrderDetail({ order, can, onClose }: { order: Order; can: Can; onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [mode, setMode] = useState<'view' | 'reject' | 'deliver'>('view')
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  const [delivered, setDelivered] = useState<Record<number, number>>(() => Object.fromEntries((order.apparel_order_items ?? []).map((l) => [l.id, Number(l.delivered_quantity)])))
  const [removing, setRemoving] = useState(false)
  const status = ORDER_STATUS[order.status] ?? { label: order.status, tone: 'neutral' as Tone }
  const lines = order.apparel_order_items ?? []
  const history = order.status_history ?? []

  const run = (action: () => Promise<ActionResult>, close = false) =>
    startTransition(async () => {
      const result: ActionResult = await action().catch(() => ({ ok: false, error: 'No se pudo guardar. Probá de nuevo.' }))
      if (result.ok) {
        toast.success(result.message)
        setMode('view')
        if (close) onClose()
        router.refresh()
      } else {
        toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? 'No se pudo guardar.')
      }
    })

  return (
    <>
      <SheetHeader className="gap-1 border-b p-6 pr-12">
        <SheetDescription className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
          Pedido de indumentaria · <span className="font-mono normal-case tracking-normal">{order.order_number}</span>
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
          caption="Prendas del pedido"
          head={
            <tr>
              <th scope="col" className="px-3 py-2.5">Jugador</th>
              <th scope="col" className="px-3 py-2.5">Prenda</th>
              <th scope="col" className="px-3 py-2.5">Talle</th>
              <th scope="col" className="px-3 py-2.5">N.º · Alias</th>
              <th scope="col" className="px-3 py-2.5 text-right">{mode === 'deliver' ? 'Entregado' : 'Cant.'}</th>
            </tr>
          }
        >
          {lines.map((l) => (
            <tr key={l.id}>
              <td className="px-3 py-2.5 font-medium">{l.player ? `${l.player.first_name} ${l.player.last_name}` : `#${l.player_id}`}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{l.apparel_item?.name ?? '—'}</td>
              <td className="px-3 py-2.5 font-semibold">{l.size}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{[l.shirt_number, l.alias].filter((x) => x !== null && x !== '').join(' · ') || '—'}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {mode === 'deliver' ? (
                  <span className="inline-flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={Number(l.quantity)}
                      value={delivered[l.id]}
                      onChange={(e) => setDelivered((prev) => ({ ...prev, [l.id]: Math.min(Number(l.quantity), Math.max(0, Number(e.target.value) || 0)) }))}
                      aria-label="Cantidad entregada"
                      className="h-8 w-14 text-center"
                    />
                    <span className="text-muted-foreground">/ {Number(l.quantity)}</span>
                  </span>
                ) : (
                  <>
                    {DELIVERABLE.has(order.status) || order.status === 'delivered' ? `${Number(l.delivered_quantity)} / ` : ''}
                    {Number(l.quantity)}
                  </>
                )}
              </td>
            </tr>
          ))}
        </ConfigTable>

        {mode === 'reject' && (
          <div className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <Label htmlFor="reject-reason">Motivo del rechazo</Label>
            <Textarea id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} placeholder="Lo ve quien hizo el pedido." autoFocus />
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
            <Label htmlFor="deliver-comment">Comentario de la entrega</Label>
            <Input id="deliver-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={255} placeholder="ej. Faltan dos talles M" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMode('view')} disabled={pending}>
                Cancelar
              </Button>
              <Button disabled={pending} onClick={() => run(() => deliverOrderAction(order.id, Object.entries(delivered).map(([id, q]) => ({ id: Number(id), delivered_quantity: q })), comment))}>
                Guardar entrega
              </Button>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <section className="flex flex-col gap-3" aria-labelledby="order-history">
            <h3 id="order-history" className="text-sm font-semibold">
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
              Rechazar
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
              <Button className="gap-1.5" disabled={pending} onClick={() => run(() => deliverOrderAction(order.id, null, ''))}>
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
        description="Se borra el pedido con todas sus prendas."
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

function ItemsCatalog({ items, can }: { items: ApparelItem[]; can: Can }) {
  const [editing, setEditing] = useState<ApparelItem | 'new' | null>(null)
  const [removing, setRemoving] = useState<ApparelItem | null>(null)
  const add = can.createItem && (
    <Button className="gap-1.5" onClick={() => setEditing('new')}>
      <Plus className="size-4" aria-hidden="true" />
      Nueva prenda
    </Button>
  )
  return (
    <section className="flex flex-col gap-4" aria-label="Prendas">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">Las prendas que se pueden pedir. El talle, el número y el alias se eligen en cada pedido.</p>
        {items.length > 0 && add}
      </div>
      {items.length === 0 ? (
        <EmptyConfig icon={Shirt} title="Sin prendas" description="Camiseta titular, camiseta alternativa, short, medias, buzo, campera…" action={add} />
      ) : (
        <ConfigTable
          caption="Prendas"
          head={
            <tr>
              <th scope="col" className="px-4 py-3">Prenda</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3 text-right">Acciones</th>
            </tr>
          }
        >
          {items.map((i) => (
            <tr key={i.id} className={cn('transition-colors hover:bg-muted/40', !i.is_active && 'opacity-60')}>
              <td className="px-4 py-3">
                <span className="font-medium">{i.name}</span>
                {i.description && <span className="block text-xs text-muted-foreground">{i.description}</span>}
              </td>
              <td className="px-4 py-3">
                <Pill tone={i.is_active ? 'ok' : 'neutral'}>{i.is_active ? 'Activa' : 'Inactiva'}</Pill>
              </td>
              <td className="px-4 py-3">
                <RowActions>
                  {can.updateItem && (
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing(i)}>
                      <Pencil className="size-3.5" aria-hidden="true" />
                      <span className="sr-only sm:not-sr-only">Editar</span>
                    </Button>
                  )}
                  {can.deleteItem && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setRemoving(i)} aria-label={`Eliminar ${i.name}`}>
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  )}
                </RowActions>
              </td>
            </tr>
          ))}
        </ConfigTable>
      )}
      <ConfigSheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} title={editing === 'new' ? 'Nueva prenda' : 'Editar prenda'}>
        {editing !== null && <ItemForm item={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}
      </ConfigSheet>
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`¿Eliminar ${removing?.name ?? ''}?`}
        description="Si ya está en pedidos, conviene desactivarla."
        confirmLabel="Eliminar"
        onConfirm={() => deleteApparelItemAction(removing!.id)}
      />
    </section>
  )
}

function ItemForm({ item, onDone }: { item: ApparelItem | null; onDone: () => void }) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [active, setActive] = useState(item?.is_active ?? true)
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('is_active', active ? 'on' : 'off')
        execute(() => saveApparelItemAction(item?.id ?? null, data), onDone)
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <Field id="item-name" name="name" label="Nombre" placeholder="ej. Camiseta titular" defaultValue={item?.name} maxLength={100} required autoFocus error={fieldErrors.name} />
        <Field id="item-description" name="description" label="Descripción" placeholder="ej. Azul con vivos blancos" defaultValue={item?.description ?? ''} maxLength={255} error={fieldErrors.description} />
        <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          <span className="flex flex-col">
            <span className="font-medium">Activa</span>
            <span className="text-xs text-muted-foreground">Las inactivas no se ofrecen en pedidos nuevos.</span>
          </span>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-5 accent-primary" />
        </label>
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{item ? 'Guardar cambios' : 'Crear prenda'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}
