'use client'

import { useMemo, useState } from 'react'
import { Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useClub } from '@/components/club/club-provider'
import { FormSelect, Meter, ModuleHeader, PageBody, Pill, Segmented, Stat } from '@/components/club/shared'
import { useUrlParam } from '@/hooks/use-url-state'
import { PUESTOS, type Player } from '@/lib/data'
import type { Sport } from '@/lib/tenants'
import { cn } from '@/lib/utils'

const radarConfig = {
  jugador: { label: 'Jugador', color: 'var(--chart-1)' },
  puesto: { label: 'Promedio del plantel', color: 'var(--chart-2)' },
} satisfies ChartConfig

const lineConfig = {
  valor: { label: 'Índice', color: 'var(--chart-1)' },
} satisfies ChartConfig

function score(p: Player) {
  return Math.round(p.eficacia * 0.4 + p.constancia * 0.25 + (p.practica / 12) * 100 * 0.15 + p.asistencia * 0.2)
}

export function AnalisisModule() {
  const { tenant, data } = useClub()
  const [sport, setSport] = useState<Sport>(tenant.sports[0])
  const [selected, setSelected] = useUrlParam('id')
  const [sortKey, setSortKey] = useState<'score' | 'eficacia' | 'constancia' | 'practica'>('score')

  const players = data.players.filter((p) => p.deporte === sport)
  const current = data.players.find((p) => p.id === selected && p.deporte === sport) ?? players[0]

  const peers = useMemo(
    () => players.filter((p) => p.id !== current?.id),
    [players, current?.id],
  )
  const avg = (k: keyof Player) => Math.round(peers.reduce((s, p) => s + (p[k] as number), 0) / Math.max(peers.length, 1))

  const radarData = current
    ? [
        { eje: 'Eficacia', jugador: current.eficacia, puesto: avg('eficacia') },
        { eje: 'Constancia', jugador: current.constancia, puesto: avg('constancia') },
        { eje: 'Práctica', jugador: Math.round((current.practica / 12) * 100), puesto: Math.round((avg('practica') / 12) * 100) },
        { eje: 'Físico', jugador: current.fisico, puesto: avg('fisico') },
        { eje: 'Táctica', jugador: current.tactica, puesto: avg('tactica') },
        { eje: 'Asistencia', jugador: current.asistencia, puesto: avg('asistencia') },
      ]
    : []

  const evo = current?.evolucion.map((v, i) => ({ semana: `S${i + 1}`, valor: v })) ?? []
  const trend = current ? current.evolucion[7] - current.evolucion[0] : 0

  const ranking = [...players].sort((a, b) =>
    sortKey === 'score' ? score(b) - score(a) : (b[sortKey] as number) - (a[sortKey] as number),
  )

  const byPuesto = PUESTOS[sport].map((puesto) => {
    const ps = players.filter((p) => p.puesto === puesto)
    return {
      puesto,
      n: ps.length,
      eficacia: Math.round(ps.reduce((s, p) => s + p.eficacia, 0) / Math.max(ps.length, 1)),
    }
  })

  return (
    <>
      <ModuleHeader
        eyebrow="Deportivo"
        title="Análisis de jugadores"
        description="Eficacia, constancia y horas de práctica comparadas contra el promedio del plantel."
      >
        <Segmented
          label="Deporte"
          value={sport}
          onChange={(s) => {
            setSport(s)
            setSelected(null)
          }}
          options={tenant.sports.map((s) => ({ value: s, label: s }))}
        />
      </ModuleHeader>

      <PageBody>
        {current && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <section className="flex flex-col gap-4 rounded-xl border bg-card p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div className="w-full sm:max-w-xs">
                  <FormSelect
                    id="jugador-analisis"
                    label="Jugador"
                    value={current.id}
                    onChange={(v) => setSelected(v)}
                    options={players.map((p) => ({ value: p.id, label: `${p.nombre} ${p.apellido} · ${p.puesto}` }))}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Índice</span>
                  <span className="font-display text-4xl font-bold leading-none tabular-nums text-primary">{score(current)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {current.puesto} · {current.categoria} · #{current.numero}
                </span>
                <span>Comparado con {peers.length} jugadores del plantel</span>
              </div>
              <ChartContainer config={radarConfig} className="mx-auto aspect-square w-full max-w-md">
                <RadarChart data={radarData}>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <PolarGrid />
                  <PolarAngleAxis dataKey="eje" tick={{ fontSize: 12 }} />
                  <Radar dataKey="puesto" stroke="var(--color-puesto)" fill="var(--color-puesto)" fillOpacity={0.12} strokeDasharray="4 4" />
                  <Radar dataKey="jugador" stroke="var(--color-jugador)" fill="var(--color-jugador)" fillOpacity={0.3} />
                </RadarChart>
              </ChartContainer>
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-chart-1" aria-hidden="true" /> Jugador
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-chart-2" aria-hidden="true" /> Promedio del plantel
                </span>
              </div>
            </section>

            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Eficacia" value={`${current.eficacia}%`} hint={`Plantel: ${avg('eficacia')}%`} />
                <Stat label="Constancia" value={`${current.constancia}%`} hint={`Plantel: ${avg('constancia')}%`} />
                <Stat label="Práctica" value={`${current.practica}h`} hint="por semana" />
              </div>
              <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Evolución · últimas 8 semanas</h2>
                  <Pill tone={trend >= 0 ? 'ok' : 'bad'}>
                    {trend >= 0 ? '+' : ''}
                    {trend} pts
                  </Pill>
                </div>
                <ChartContainer config={lineConfig} className="h-48 w-full">
                  <LineChart data={evo} margin={{ left: -20, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="semana" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis domain={[30, 100]} tickLine={false} axisLine={false} fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line dataKey="valor" stroke="var(--color-valor)" strokeWidth={2.5} dot={{ r: 3 }} type="monotone" />
                  </LineChart>
                </ChartContainer>
              </section>
              <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
                <h2 className="text-sm font-semibold">Eficacia media por puesto</h2>
                {byPuesto.map((b) => (
                  <div key={b.puesto} className="flex items-center gap-3 text-sm">
                    <span className={cn('w-28 truncate', b.puesto === current.puesto && 'font-semibold text-primary')}>
                      {b.puesto}
                    </span>
                    <Meter value={b.eficacia} />
                    <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">
                      {b.eficacia}% · {b.n}
                    </span>
                  </div>
                ))}
              </section>
            </div>
          </div>
        )}

        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">Ranking del plantel · {sport}</h2>
            <Segmented
              label="Ordenar por"
              value={sortKey}
              onChange={setSortKey}
              options={[
                { value: 'score', label: 'Índice' },
                { value: 'eficacia', label: 'Eficacia' },
                { value: 'constancia', label: 'Constancia' },
                { value: 'practica', label: 'Práctica' },
              ]}
            />
          </div>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ranking.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(p.id)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left transition hover:border-primary/40',
                    current?.id === p.id && 'border-primary ring-1 ring-primary',
                  )}
                >
                  <span className="w-6 font-display text-lg font-bold tabular-nums text-muted-foreground">{i + 1}</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {p.nombre} {p.apellido}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {p.puesto} · {p.categoria}
                    </span>
                  </span>
                  <span className="font-display text-xl font-bold tabular-nums">
                    {sortKey === 'score' ? score(p) : sortKey === 'practica' ? `${p.practica}h` : `${p[sortKey]}%`}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      </PageBody>
    </>
  )
}
