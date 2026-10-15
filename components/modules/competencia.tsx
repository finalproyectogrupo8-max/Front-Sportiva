'use client'

import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useClub } from '@/components/club/club-provider'
import { Meter, ModuleHeader, PageBody, Pill, Segmented, Stat } from '@/components/club/shared'
import { points } from '@/lib/data'
import type { Sport } from '@/lib/tenants'
import { cn } from '@/lib/utils'

const config = {
  pf: { label: 'A favor', color: 'var(--chart-1)' },
  pc: { label: 'En contra', color: 'var(--chart-5)' },
} satisfies ChartConfig

export function CompetenciaModule() {
  const { tenant, data } = useClub()
  const [sport, setSport] = useState<Sport>(tenant.sports[0])

  const standing = data.standings.find((s) => s.deporte === sport)!
  const rows = [...standing.rows].sort((a, b) => points(b) - points(a) || b.pf - b.pc - (a.pf - a.pc))
  const pos = rows.findIndex((r) => r.propio) + 1
  const own = rows[pos - 1]
  const unit = sport === 'Básquet' ? 'pts' : sport === 'Fútbol' ? 'goles' : 'sets'
  const unitLabel = unit.charAt(0).toUpperCase() + unit.slice(1)

  const played = data.matches
    .filter((m) => m.deporte === sport && m.resultado)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((m) => ({ rival: m.rival.split(' ')[0], pf: m.resultado!.pf, pc: m.resultado!.pc }))

  const objectives = data.objectives
    .filter((o) => o.deporte === sport)
    .map((o) => (o.unidad === 'puesto' ? { ...o, actual: pos } : o))

  return (
    <>
      <ModuleHeader
        eyebrow="Deportivo"
        title="Proyecto deportivo"
        description="Objetivos de temporada, tabla de posiciones, puntos a favor y en contra, y estadísticas por partido."
      >
        <Segmented label="Deporte" value={sport} onChange={setSport} options={tenant.sports.map((s) => ({ value: s, label: s }))} />
      </ModuleHeader>

      <PageBody>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat label="Posición" value={`${pos}°`} hint={standing.torneo} />
          <Stat label="Puntos" value={points(own)} hint={`${own.pg}G · ${own.pp}P`} />
          <Stat label={`${unitLabel} a favor`} value={own.pf} hint={`${(own.pf / own.pj).toFixed(1)} por partido`} />
          <Stat label={`${unitLabel} en contra`} value={own.pc} hint={`${(own.pc / own.pj).toFixed(1)} por partido`} />
          <Stat
            label="Diferencia"
            value={<span className={own.pf - own.pc >= 0 ? 'text-success' : 'text-destructive'}>{own.pf - own.pc > 0 ? '+' : ''}{own.pf - own.pc}</span>}
            hint={`${Math.round((own.pg / own.pj) * 100)}% de efectividad`}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <section aria-labelledby="tabla" className="flex flex-col gap-3">
            <h2 id="tabla" className="text-sm font-medium text-muted-foreground">
              Tabla · {standing.torneo} · {standing.categoria}
            </h2>
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-sm tabular-nums">
                <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    {['#', 'Equipo', 'PJ', 'PG', 'PP', 'PF', 'PC', 'Dif', 'Pts'].map((h, i) => (
                      <th key={h} scope="col" className={cn('px-3 py-2.5 font-medium', i === 1 ? 'text-left' : 'text-right')}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((r, i) => (
                    <tr key={r.equipo} className={cn(r.propio && 'bg-primary/8 font-semibold')}>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={cn(
                            'inline-flex size-6 items-center justify-center rounded-md text-xs',
                            i < 4 ? 'bg-success/15 text-success' : 'text-muted-foreground',
                          )}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className={cn('whitespace-nowrap px-3 py-2.5', r.propio && 'text-primary')}>{r.equipo}</td>
                      <td className="px-3 py-2.5 text-right">{r.pj}</td>
                      <td className="px-3 py-2.5 text-right">{r.pg}</td>
                      <td className="px-3 py-2.5 text-right">{r.pp}</td>
                      <td className="px-3 py-2.5 text-right">{r.pf}</td>
                      <td className="px-3 py-2.5 text-right">{r.pc}</td>
                      <td className="px-3 py-2.5 text-right">{r.pf - r.pc > 0 ? '+' : ''}{r.pf - r.pc}</td>
                      <td className="px-3 py-2.5 text-right font-display text-base font-bold">{points(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">Los 4 primeros clasifican a playoffs.</p>
          </section>

          <div className="flex flex-col gap-6">
            <section aria-labelledby="obj" className="flex flex-col gap-3">
              <h2 id="obj" className="text-sm font-medium text-muted-foreground">
                Objetivos de temporada
              </h2>
              <ul className="flex flex-col gap-3">
                {objectives.map((o) => {
                  const isPos = o.unidad === 'puesto'
                  const met = isPos ? o.actual <= o.meta : o.actual >= o.meta
                  const pct = isPos ? Math.min(100, (o.meta / o.actual) * 100) : (o.actual / o.meta) * 100
                  return (
                    <li key={o.id} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium leading-snug">{o.titulo}</span>
                        <Pill tone={met ? 'ok' : pct >= 80 ? 'warn' : 'bad'}>{met ? 'Cumplido' : pct >= 80 ? 'Cerca' : 'En riesgo'}</Pill>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-2xl font-bold leading-none tabular-nums">
                          {isPos ? `${o.actual}°` : o.actual}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / meta {isPos ? `top ${o.meta}` : `${o.meta} ${o.unidad}`}
                        </span>
                      </div>
                      <Meter value={pct} tone={met ? 'ok' : pct >= 80 ? 'warn' : 'bad'} />
                    </li>
                  )
                })}
              </ul>
            </section>
          </div>
        </div>

        <section className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold">
            {unit.charAt(0).toUpperCase() + unit.slice(1)} a favor y en contra · partidos jugados
          </h2>
          {played.length ? (
            <ChartContainer config={config} className="h-64 w-full">
              <BarChart data={played} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="rival" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pf" fill="var(--color-pf)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pc" fill="var(--color-pc)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Todavía no hay partidos jugados en {sport}.</p>
          )}
        </section>
      </PageBody>
    </>
  )
}
