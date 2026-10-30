'use client'

import { useState } from 'react'
import { Clock, MapPin, Plus, Shirt } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useClub } from '@/components/club/club-provider'
import { KitSwatch } from '@/components/club/kit-swatch'
import { KIT_COLORS, colorName } from '@/lib/kit-colors'
import { FormSelect, ModuleHeader, PageBody, Pill, Segmented } from '@/components/club/shared'
import { useCreateDialog } from '@/hooks/use-url-state'
import { CATEGORIAS, TODAY, daysFromToday, formatDay, type Categoria, type Match } from '@/lib/data'
import type { Sport } from '@/lib/tenants'
import { cn } from '@/lib/utils'

type View = 'proximos' | 'jugados'

export function PartidosModule() {
  const { tenant, data, can } = useClub()
  const canCreate = can('matches.create')
  const [sport, setSport] = useState<'Todos' | Sport>('Todos')
  const [view, setView] = useState<View>('proximos')
  const [open, setOpen] = useCreateDialog()

  const list = data.matches
    .filter((m) => sport === 'Todos' || m.deporte === sport)
    .filter((m) => (view === 'proximos' ? daysFromToday(m.fecha) >= 0 : daysFromToday(m.fecha) < 0))
    .sort((a, b) => (view === 'proximos' ? 1 : -1) * (a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora)))

  const groups = list.reduce<Record<string, Match[]>>((acc, m) => {
    ;(acc[m.fecha] ??= []).push(m)
    return acc
  }, {})

  return (
    <>
      <ModuleHeader
        eyebrow="Deportivo"
        title="Partidos"
        description="Día, horario, sede y color de ropa de juego para cada categoría. Compartilo con planteles y familias."
        actions={
          canCreate && (
            <Button onClick={() => setOpen(true)} className="gap-1.5">
              <Plus className="size-4" aria-hidden="true" />
              Cargar partido
            </Button>
          )
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Vista"
            value={view}
            onChange={setView}
            options={[
              { value: 'proximos', label: 'Próximos' },
              { value: 'jugados', label: 'Jugados' },
            ]}
          />
          <Segmented
            label="Deporte"
            value={sport}
            onChange={setSport}
            options={[{ value: 'Todos', label: 'Todos' }, ...tenant.sports.map((s) => ({ value: s, label: s }))]}
          />
        </div>
      </ModuleHeader>

      <PageBody>
        {Object.entries(groups).map(([fecha, matches]) => {
          const d = daysFromToday(fecha)
          return (
            <section key={fecha} className="grid gap-3 md:grid-cols-[9rem_1fr]">
              <header className="flex items-baseline gap-2 md:flex-col md:gap-0 md:pt-2">
                <span className="font-display text-4xl font-bold leading-none tabular-nums">
                  {formatDay(fecha, { day: 'numeric' })}
                </span>
                <span className="inline-block text-sm font-medium first-letter:uppercase">
                  {formatDay(fecha, { weekday: 'long' })} · {formatDay(fecha, { month: 'short' })}
                </span>
                <span className={cn('text-xs', d === 0 ? 'font-semibold text-primary' : 'text-muted-foreground')}>
                  {d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : d > 0 ? `En ${d} días` : `Hace ${-d} días`}
                </span>
              </header>
              <ul className="flex flex-col gap-3">
                {matches.map((m) => (
                  <MatchCard key={m.id} m={m} short={tenant.short} />
                ))}
              </ul>
            </section>
          )
        })}
        {list.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No hay partidos para este filtro.</p>}
      </PageBody>

      {canCreate && <NewMatchDialog open={open} onOpenChange={setOpen} />}
    </>
  )
}

function MatchCard({ m, short }: { m: Match; short: string }) {
  const home = m.condicion === 'Local' ? short : m.rival
  const away = m.condicion === 'Local' ? m.rival : short
  const r = m.resultado
  const outcome = r ? (r.pf > r.pc ? 'ok' : r.pf === r.pc ? 'neutral' : 'bad') : null
  return (
    <li className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Pill tone="info">
            {m.deporte} · {m.categoria}
          </Pill>
          <span className="text-muted-foreground">{m.torneo}</span>
          <Pill tone={m.condicion === 'Local' ? 'ok' : 'neutral'}>{m.condicion}</Pill>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('font-display text-2xl font-bold uppercase leading-none', home === short && 'text-primary')}>
            {home}
          </span>
          <span className="font-display text-xl font-semibold tabular-nums text-muted-foreground">
            {r ? (m.condicion === 'Local' ? `${r.pf} – ${r.pc}` : `${r.pc} – ${r.pf}`) : 'vs'}
          </span>
          <span className={cn('font-display text-2xl font-bold uppercase leading-none', away === short && 'text-primary')}>
            {away}
          </span>
          {outcome && (
            <Pill tone={outcome} className="ml-1">
              {outcome === 'ok' ? 'G' : outcome === 'bad' ? 'P' : 'E'}
            </Pill>
          )}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden="true" />
            {m.hora} hs
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden="true" />
            {m.lugar} · {m.direccion}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 sm:flex-col sm:items-center sm:gap-1.5">
        <KitSwatch camiseta={m.camiseta} short={m.short} className="scale-150 sm:my-2" />
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Shirt className="size-3.5" aria-hidden="true" />
          {colorName(m.camiseta)} / {colorName(m.short)}
        </span>
      </div>
    </li>
  )
}

function NewMatchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { tenant, update } = useClub()
  const [form, setForm] = useState({
    deporte: tenant.sports[0] as string,
    categoria: 'Primera' as string,
    rival: '',
    condicion: 'Local' as string,
    fecha: TODAY.toISOString().slice(0, 10),
    hora: '19:00',
    lugar: 'Estadio Cubierto (sede)',
    camiseta: KIT_COLORS[0].value,
    short: KIT_COLORS[3].value,
  })
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.rival.trim()) {
      toast.error('Indicá el rival')
      return
    }
    const match: Match = {
      id: `g${Date.now()}`,
      deporte: form.deporte as Sport,
      categoria: form.categoria as Categoria,
      torneo: 'Amistoso',
      rival: form.rival.trim(),
      condicion: form.condicion as Match['condicion'],
      fecha: form.fecha,
      hora: form.hora,
      lugar: form.lugar,
      direccion: form.condicion === 'Local' ? tenant.city : 'A confirmar',
      camiseta: form.camiseta,
      short: form.short,
    }
    update('matches', (prev) => [...prev, match])
    toast.success('Partido cargado', { description: `${match.rival} · ${formatDay(match.fecha)} ${match.hora}` })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Cargar partido</DialogTitle>
          <DialogDescription>Se notifica a planteles con día, horario, lugar y ropa de juego.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <FormSelect id="dep" label="Deporte" value={form.deporte} onChange={set('deporte')} options={tenant.sports.map((s) => ({ value: s, label: s }))} />
            <FormSelect id="cat" label="Categoría" value={form.categoria} onChange={set('categoria')} options={CATEGORIAS.map((c) => ({ value: c, label: c }))} />
          </div>
          <div className="grid grid-cols-[1fr_9rem] gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="rival">Rival</Label>
              <Input id="rival" value={form.rival} onChange={(e) => set('rival')(e.target.value)} placeholder="Nombre del club rival" />
            </div>
            <FormSelect id="cond" label="Condición" value={form.condicion} onChange={set('condicion')} options={['Local', 'Visitante'].map((c) => ({ value: c, label: c }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fecha">Día</Label>
              <Input id="fecha" type="date" value={form.fecha} onChange={(e) => set('fecha')(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="hora">Horario</Label>
              <Input id="hora" type="time" value={form.hora} onChange={(e) => set('hora')(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lugar">Lugar</Label>
            <Input id="lugar" value={form.lugar} onChange={(e) => set('lugar')(e.target.value)} />
          </div>
          <fieldset className="grid grid-cols-2 gap-3">
            <legend className="sr-only">Ropa de juego</legend>
            {(['camiseta', 'short'] as const).map((part) => (
              <div key={part} className="flex flex-col gap-2">
                <span className="text-sm font-medium capitalize">{part}</span>
                <div className="flex flex-wrap gap-2">
                  {KIT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => set(part)(c.value)}
                      aria-label={`${part} ${c.label}`}
                      aria-pressed={form[part] === c.value}
                      className={cn(
                        'size-7 rounded-full ring-1 ring-foreground/15 transition',
                        form[part] === c.value && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                      )}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </fieldset>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar partido</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
