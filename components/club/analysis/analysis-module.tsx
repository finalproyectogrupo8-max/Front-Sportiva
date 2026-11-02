'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Activity, ClipboardList, Plus, Trash2, TrendingUp } from 'lucide-react'
import { deleteEvaluationAction, saveEvaluationAction } from '@/app/(app)/c/[club]/analisis/actions'
import { EmptyConfig } from '@/components/club/empty-state'
import { ConfigSheet, ConfirmDialog, Field, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { FormSelect, Meter, ModuleHeader, PageBody, Pill, Segmented, Stat, type Tone } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Rate = { recorded: number; present: number; rate: number | null }
type CategoryStats = {
  category_id: number
  category_name: string
  players: number
  attendance: Rate
  sessions: number
  results: { played: number; won: number; drawn: number; lost: number; goals_for: number; goals_against: number; form: ('W' | 'D' | 'L')[] }
  evaluations: number
}
type PlayerStats = {
  player_id: number
  player_name: string
  attendance: Rate
  by_status: { present: number; late: number; excused: number; absent: number }
  absent_streak: number
  evaluations: number
  last_evaluated_at: string | null
}
type Measurement = { metric_key: string; metric_name: string; numeric_value: number | null; unit: string | null; text_value: string | null }
type Evaluation = {
  id: number
  player_id: number
  player_name?: string
  evaluator_coach_id: number | null
  evaluator_name?: string | null
  evaluated_at: string
  summary: string | null
  recommendations: string | null
  measurements?: Measurement[]
}
type Named = { id: number; name: string }

const PERIODS = [
  { value: '30', label: '30 días' },
  { value: '90', label: '3 meses' },
  { value: '180', label: '6 meses' },
] as const

/** Pruebas habituales, para no tipear el nombre y la unidad cada vez. */
const PRESETS = [
  { name: 'Velocidad 30 m', unit: 's' },
  { name: 'Salto vertical', unit: 'cm' },
  { name: 'Resistencia (Course Navette)', unit: 'etapa' },
  { name: 'Flexibilidad', unit: 'cm' },
  { name: 'Peso', unit: 'kg' },
  { name: 'Altura', unit: 'cm' },
]

const FORM: Record<'W' | 'D' | 'L', { label: string; tone: Tone }> = {
  W: { label: 'G', tone: 'ok' },
  D: { label: 'E', tone: 'neutral' },
  L: { label: 'P', tone: 'bad' },
}

const rateTone = (rate: number | null): Tone => (rate === null ? 'neutral' : rate >= 80 ? 'ok' : rate >= 60 ? 'warn' : 'bad')
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
/** Código estable de la prueba a partir del nombre: "Velocidad 30 m" → "velocidad_30_m". */
const metricKey = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 80)

export function AnalysisModule({
  period,
  categories,
  categoryId,
  players,
  evaluations,
  coaches,
  view,
  can,
}: {
  period: string
  categories: CategoryStats[]
  categoryId: number | null
  players: PlayerStats[]
  evaluations: Evaluation[]
  coaches: Named[]
  view: 'jugadores' | 'evaluaciones'
  can: { create: boolean; update: boolean; delete: boolean }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const category = categories.find((c) => c.category_id === categoryId)

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.replace(`${pathname}?${params}`, { scroll: false })
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Deportivo"
        title="Análisis"
        description="Asistencia, resultados y evaluaciones físicas de cada categoría, calculados con lo que carga el club."
      >
        <Segmented label="Período" value={period} onChange={(v) => setParam('periodo', v)} options={PERIODS.map((p) => ({ ...p }))} />
      </ModuleHeader>

      <PageBody>
        {categories.length === 0 ? (
          <EmptyConfig icon={Activity} title="No hay categorías para analizar" description="Cuando haya categorías activas con asistencia o partidos cargados, sus indicadores aparecen acá." />
        ) : (
          <>
            <section aria-labelledby="categorias" className="flex flex-col gap-3">
              <h2 id="categorias" className="text-base font-semibold">
                Categorías
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {categories.map((c) => {
                  const active = c.category_id === categoryId
                  return (
                    <li key={c.category_id}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => setParam('categoria', String(c.category_id))}
                        className={cn(
                          'flex w-full flex-col gap-3 rounded-xl border bg-card p-4 text-left transition hover:border-primary/50',
                          active && 'border-primary ring-2 ring-primary/20',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{c.category_name}</span>
                          <span className="text-xs text-muted-foreground">{c.players} jugadores</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Asistencia · {c.sessions} sesiones</span>
                            <span className="font-medium tabular-nums text-foreground">{c.attendance.rate === null ? 'Sin datos' : `${c.attendance.rate}%`}</span>
                          </div>
                          <Meter value={c.attendance.rate ?? 0} tone={rateTone(c.attendance.rate)} />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="tabular-nums">
                            {c.results.played ? `${c.results.won}G · ${c.results.drawn}E · ${c.results.lost}P` : 'Sin partidos jugados'}
                          </span>
                          <span className="flex gap-1" aria-label={c.results.form.length ? `Últimos resultados: ${c.results.form.map((f) => FORM[f].label).join(', ')}` : undefined}>
                            {c.results.form.map((f, i) => (
                              <Pill key={i} tone={FORM[f].tone} className="px-1.5">
                                {FORM[f].label}
                              </Pill>
                            ))}
                          </span>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>

            {category && (
              <section aria-labelledby="detalle" className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 id="detalle" className="text-base font-semibold">
                    {category.category_name}
                  </h2>
                  <Segmented
                    label="Vista"
                    value={view}
                    onChange={(v) => setParam('vista', v)}
                    options={[
                      { value: 'jugadores', label: 'Jugadores' },
                      { value: 'evaluaciones', label: 'Evaluaciones físicas', count: evaluations.length },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Stat label="Asistencia" value={category.attendance.rate === null ? '—' : `${category.attendance.rate}%`} hint={`${category.attendance.present} de ${category.attendance.recorded} registros`} />
                  <Stat
                    label="Partidos ganados"
                    value={category.results.played ? `${Math.round((category.results.won / category.results.played) * 100)}%` : '—'}
                    hint={`${category.results.won} de ${category.results.played} jugados`}
                  />
                  <Stat
                    label="Diferencia de gol"
                    value={category.results.played ? `${category.results.goals_for - category.results.goals_against > 0 ? '+' : ''}${category.results.goals_for - category.results.goals_against}` : '—'}
                    hint={`${category.results.goals_for} a favor · ${category.results.goals_against} en contra`}
                  />
                  <Stat label="Evaluaciones" value={category.evaluations} hint="en el período" />
                </div>

                {view === 'jugadores' ? (
                  <PlayersTable players={players} />
                ) : (
                  <Evaluations evaluations={evaluations} players={players} coaches={coaches} can={can} />
                )}
              </section>
            )}
          </>
        )}
      </PageBody>
    </>
  )
}

function PlayersTable({ players }: { players: PlayerStats[] }) {
  if (players.length === 0) {
    return <EmptyConfig icon={Activity} title="Sin jugadores en la categoría" description="Sumá jugadores al plantel para ver su asistencia." />
  }
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">Asistencia y evaluaciones por jugador</caption>
        <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">Jugador</th>
            <th scope="col" className="w-48 px-3 py-2 text-left font-medium">Asistencia</th>
            <th scope="col" className="px-2 py-2 text-right font-medium"><abbr title="Presente" className="no-underline">P</abbr></th>
            <th scope="col" className="px-2 py-2 text-right font-medium"><abbr title="Tarde" className="no-underline">T</abbr></th>
            <th scope="col" className="px-2 py-2 text-right font-medium"><abbr title="Ausente con aviso" className="no-underline">AA</abbr></th>
            <th scope="col" className="px-2 py-2 text-right font-medium"><abbr title="Ausente sin aviso" className="no-underline">F</abbr></th>
            <th scope="col" className="px-3 py-2 text-left font-medium">Evaluación física</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.player_id} className="border-b last:border-0">
              <td className="px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{p.player_name}</span>
                  {p.absent_streak >= 2 && <Pill tone="bad">{p.absent_streak} faltas seguidas</Pill>}
                </div>
              </td>
              <td className="px-3 py-2">
                {p.attendance.rate === null ? (
                  <span className="text-muted-foreground">Sin registros</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <Meter value={p.attendance.rate} tone={rateTone(p.attendance.rate)} />
                    <span className="w-10 text-right tabular-nums">{p.attendance.rate}%</span>
                  </div>
                )}
              </td>
              <td className="px-2 py-2 text-right tabular-nums">{p.by_status.present}</td>
              <td className="px-2 py-2 text-right tabular-nums">{p.by_status.late}</td>
              <td className="px-2 py-2 text-right tabular-nums">{p.by_status.excused}</td>
              <td className={cn('px-2 py-2 text-right tabular-nums', p.by_status.absent > 0 && 'font-semibold text-destructive')}>{p.by_status.absent}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {p.last_evaluated_at ? `${p.evaluations} · última ${shortDate(p.last_evaluated_at)}` : 'Nunca'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const chartConfig = { valor: { label: 'Valor', color: 'var(--chart-1)' } } satisfies ChartConfig

function Evaluations({
  evaluations,
  players,
  coaches,
  can,
}: {
  evaluations: Evaluation[]
  players: PlayerStats[]
  coaches: Named[]
  can: { create: boolean; update: boolean; delete: boolean }
}) {
  const [editing, setEditing] = useState<Evaluation | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Evaluation | null>(null)

  // Pruebas numéricas cargadas, para el gráfico de evolución.
  const metrics = useMemo(() => {
    const seen = new Map<string, { name: string; unit: string | null }>()
    for (const e of evaluations) for (const m of e.measurements ?? []) if (m.numeric_value !== null && !seen.has(m.metric_key)) seen.set(m.metric_key, { name: m.metric_name, unit: m.unit })
    return [...seen].map(([key, v]) => ({ key, ...v }))
  }, [evaluations])
  const evaluatedPlayers = useMemo(() => [...new Map(evaluations.map((e) => [e.player_id, e.player_name ?? `#${e.player_id}`]))], [evaluations])
  const [metric, setMetric] = useState('')
  const [playerId, setPlayerId] = useState('')
  const selectedMetric = metrics.find((m) => m.key === metric) ?? metrics[0]
  const selectedPlayer = Number(playerId) || evaluatedPlayers[0]?.[0]
  const series = evaluations
    .filter((e) => e.player_id === selectedPlayer)
    .map((e) => ({ fecha: shortDate(e.evaluated_at), at: e.evaluated_at, valor: e.measurements?.find((m) => m.metric_key === selectedMetric?.key)?.numeric_value ?? null }))
    .filter((p) => p.valor !== null)
    .sort((a, b) => a.at.localeCompare(b.at))

  return (
    <div className="flex flex-col gap-4">
      {can.create && (
        <Button className="w-fit gap-2" onClick={() => setEditing('new')} disabled={players.length === 0}>
          <Plus className="size-4" aria-hidden="true" />
          Nueva evaluación
        </Button>
      )}

      {evaluations.length === 0 ? (
        <EmptyConfig icon={ClipboardList} title="Sin evaluaciones físicas" description="Cargá las pruebas de cada jugador (velocidad, salto, resistencia…) para seguir su evolución." />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <section aria-labelledby="evolucion" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <h3 id="evolucion" className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="size-4 text-primary" aria-hidden="true" />
              Evolución
            </h3>
            {metrics.length === 0 ? (
              <p className="text-sm text-muted-foreground">Las pruebas cargadas no tienen valores numéricos para graficar.</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormSelect id="evo-jugador" label="Jugador" value={String(selectedPlayer ?? '')} onChange={setPlayerId} options={evaluatedPlayers.map(([id, name]) => ({ value: String(id), label: name }))} />
                  <FormSelect id="evo-prueba" label="Prueba" value={selectedMetric?.key ?? ''} onChange={setMetric} options={metrics.map((m) => ({ value: m.key, label: m.unit ? `${m.name} (${m.unit})` : m.name }))} />
                </div>
                {series.length < 2 ? (
                  <p className="text-sm text-muted-foreground">
                    {series.length === 1 ? `Una sola medición: ${series[0].valor} ${selectedMetric?.unit ?? ''}. Con la próxima se ve la evolución.` : 'Este jugador no tiene esta prueba.'}
                  </p>
                ) : (
                  <ChartContainer config={chartConfig} className="h-48 w-full">
                    <LineChart data={series} margin={{ left: -12, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="fecha" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} domain={['auto', 'auto']} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line dataKey="valor" stroke="var(--color-valor)" strokeWidth={2.5} dot={{ r: 3 }} type="monotone" />
                    </LineChart>
                  </ChartContainer>
                )}
              </>
            )}
          </section>

          <ul className="flex flex-col gap-2" aria-label="Evaluaciones cargadas">
            {evaluations.map((e) => (
              <li key={e.id} className="flex flex-col gap-2 rounded-xl border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{e.player_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(e.evaluated_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {e.evaluator_name ? ` · ${e.evaluator_name}` : ''}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {can.update && (
                      <Button variant="ghost" size="sm" onClick={() => setEditing(e)}>
                        Editar
                      </Button>
                    )}
                    {can.delete && (
                      <Button variant="ghost" size="icon-sm" aria-label={`Eliminar la evaluación de ${e.player_name}`} onClick={() => setDeleting(e)}>
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
                <ul className="flex flex-wrap gap-1.5">
                  {(e.measurements ?? []).map((m) => (
                    <li key={m.metric_key} className="rounded-md bg-muted px-2 py-1 text-xs">
                      {m.metric_name}: <span className="font-semibold tabular-nums">{m.numeric_value ?? m.text_value}</span> {m.unit}
                    </li>
                  ))}
                </ul>
                {e.summary && <p className="text-sm text-muted-foreground">{e.summary}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <EvaluationSheet key={editing === 'new' ? 'new' : (editing?.id ?? 'none')} evaluation={editing} players={players} coaches={coaches} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar evaluación"
        description={`Se elimina la evaluación de ${deleting?.player_name ?? ''} con todas sus pruebas.`}
        confirmLabel="Eliminar"
        onConfirm={() => deleteEvaluationAction(deleting!.id)}
      />
    </div>
  )
}

type Row = { name: string; value: string; unit: string }

function EvaluationSheet({ evaluation, players, coaches, onClose }: { evaluation: Evaluation | 'new' | null; players: PlayerStats[]; coaches: Named[]; onClose: () => void }) {
  const current = evaluation === 'new' ? null : evaluation
  const [playerId, setPlayerId] = useState(String(current?.player_id ?? ''))
  const [coachId, setCoachId] = useState(String(current?.evaluator_coach_id ?? ''))
  const [rows, setRows] = useState<Row[]>(
    current?.measurements?.length
      ? current.measurements.map((m) => ({ name: m.metric_name, value: String(m.numeric_value ?? m.text_value ?? ''), unit: m.unit ?? '' }))
      : [{ name: '', value: '', unit: '' }],
  )
  const { pending, error, fieldErrors, execute } = useConfigAction()
  const update = (i: number, patch: Partial<Row>) => setRows((all) => all.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const addPreset = (preset: { name: string; unit: string }) =>
    setRows((all) => {
      if (all.some((r) => r.name === preset.name)) return all
      const empty = all.findIndex((r) => !r.name && !r.value)
      const row = { name: preset.name, value: '', unit: preset.unit }
      return empty >= 0 ? all.map((r, j) => (j === empty ? row : r)) : [...all, row]
    })
  const rowError = (i: number) => Object.entries(fieldErrors).find(([k]) => k.startsWith(`measurements.${i}.`))?.[1]

  return (
    <ConfigSheet open={evaluation !== null} onOpenChange={(open) => !open && onClose()} title={current ? 'Editar evaluación' : 'Nueva evaluación física'} description="Una fila por prueba. Si el resultado no es un número, se guarda como texto." wide>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          const measurements = rows
            .filter((r) => r.name.trim() && r.value.trim())
            .map((r) => {
              const numeric = Number(r.value.replace(',', '.'))
              const isNumber = r.value.trim() !== '' && Number.isFinite(numeric)
              return {
                metric_key: metricKey(r.name),
                metric_name: r.name.trim(),
                numeric_value: isNumber ? numeric : null,
                text_value: isNumber ? null : r.value.trim(),
                unit: r.unit.trim() || null,
              }
            })
          execute(
            () =>
              saveEvaluationAction(current?.id ?? null, {
                player_id: Number(playerId),
                evaluator_coach_id: Number(coachId) || null,
                evaluated_at: String(formData.get('evaluated_at') ?? ''),
                summary: String(formData.get('summary') ?? '').trim() || null,
                recommendations: String(formData.get('recommendations') ?? '').trim() || null,
                measurements,
              }),
            onClose,
          )
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <FormSelect id="player_id" label="Jugador" value={playerId} onChange={setPlayerId} options={players.map((p) => ({ value: String(p.player_id), label: p.player_name }))} />
            {fieldErrors.player_id && <p className="text-sm text-destructive">{fieldErrors.player_id}</p>}
          </div>
          <Field id="evaluated_at" name="evaluated_at" label="Fecha" type="date" required defaultValue={current?.evaluated_at.slice(0, 10) ?? new Date().toISOString().slice(0, 10)} error={fieldErrors.evaluated_at} />
        </div>
        <div className="flex flex-col gap-1">
          <FormSelect id="evaluator" label="Evaluó" value={coachId} onChange={setCoachId} placeholder="Yo" options={[{ value: '', label: 'Yo' }, ...coaches.map((c) => ({ value: String(c.id), label: c.name }))]} />
          {fieldErrors.evaluator_coach_id && <p className="text-sm text-destructive">{fieldErrors.evaluator_coach_id}</p>}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">Pruebas</legend>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <Button key={p.name} type="button" variant="outline" size="xs" onClick={() => addPreset(p)}>
                + {p.name}
              </Button>
            ))}
          </div>
          {rows.map((row, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="grid grid-cols-[1fr_6rem_5rem_auto] items-end gap-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`m-name-${i}`} className="text-xs">Prueba</Label>
                  <Input id={`m-name-${i}`} value={row.name} onChange={(e) => update(i, { name: e.target.value })} maxLength={120} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`m-value-${i}`} className="text-xs">Resultado</Label>
                  <Input id={`m-value-${i}`} value={row.value} onChange={(e) => update(i, { value: e.target.value })} inputMode="decimal" className="tabular-nums" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor={`m-unit-${i}`} className="text-xs">Unidad</Label>
                  <Input id={`m-unit-${i}`} value={row.unit} onChange={(e) => update(i, { unit: e.target.value })} maxLength={30} />
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label={`Quitar ${row.name || 'prueba'}`} onClick={() => setRows((all) => (all.length > 1 ? all.filter((_, j) => j !== i) : [{ name: '', value: '', unit: '' }]))}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
              {rowError(i) && <p className="text-sm text-destructive">{rowError(i)}</p>}
            </div>
          ))}
          <Button type="button" variant="outline" className="w-fit gap-2" onClick={() => setRows((all) => [...all, { name: '', value: '', unit: '' }])} disabled={rows.length >= 30}>
            <Plus className="size-4" aria-hidden="true" />
            Otra prueba
          </Button>
          {fieldErrors.measurements && <p className="text-sm text-destructive">{fieldErrors.measurements}</p>}
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="summary">Resumen</Label>
          <Textarea id="summary" name="summary" defaultValue={current?.summary ?? ''} maxLength={2000} rows={2} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recommendations">Recomendaciones</Label>
          <Textarea id="recommendations" name="recommendations" defaultValue={current?.recommendations ?? ''} maxLength={2000} rows={2} />
        </div>
        <FormError message={error} />
        <SubmitButton pending={pending}>{current ? 'Guardar cambios' : 'Guardar evaluación'}</SubmitButton>
      </form>
    </ConfigSheet>
  )
}
