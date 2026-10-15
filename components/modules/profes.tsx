'use client'

import { useState } from 'react'
import { Check, Minus, NotebookPen, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useClub } from '@/components/club/club-provider'
import { FormSelect, Initials, Meter, ModuleHeader, PageBody, Pill, Stat } from '@/components/club/shared'
import { TODAY, formatDay, type Coach, type CoachNote } from '@/lib/data'
import { cn } from '@/lib/utils'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']

export function ProfesModule() {
  const { data, update } = useClub()
  const [openId, setOpenId] = useState<string | null>(null)
  const today = TODAY.getDay() - 1

  const toggle = (c: Coach, day: number) => {
    if (day > today) return
    const nextVal = c.semana[day] === true ? false : true
    update('coaches', (prev) =>
      prev.map((x) =>
        x.id === c.id
          ? {
              ...x,
              semana: x.semana.map((v, i) => (i === day ? nextVal : v)),
              dictadas: x.dictadas + (nextVal ? 1 : -1),
            }
          : x,
      ),
    )
    toast.success(`${c.nombre}: ${nextVal ? 'presente' : 'ausente'} el ${DIAS[day].toLowerCase()}`)
  }

  const avgAsist = Math.round((data.coaches.reduce((s, c) => s + c.dictadas / c.planificadas, 0) / data.coaches.length) * 100)
  const avgCumpl = Math.round(data.coaches.reduce((s, c) => s + c.cumplimiento, 0) / data.coaches.length)
  const mejoras = data.coaches.flatMap((c) => c.notas).filter((n) => n.tipo === 'Mejora').length
  const current = data.coaches.find((c) => c.id === openId)

  return (
    <>
      <ModuleHeader
        eyebrow="Operación"
        title="Control de profes"
        description="Asistencia a entrenamientos, cumplimiento de la planificación y seguimiento de jugadores a cargo."
      />
      <PageBody>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Profes activos" value={data.coaches.length} />
          <Stat label="Asistencia promedio" value={`${avgAsist}%`} hint="entrenamientos dictados / planificados" />
          <Stat label="Cumplimiento de plan" value={`${avgCumpl}%`} />
          <Stat label="Mejoras registradas" value={mejoras} hint="este mes" />
        </div>

        <section aria-labelledby="semana" className="flex flex-col gap-3">
          <h2 id="semana" className="text-sm font-medium text-muted-foreground">
            Semana en curso · tocá un día para marcar asistencia
          </h2>
          <ul className="flex flex-col gap-3">
            {data.coaches.map((c) => {
              const players = data.players.filter((p) => p.coachId === c.id)
              const asist = Math.round((c.dictadas / c.planificadas) * 100)
              return (
                <li key={c.id} className="grid gap-4 rounded-xl border bg-card p-4 lg:grid-cols-[16rem_1fr_auto] lg:items-center">
                  <div className="flex items-center gap-3">
                    <Initials name={c.nombre} />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{c.nombre}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {c.deporte} · {c.categorias.join(', ')} · {players.length} jugadores
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                    <div className="flex gap-1.5" role="group" aria-label={`Asistencia semanal de ${c.nombre}`}>
                      {DIAS.map((d, i) => {
                        const v = c.semana[i]
                        const future = i > today
                        return (
                          <button
                            key={d}
                            type="button"
                            disabled={future}
                            onClick={() => toggle(c, i)}
                            aria-label={`${d}: ${future ? 'pendiente' : v ? 'presente' : 'ausente'}`}
                            className={cn(
                              'flex w-11 flex-col items-center gap-1 rounded-lg border py-1.5 text-[11px] font-medium transition',
                              future && 'cursor-not-allowed border-dashed text-muted-foreground/60',
                              !future && v && 'border-success/30 bg-success/10 text-success',
                              !future && v === false && 'border-destructive/30 bg-destructive/10 text-destructive',
                              i === today && 'ring-2 ring-primary/40',
                            )}
                          >
                            {d}
                            {future ? (
                              <Minus className="size-3.5" aria-hidden="true" />
                            ) : v ? (
                              <Check className="size-3.5" aria-hidden="true" />
                            ) : (
                              <X className="size-3.5" aria-hidden="true" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Asistencia</span>
                          <span className="font-medium tabular-nums">
                            {c.dictadas}/{c.planificadas} · {asist}%
                          </span>
                        </div>
                        <Meter value={asist} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Cumplimiento</span>
                          <span className="font-medium tabular-nums">{c.cumplimiento}%</span>
                        </div>
                        <Meter value={c.cumplimiento} />
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="gap-1.5 justify-self-start" onClick={() => setOpenId(c.id)}>
                    <NotebookPen className="size-4" aria-hidden="true" />
                    Seguimiento
                    <span className="rounded bg-muted px-1.5 text-xs tabular-nums">{c.notas.length}</span>
                  </Button>
                </li>
              )
            })}
          </ul>
        </section>
      </PageBody>

      <Sheet open={!!current} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">{current && <CoachSheet c={current} />}</SheetContent>
      </Sheet>
    </>
  )
}

function CoachSheet({ c }: { c: Coach }) {
  const { data, update, playerName } = useClub()
  const players = data.players.filter((p) => p.coachId === c.id)
  const [playerId, setPlayerId] = useState(players[0]?.id ?? '')
  const [tipo, setTipo] = useState<string>('Mejora')
  const [texto, setTexto] = useState('')

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerId || !texto.trim()) {
      toast.error('Elegí jugador y escribí la observación')
      return
    }
    const note: CoachNote = {
      fecha: TODAY.toISOString().slice(0, 10),
      playerId,
      tipo: tipo as CoachNote['tipo'],
      texto: texto.trim(),
    }
    update('coaches', (prev) => prev.map((x) => (x.id === c.id ? { ...x, notas: [note, ...x.notas] } : x)))
    setTexto('')
    toast.success('Seguimiento registrado', { description: playerName(playerId) })
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-display text-2xl font-bold uppercase">{c.nombre}</SheetTitle>
        <SheetDescription>
          {c.deporte} · {c.categorias.join(', ')}
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-6 px-4 pb-6">
        <form onSubmit={add} className="flex flex-col gap-3 rounded-xl bg-muted p-4">
          <h3 className="text-sm font-semibold">Nueva observación</h3>
          <div className="grid grid-cols-[1fr_8rem] gap-2">
            <FormSelect
              id="seg-jugador"
              label="Jugador"
              value={playerId}
              onChange={setPlayerId}
              options={players.map((p) => ({ value: p.id, label: `${p.nombre} ${p.apellido}` }))}
            />
            <FormSelect
              id="seg-tipo"
              label="Tipo"
              value={tipo}
              onChange={setTipo}
              options={['Mejora', 'Seguimiento', 'Alerta'].map((t) => ({ value: t, label: t }))}
            />
          </div>
          <Textarea
            aria-label="Observación"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Qué mejoró, qué hay que trabajar, próximos pasos…"
            className="bg-card"
          />
          <Button type="submit" size="sm" className="w-fit">
            Registrar
          </Button>
        </form>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Historial</h3>
          <ol className="flex flex-col gap-2">
            {c.notas.map((n, i) => (
              <li key={i} className="flex flex-col gap-1.5 rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{playerName(n.playerId)}</span>
                  <Pill tone={n.tipo === 'Mejora' ? 'ok' : n.tipo === 'Alerta' ? 'bad' : 'info'}>{n.tipo}</Pill>
                </div>
                <p className="leading-relaxed text-muted-foreground">{n.texto}</p>
                <span className="text-xs text-muted-foreground">{formatDay(n.fecha)}</span>
              </li>
            ))}
            {c.notas.length === 0 && <li className="text-sm text-muted-foreground">Sin observaciones todavía.</li>}
          </ol>
        </section>
      </div>
    </>
  )
}
