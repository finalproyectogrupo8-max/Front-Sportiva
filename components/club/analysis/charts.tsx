'use client'

import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import { RESULT, shortDate, STATUS, type ByStatus, type CategoryDetail } from './shared'

// Gráficos del módulo Análisis. Colores validados (dataviz): el terracota de la marca para lo propio
// y un azul para el rival, con sus pasos de modo oscuro. Viven solo en este módulo.
export const CHART_COLORS = '[--an-own:#ad4c2b] [--an-rival:#2f6aa3] dark:[--an-own:#d36f45] dark:[--an-rival:#5d8fd0]'

const weeklyConfig = { rate: { label: 'Asistencia', color: 'var(--an-own)' } } satisfies ChartConfig

/** Asistencia semana a semana (presentes y tardes sobre lo registrado). Las semanas sin registros quedan vacías. */
export function WeeklyAttendanceChart({ weekly }: { weekly: CategoryDetail['weekly'] }) {
  const data = weekly.map((w) => ({ semana: shortDate(`${w.week_start}T12:00:00Z`), rate: w.rate, detalle: `${w.present} de ${w.recorded}` }))
  return (
    <>
      <ChartContainer config={weeklyConfig} className="h-56 w-full">
        <LineChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="semana" tickLine={false} axisLine={false} fontSize={12} interval="preserveStartEnd" minTickGap={24} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} fontSize={12} width={40} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(label) => `Semana del ${label}`}
                formatter={(value, _name, item) => (
                  <span className="flex w-full justify-between gap-3">
                    <span className="text-muted-foreground">Asistencia</span>
                    <span className="font-medium tabular-nums">
                      {value}% · {item.payload.detalle}
                    </span>
                  </span>
                )}
              />
            }
          />
          <Line dataKey="rate" stroke="var(--color-rate)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: 'var(--card)' }} activeDot={{ r: 5 }} type="monotone" connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ChartContainer>
      <div className="sr-only">
        <table>
        <caption>Asistencia por semana</caption>
        <tbody>
          {weekly.map((w) => (
            <tr key={w.week_start}>
              <th scope="row">Semana del {shortDate(`${w.week_start}T12:00:00Z`)}</th>
              <td>{w.rate === null ? 'Sin registros' : `${w.rate}% (${w.present} de ${w.recorded})`}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </>
  )
}

const resultsConfig = {
  propios: { label: 'A favor', color: 'var(--an-own)' },
  rival: { label: 'En contra', color: 'var(--an-rival)' },
} satisfies ChartConfig

/** Tantos a favor y en contra de cada partido jugado, en orden. */
export function ResultsChart({ matches }: { matches: CategoryDetail['matches'] }) {
  const data = matches.map((m) => ({ partido: `${m.opponent} · ${shortDate(m.date)}`, rival: m.opponent_score, propios: m.our_score, resultado: RESULT[m.result].label }))
  return (
    <>
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground" aria-hidden="true">
        {(['propios', 'rival'] as const).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: resultsConfig[k].color }} />
            {resultsConfig[k].label}
          </span>
        ))}
      </div>
      <ChartContainer config={resultsConfig} className="h-60 w-full">
        <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }} barGap={2} barCategoryGap="28%">
          <CartesianGrid vertical={false} />
          <XAxis dataKey="partido" tickLine={false} axisLine={false} fontSize={12} interval="preserveStartEnd" minTickGap={16} tickFormatter={(v: string) => v.split(' · ')[0]} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} allowDecimals={false} />
          <ChartTooltip cursor={{ fill: 'var(--muted)', opacity: 0.5 }} content={<ChartTooltipContent labelFormatter={(label, payload) => `${label} · ${payload?.[0]?.payload?.resultado ?? ''}`} />} />
          <Bar dataKey="propios" fill="var(--color-propios)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          <Bar dataKey="rival" fill="var(--color-rival)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
      <div className="sr-only">
        <table>
        <caption>Resultados partido a partido</caption>
        <tbody>
          {matches.map((m) => (
            <tr key={m.id}>
              <th scope="row">
                {m.opponent}, {shortDate(m.date)}
              </th>
              <td>
                {m.our_score} a {m.opponent_score}, {RESULT[m.result].label.toLowerCase()}
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </>
  )
}

/** Cómo se reparten los registros de asistencia, con etiqueta y cantidad (nunca solo color). */
export function StatusBreakdown({ byStatus, compact = false }: { byStatus: ByStatus; compact?: boolean }) {
  const total = STATUS.reduce((sum, s) => sum + byStatus[s.key], 0)
  if (total === 0) return <p className="text-sm text-muted-foreground">Todavía no hay asistencia registrada en este período.</p>
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        {STATUS.filter((s) => byStatus[s.key] > 0).map((s) => (
          <span key={s.key} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(byStatus[s.key] / total) * 100}%`, background: s.color }} />
        ))}
      </div>
      <dl className={cn('grid gap-x-4 gap-y-1.5 text-sm', compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4')}>
        {STATUS.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
            <dt className="text-muted-foreground">{s.label}</dt>
            <dd className="ml-auto font-medium tabular-nums">
              {byStatus[s.key]}
              <span className="ml-1 text-xs font-normal text-muted-foreground">{Math.round((byStatus[s.key] / total) * 100)}%</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

const trendConfig = { valor: { label: 'Valor', color: 'var(--an-own)' } } satisfies ChartConfig

/** Evolución de una prueba física de un jugador. */
export function MetricTrend({ name, unit, points }: { name: string; unit: string | null; points: { at: string; value: number }[] }) {
  const data = points.map((p) => ({ fecha: shortDate(p.at), valor: p.value }))
  const first = points[0]?.value
  const last = points.at(-1)?.value
  const delta = first !== undefined && last !== undefined && points.length > 1 ? Math.round((last - first) * 100) / 100 : null

  return (
    <figure className="flex flex-col gap-2 rounded-lg border p-3">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-sm tabular-nums">
          <span className="font-semibold">{last}</span> {unit}
          {delta !== null && delta !== 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({delta > 0 ? '+' : ''}
              {delta} desde la primera)
            </span>
          )}
        </span>
      </figcaption>
      {points.length < 2 ? (
        <p className="text-xs text-muted-foreground">Una sola medición. Con la próxima se ve la evolución.</p>
      ) : (
        <ChartContainer config={trendConfig} className="h-28 w-full">
          <LineChart data={data} margin={{ left: 0, right: 8, top: 6, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="fecha" tickLine={false} axisLine={false} fontSize={11} interval="preserveStartEnd" />
            <YAxis tickLine={false} axisLine={false} fontSize={11} domain={['auto', 'auto']} width={44} />
            <ChartTooltip content={<ChartTooltipContent formatter={(value) => <span className="font-medium tabular-nums">{value} {unit}</span>} />} />
            <Line dataKey="valor" stroke="var(--color-valor)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: 'var(--card)' }} type="monotone" isAnimationActive={false} />
          </LineChart>
        </ChartContainer>
      )}
    </figure>
  )
}
