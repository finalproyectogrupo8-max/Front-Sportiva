'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useClub } from '@/components/club/club-provider'
import { FormSelect, ModuleHeader, PageBody, Segmented } from '@/components/club/shared'
import { useCreateDialog } from '@/hooks/use-url-state'
import { ESTADOS_PEDIDO, TALLES, TODAY, formatDay, type ApparelOrder, type EstadoPedido, type Prenda } from '@/lib/data'
import type { Sport } from '@/lib/tenants'
import { cn } from '@/lib/utils'

const PRENDAS: Prenda[] = ['Camiseta', 'Short', 'Buzo', 'Campera', 'Medias']

const COLUMN_TONE: Record<EstadoPedido, string> = {
  Solicitado: 'bg-muted-foreground/40',
  'En producción': 'bg-warning',
  Listo: 'bg-primary',
  Entregado: 'bg-success',
}

function JerseyBack({ numero, alias, small = false }: { numero: number | string; alias: string; small?: boolean }) {
  return (
    <div
      className={cn(
        'relative flex shrink-0 flex-col items-center justify-center bg-primary text-primary-foreground',
        small ? 'h-16 w-14 rounded-b-lg rounded-t-2xl' : 'h-44 w-36 rounded-b-2xl rounded-t-[2.5rem]',
      )}
      aria-hidden="true"
    >
      <span className={cn('absolute bg-background', small ? 'top-0 h-2 w-5 rounded-b-full' : 'top-0 h-4 w-12 rounded-b-full')} />
      <span
        className={cn(
          'max-w-full truncate px-1 font-display font-semibold uppercase tracking-wider',
          small ? 'mt-1 text-[8px]' : 'mt-4 text-sm',
        )}
      >
        {alias || 'ALIAS'}
      </span>
      <span className={cn('font-display font-bold leading-none tabular-nums', small ? 'text-2xl' : 'text-7xl')}>
        {numero === '' ? '00' : numero}
      </span>
    </div>
  )
}

export function IndumentariaModule() {
  const { tenant, data, update, playerName } = useClub()
  const [sport, setSport] = useState<'Todos' | Sport>('Todos')
  const [open, setOpen] = useCreateDialog()

  const playersById = useMemo(() => new Map(data.players.map((p) => [p.id, p])), [data.players])
  const orders = data.orders.filter((o) => sport === 'Todos' || playersById.get(o.playerId)?.deporte === sport)

  const advance = (o: ApparelOrder) => {
    const i = ESTADOS_PEDIDO.indexOf(o.estado)
    if (i >= ESTADOS_PEDIDO.length - 1) return
    const next = ESTADOS_PEDIDO[i + 1]
    update('orders', (prev) => prev.map((x) => (x.id === o.id ? { ...x, estado: next } : x)))
    toast.success(`${o.prenda} #${o.numero} → ${next}`, { description: playerName(o.playerId) })
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Operación"
        title="Indumentaria"
        description="Pedidos de camisetas, shorts y abrigos por jugador, con talle, número y alias estampado."
        actions={
          <Button onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="size-4" aria-hidden="true" />
            Nuevo pedido
          </Button>
        }
      >
        <Segmented
          label="Filtrar por deporte"
          value={sport}
          onChange={setSport}
          options={[
            { value: 'Todos', label: 'Todos', count: data.orders.length },
            ...tenant.sports.map((s) => ({
              value: s,
              label: s,
              count: data.orders.filter((o) => playersById.get(o.playerId)?.deporte === s).length,
            })),
          ]}
        />
      </ModuleHeader>

      <PageBody>
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
          {ESTADOS_PEDIDO.map((estado) => {
            const col = orders.filter((o) => o.estado === estado)
            return (
              <section key={estado} aria-label={estado} className="flex w-72 shrink-0 snap-start flex-col gap-3 sm:w-auto">
                <header className="flex items-center gap-2 px-1">
                  <span className={cn('size-2 rounded-full', COLUMN_TONE[estado])} aria-hidden="true" />
                  <h2 className="text-sm font-semibold">{estado}</h2>
                  <span className="text-sm tabular-nums text-muted-foreground">{col.length}</span>
                </header>
                <ul className="flex min-h-32 flex-col gap-2 rounded-xl bg-muted/60 p-2">
                  {col.map((o) => {
                    const p = playersById.get(o.playerId)
                    return (
                      <li key={o.id} className="flex gap-3 rounded-lg border bg-card p-3 shadow-xs animate-rise">
                        <JerseyBack numero={o.numero} alias={o.alias} small />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="truncate text-sm font-medium">{playerName(o.playerId)}</span>
                          <span className="text-xs text-muted-foreground">
                            {o.prenda} · Talle <span className="font-semibold text-foreground">{o.talle}</span>
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {p?.deporte} {p?.categoria} · {formatDay(o.fecha, { day: 'numeric', month: 'short' })}
                          </span>
                          {estado !== 'Entregado' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => advance(o)}
                              className="mt-1 h-7 w-fit gap-1 px-2 text-xs text-primary"
                            >
                              {estado === 'Listo' ? 'Marcar entregado' : 'Avanzar'}
                              <ArrowRight className="size-3" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                  {col.length === 0 && <li className="p-3 text-center text-xs text-muted-foreground">Sin pedidos</li>}
                </ul>
              </section>
            )
          })}
        </div>
      </PageBody>

      <NewOrderDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

function NewOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, update } = useClub()
  const [playerId, setPlayerId] = useState('')
  const [prenda, setPrenda] = useState<string>('Camiseta')
  const [talle, setTalle] = useState('M')
  const [numero, setNumero] = useState('')
  const [alias, setAlias] = useState('')

  const selectPlayer = (id: string) => {
    setPlayerId(id)
    const p = data.players.find((x) => x.id === id)
    if (p) {
      setTalle(p.talle)
      setNumero(String(p.numero))
      setAlias(p.alias)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerId) {
      toast.error('Elegí un jugador')
      return
    }
    const order: ApparelOrder = {
      id: `o${Date.now()}`,
      playerId,
      prenda: prenda as Prenda,
      talle,
      numero: Number(numero) || 0,
      alias: alias.toUpperCase(),
      estado: 'Solicitado',
      fecha: TODAY.toISOString().slice(0, 10),
    }
    update('orders', (prev) => [order, ...prev])
    toast.success('Pedido cargado', { description: `${prenda} talle ${talle} · #${order.numero} ${order.alias}` })
    setPlayerId('')
    setNumero('')
    setAlias('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo pedido de indumentaria</DialogTitle>
          <DialogDescription>Los datos del jugador se completan solos; podés ajustarlos antes de enviar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-6 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-4">
            <FormSelect
              id="jugador"
              label="Jugador"
              value={playerId}
              onChange={selectPlayer}
              placeholder="Buscar jugador…"
              options={data.players.map((p) => ({
                value: p.id,
                label: `${p.nombre} ${p.apellido} · ${p.deporte} ${p.categoria}`,
              }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormSelect id="prenda" label="Prenda" value={prenda} onChange={setPrenda} options={PRENDAS.map((p) => ({ value: p, label: p }))} />
              <FormSelect id="talle" label="Talle" value={talle} onChange={setTalle} options={TALLES.map((t) => ({ value: t, label: t }))} />
            </div>
            <div className="grid grid-cols-[6rem_1fr] gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  inputMode="numeric"
                  maxLength={2}
                  value={numero}
                  onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
                  placeholder="10"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="alias">Alias</Label>
                <Input
                  id="alias"
                  maxLength={12}
                  value={alias}
                  onChange={(e) => setAlias(e.target.value.toUpperCase())}
                  placeholder="Apellido o apodo"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-muted p-5">
            <JerseyBack numero={numero} alias={alias} />
            <span className="text-xs text-muted-foreground">Vista previa · espalda</span>
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Cargar pedido</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
