'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useClub } from '@/components/club/club-provider'
import { FormSelect, Initials, Meter, ModuleHeader, PageBody, Pill, Segmented, type Tone } from '@/components/club/shared'
import { useCreateDialog, useUrlParam } from '@/hooks/use-url-state'
import { CATEGORIAS, PUESTOS, TALLES, type Categoria, type Pase, type Player } from '@/lib/data'
import type { Sport } from '@/lib/tenants'

export const PASE_TONE: Record<Pase, Tone> = {
  Habilitado: 'ok',
  'En trámite': 'warn',
  'A préstamo': 'info',
  Libre: 'neutral',
}

export function JugadoresModule() {
  const { tenant, data, can } = useClub()
  const canCreate = can('players.create')
  const [sport, setSport] = useState<'Todos' | Sport>('Todos')
  const [cat, setCat] = useState<'Todas' | Categoria>('Todas')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useUrlParam('id')
  const [open, setOpen] = useCreateDialog()

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return data.players
      .filter((p) => sport === 'Todos' || p.deporte === sport)
      .filter((p) => cat === 'Todas' || p.categoria === cat)
      .filter((p) => !term || `${p.nombre} ${p.apellido} ${p.alias} ${p.puesto}`.toLowerCase().includes(term))
      .sort((a, b) => a.apellido.localeCompare(b.apellido))
  }, [data.players, sport, cat, q])

  const current = data.players.find((p) => p.id === selected)

  return (
    <>
      <ModuleHeader
        eyebrow="Deportivo"
        title="Jugadores"
        description="Ficha de cada jugador: edad, categoría, estado del pase, puesto y datos de indumentaria."
        actions={
          canCreate && (
            <Button onClick={() => setOpen(true)} className="gap-1.5">
              <Plus className="size-4" aria-hidden="true" />
              Nueva ficha
            </Button>
          )
        }
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, alias o puesto"
              aria-label="Buscar jugador"
              className="pl-9"
            />
          </div>
          <Segmented
            label="Deporte"
            value={sport}
            onChange={setSport}
            options={[{ value: 'Todos', label: 'Todos' }, ...tenant.sports.map((s) => ({ value: s, label: s }))]}
          />
          <Segmented
            label="Categoría"
            value={cat}
            onChange={setCat}
            options={[{ value: 'Todas', label: 'Todas' }, ...CATEGORIAS.map((c) => ({ value: c, label: c }))]}
          />
        </div>
      </ModuleHeader>

      <PageBody>
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <caption className="sr-only">Listado de jugadores</caption>
            <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Jugador</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium sm:table-cell">Edad</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">Categoría</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">Puesto</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Pase</th>
                <th scope="col" className="hidden px-4 py-2.5 font-medium lg:table-cell">Asistencia</th>
                <th scope="col" className="w-8 px-2 py-2.5">
                  <span className="sr-only">Abrir</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className="cursor-pointer transition hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelected(p.id)
                      }}
                      className="flex items-center gap-3 text-left"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary font-display text-base font-bold text-primary-foreground tabular-nums">
                        {p.numero}
                      </span>
                      <span className="flex flex-col">
                        <span className="font-medium">
                          {p.nombre} {p.apellido}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {p.deporte}
                          <span className="md:hidden">
                            {' '}
                            · {p.categoria} · {p.puesto}
                          </span>
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="hidden px-4 py-3 tabular-nums sm:table-cell">{p.edad}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{p.categoria}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{p.puesto}</td>
                  <td className="px-4 py-3">
                    <Pill tone={PASE_TONE[p.pase]}>{p.pase}</Pill>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <div className="flex w-32 items-center gap-2">
                      <Meter value={p.asistencia} />
                      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{p.asistencia}%</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No se encontraron jugadores.</p>}
        </div>
        <p className="text-xs text-muted-foreground">{list.length} jugadores</p>
      </PageBody>

      <Sheet open={!!current} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md [&_[data-slot=sheet-close]]:text-ink-foreground [&_[data-slot=sheet-close]:hover]:bg-ink-foreground/10 [&_[data-slot=sheet-close]:hover]:text-ink-foreground">
          {current && <PlayerSheet p={current} />}
        </SheetContent>
      </Sheet>

      {canCreate && <NewPlayerDialog open={open} onOpenChange={setOpen} />}
    </>
  )
}

function PlayerSheet({ p }: { p: Player }) {
  const { tenant, data, update, can } = useClub()
  const coach = data.coaches.find((c) => c.id === p.coachId)
  const orders = data.orders.filter((o) => o.playerId === p.id)
  const notes = data.coaches.flatMap((c) => c.notas.filter((n) => n.playerId === p.id).map((n) => ({ ...n, coach: c.nombre })))

  const setPase = (pase: string) => {
    update('players', (prev) => prev.map((x) => (x.id === p.id ? { ...x, pase: pase as Pase } : x)))
    toast.success(`Pase actualizado: ${pase}`)
  }

  return (
    <>
      <SheetHeader className="gap-4 bg-ink p-6 text-ink-foreground">
        <div className="flex items-center gap-4">
          <span className="font-display text-6xl font-bold leading-none tabular-nums text-warning">{p.numero}</span>
          <div className="flex flex-col">
            <SheetTitle className="font-display text-2xl font-bold uppercase leading-tight text-ink-foreground">
              {p.nombre} {p.apellido}
            </SheetTitle>
            <SheetDescription className="text-ink-foreground/70">
              {p.deporte} · {p.categoria} · {p.puesto}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex flex-col gap-6 px-6 pb-6">
        <dl className="grid grid-cols-3 gap-3">
          {[
            ['Edad', `${p.edad} años`],
            ['Alias', p.alias],
            ['Talle', p.talle],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 rounded-lg bg-muted p-3">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="truncate text-sm font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        {can('players.update') ? (
          <FormSelect
            id="pase"
            label="Estado del pase"
            value={p.pase}
            onChange={setPase}
            options={(['Habilitado', 'En trámite', 'A préstamo', 'Libre'] as Pase[]).map((x) => ({ value: x, label: x }))}
          />
        ) : (
          <p className="text-sm">
            <span className="text-muted-foreground">Estado del pase: </span>
            <span className="font-medium">{p.pase}</span>
          </p>
        )}

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Rendimiento</h3>
          {[
            ['Eficacia', p.eficacia],
            ['Constancia', p.constancia],
            ['Asistencia', p.asistencia],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center gap-3">
              <span className="w-24 text-sm text-muted-foreground">{k}</span>
              <Meter value={Number(v)} />
              <span className="w-10 text-right text-sm font-medium tabular-nums">{v}%</span>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <span className="w-24 text-sm text-muted-foreground">Práctica</span>
            <Meter value={p.practica} max={12} tone="info" />
            <span className="w-10 text-right text-sm font-medium tabular-nums">{p.practica}h</span>
          </div>
          <Link href={`/c/${tenant.slug}/analisis?id=${p.id}`} className="text-sm font-medium text-primary hover:underline">
            Ver análisis completo
          </Link>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Profe a cargo</h3>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Initials name={coach?.nombre ?? '—'} className="size-8 text-xs" />
            <span className="text-sm">{coach?.nombre}</span>
          </div>
        </section>

        {notes.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Seguimiento</h3>
            <ul className="flex flex-col gap-2">
              {notes.map((n, i) => (
                <li key={i} className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
                  <Pill tone={n.tipo === 'Mejora' ? 'ok' : n.tipo === 'Alerta' ? 'bad' : 'info'} className="w-fit">
                    {n.tipo}
                  </Pill>
                  <p className="leading-relaxed">{n.texto}</p>
                  <span className="text-xs text-muted-foreground">{n.coach}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Indumentaria</h3>
          {orders.length ? (
            <ul className="flex flex-col divide-y rounded-lg border text-sm">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between px-3 py-2">
                  <span>
                    {o.prenda} · {o.talle} · #{o.numero}
                  </span>
                  <Pill tone={o.estado === 'Entregado' ? 'ok' : 'neutral'}>{o.estado}</Pill>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sin pedidos registrados.</p>
          )}
        </section>
      </div>
    </>
  )
}

function NewPlayerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { tenant, data, update } = useClub()
  const [f, setF] = useState({
    nombre: '',
    apellido: '',
    edad: '',
    deporte: tenant.sports[0] as string,
    categoria: 'Sub-15' as string,
    puesto: PUESTOS[tenant.sports[0]][0],
    numero: '',
    talle: 'M',
  })
  const set = (k: keyof typeof f) => (v: string) =>
    setF((prev) => ({ ...prev, [k]: v, ...(k === 'deporte' ? { puesto: PUESTOS[v as Sport][0] } : {}) }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const edad = Number(f.edad)
    if (!f.nombre.trim() || !f.apellido.trim() || !edad || edad < 5 || edad > 60) {
      toast.error('Completá nombre, apellido y una edad válida')
      return
    }
    const player: Player = {
      id: `p${Date.now()}`,
      nombre: f.nombre.trim(),
      apellido: f.apellido.trim(),
      edad,
      deporte: f.deporte as Sport,
      categoria: f.categoria as Categoria,
      puesto: f.puesto,
      pase: 'En trámite',
      numero: Number(f.numero) || 0,
      alias: f.apellido.trim().toUpperCase(),
      talle: f.talle,
      eficacia: 60,
      constancia: 60,
      practica: 4,
      fisico: 60,
      tactica: 60,
      asistencia: 100,
      coachId: data.coaches.find((c) => c.deporte === f.deporte)?.id ?? data.coaches[0].id,
      evolucion: [60, 60, 60, 60, 60, 60, 60, 60],
    }
    update('players', (prev) => [player, ...prev])
    toast.success('Ficha creada', { description: `${player.nombre} ${player.apellido} · pase en trámite` })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva ficha de jugador</DialogTitle>
          <DialogDescription>El pase queda en trámite hasta que se confirme la habilitación.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={f.nombre} onChange={(e) => set('nombre')(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="apellido">Apellido</Label>
              <Input id="apellido" value={f.apellido} onChange={(e) => set('apellido')(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edad">Edad</Label>
              <Input id="edad" type="number" min={5} max={60} value={f.edad} onChange={(e) => set('edad')(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="num">Número</Label>
              <Input id="num" inputMode="numeric" maxLength={2} value={f.numero} onChange={(e) => set('numero')(e.target.value.replace(/\D/g, ''))} />
            </div>
            <FormSelect id="talle-j" label="Talle" value={f.talle} onChange={set('talle')} options={TALLES.map((t) => ({ value: t, label: t }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormSelect id="dep-j" label="Deporte" value={f.deporte} onChange={set('deporte')} options={tenant.sports.map((s) => ({ value: s, label: s }))} />
            <FormSelect id="cat-j" label="Categoría" value={f.categoria} onChange={set('categoria')} options={CATEGORIAS.map((c) => ({ value: c, label: c }))} />
            <FormSelect
              id="puesto-j"
              label="Puesto"
              value={f.puesto}
              onChange={set('puesto')}
              options={PUESTOS[f.deporte as Sport].map((p) => ({ value: p, label: p }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear ficha</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
