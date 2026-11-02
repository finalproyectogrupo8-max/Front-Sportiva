'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowLeft, ArrowUp, Check, Minus, Plus, RotateCcw } from 'lucide-react'
import { saveEvaluationSessionAction } from '@/app/(app)/c/[club]/analisis/actions'
import { FormError, useConfigAction } from '@/components/club/forms'
import { FormSelect, ModuleHeader, PageBody } from '@/components/club/shared'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { today } from '@/lib/club-time'
import { cn } from '@/lib/utils'
import { metricKey, shortDate, type Evaluation, type Named } from './shared'

// Prueba en vivo (FRO-20): el profe elige la prueba y carga un resultado por jugador, de corrido,
// desde la compu o una tablet. Lo cargado queda guardado en el dispositivo hasta que se guarda.

type Better = 'higher' | 'lower' | 'none'
type Test = { key: string; name: string; unit: string; better: Better }

const TESTS: Test[] = [
  { key: 'salto_vertical', name: 'Salto vertical', unit: 'cm', better: 'higher' },
  { key: 'salto_en_largo', name: 'Salto en largo', unit: 'cm', better: 'higher' },
  { key: 'velocidad_30_m', name: 'Velocidad 30 m', unit: 's', better: 'lower' },
  { key: 'agilidad_illinois', name: 'Agilidad (Illinois)', unit: 's', better: 'lower' },
  { key: 'resistencia_course_navette', name: 'Resistencia (Course Navette)', unit: 'etapa', better: 'higher' },
  { key: 'abdominales_1_min', name: 'Abdominales en 1 minuto', unit: 'rep', better: 'higher' },
  { key: 'flexibilidad', name: 'Flexibilidad', unit: 'cm', better: 'higher' },
  { key: 'peso', name: 'Peso', unit: 'kg', better: 'none' },
  { key: 'altura', name: 'Altura', unit: 'cm', better: 'none' },
]

const BETTER_LABEL: Record<Better, string> = { higher: 'Más es mejor', lower: 'Menos es mejor', none: 'Solo registro' }

type Previous = { value: number; at: string }
type Entry = { value: string; skipped: boolean }

const parse = (raw: string) => {
  const n = Number(raw.replace(',', '.'))
  return raw.trim() !== '' && Number.isFinite(n) ? n : null
}
const fmt = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')

export function LiveTest({
  categoryId,
  categoryName,
  backHref,
  players,
  evaluations,
  coaches,
}: {
  categoryId: number
  categoryName: string
  backHref: string
  players: Named[]
  evaluations: Evaluation[]
  coaches: Named[]
}) {
  const [test, setTest] = useState<Test | null>(null)
  const [date, setDate] = useState(today())
  const [done, setDone] = useState<{ test: Test; results: { player: Named; value: number; previous?: Previous }[] } | null>(null)

  // Pruebas que la categoría ya tomó y no están en la lista: para repetirlas con un toque.
  const taken = useMemo(() => {
    const seen = new Map<string, Test>()
    for (const e of evaluations)
      for (const m of e.measurements ?? [])
        if (m.numeric_value !== null && !TESTS.some((t) => t.key === m.metric_key) && !seen.has(m.metric_key))
          seen.set(m.metric_key, { key: m.metric_key, name: m.metric_name, unit: m.unit ?? '', better: 'none' })
    return [...seen.values()]
  }, [evaluations])

  return (
    <>
      <ModuleHeader
        title={test ? test.name : 'Tomar una prueba'}
        description={test ? `${categoryName} · ${shortDate(`${date}T12:00:00Z`)} · ${test.unit ? `en ${test.unit} · ` : ''}${BETTER_LABEL[test.better].toLowerCase()}` : `${categoryName}: elegí la prueba y cargá un resultado por jugador.`}
        actions={
          test && !done ? (
            <Button variant="outline" className="gap-2" onClick={() => setTest(null)}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Cambiar prueba
            </Button>
          ) : undefined
        }
      >
        <Link href={backHref} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al tablero
        </Link>
      </ModuleHeader>

      <PageBody className="max-w-4xl">
        {done ? (
          <Summary
            done={done}
            onAnother={() => {
              setDone(null)
              setTest(null)
            }}
            backHref={backHref}
          />
        ) : test ? (
          <Sheet
            key={`${test.key}-${date}`}
            test={test}
            date={date}
            coaches={coaches}
            categoryId={categoryId}
            players={players}
            evaluations={evaluations}
            onSaved={(results) => setDone({ test, results })}
          />
        ) : (
          <Picker taken={taken} date={date} setDate={setDate} onPick={setTest} />
        )}
      </PageBody>
    </>
  )
}

function Picker({ taken, date, setDate, onPick }: { taken: Test[]; date: string; setDate: (d: string) => void; onPick: (t: Test) => void }) {
  const [custom, setCustom] = useState({ name: '', unit: '', better: 'higher' as Better })

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="test-date">Fecha de la prueba</Label>
          <Input id="test-date" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value || today())} className="h-11" />
        </div>
      </div>

      <section aria-labelledby="pick-test" className="flex flex-col gap-3">
        <h2 id="pick-test" className="text-base font-semibold">
          ¿Qué prueban hoy?
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[...TESTS, ...taken].map((t) => (
            <li key={t.key}>
              <button
                type="button"
                onClick={() => onPick(t)}
                className="flex min-h-16 w-full flex-col justify-center gap-0.5 rounded-xl border bg-card px-4 py-3 text-left transition hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
              >
                <span className="font-medium">{t.name}</span>
                <span className="text-xs text-muted-foreground">
                  {t.unit ? `${t.unit} · ` : ''}
                  {taken.includes(t) ? 'Ya la tomaron' : BETTER_LABEL[t.better]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="custom-test" className="flex flex-col gap-3">
        <h2 id="custom-test" className="text-base font-semibold">
          Otra prueba
        </h2>
        <form
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_12rem_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault()
            const name = custom.name.trim()
            if (!name) return
            onPick({ key: metricKey(name), name, unit: custom.unit.trim(), better: custom.better })
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="custom-name">Nombre</Label>
            <Input id="custom-name" value={custom.name} onChange={(e) => setCustom((c) => ({ ...c, name: e.target.value }))} placeholder="ej. Lanzamiento de balón" maxLength={120} className="h-11" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="custom-unit">Unidad</Label>
            <Input id="custom-unit" value={custom.unit} onChange={(e) => setCustom((c) => ({ ...c, unit: e.target.value }))} placeholder="m" maxLength={30} className="h-11" />
          </div>
          <FormSelect
            id="custom-better"
            label="Se considera mejor"
            value={custom.better}
            onChange={(v) => setCustom((c) => ({ ...c, better: (v || 'higher') as Better }))}
            options={(Object.keys(BETTER_LABEL) as Better[]).map((b) => ({ value: b, label: BETTER_LABEL[b] }))}
          />
          <Button type="submit" className="h-11" disabled={!custom.name.trim()}>
            Empezar
          </Button>
        </form>
      </section>
    </div>
  )
}

function Sheet({
  test,
  date,
  coaches,
  categoryId,
  players,
  evaluations,
  onSaved,
}: {
  test: Test
  date: string
  coaches: Named[]
  categoryId: number
  players: Named[]
  evaluations: Evaluation[]
  onSaved: (results: { player: Named; value: number; previous?: Previous }[]) => void
}) {
  const storageKey = `sportiva:prueba:${categoryId}:${test.key}:${date}`
  // Borrador guardado en el dispositivo: si se cerró la pestaña o se cortó la conexión, sigue ahí.
  // La planilla solo se monta después de elegir la prueba (nunca en el servidor): se puede leer acá.
  const [draft] = useState<{ entries: Record<number, Entry>; coachId: string } | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [entries, setEntries] = useState<Record<number, Entry>>(draft?.entries ?? {})
  const [coachId, setCoachId] = useState(draft?.coachId ?? '')
  const [restored, setRestored] = useState(draft !== null && Object.keys(draft.entries ?? {}).length > 0)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const { pending, error, fieldErrors, execute } = useConfigAction()

  // Último resultado de cada jugador en esta prueba, antes de la fecha de hoy.
  const previous = useMemo(() => {
    const map = new Map<number, Previous>()
    for (const e of [...evaluations].sort((a, b) => a.evaluated_at.localeCompare(b.evaluated_at))) {
      if (e.evaluated_at.slice(0, 10) >= date) continue
      const m = e.measurements?.find((x) => x.metric_key === test.key)
      if (m?.numeric_value != null) map.set(e.player_id, { value: m.numeric_value, at: e.evaluated_at })
    }
    return map
  }, [evaluations, test.key, date])

  useEffect(() => {
    try {
      if (Object.keys(entries).length) localStorage.setItem(storageKey, JSON.stringify({ entries, coachId }))
    } catch {
      // Ignorado: el borrador es una ayuda, no un requisito.
    }
  }, [entries, coachId, storageKey])

  const set = (id: number, patch: Partial<Entry>) => setEntries((all) => ({ ...all, [id]: { ...(all[id] ?? { value: '', skipped: false }), ...patch } }))
  const loaded = players.filter((p) => parse(entries[p.id]?.value ?? '') !== null && !entries[p.id]?.skipped)
  const pendingCount = players.filter((p) => !entries[p.id]?.skipped && parse(entries[p.id]?.value ?? '') === null).length
  const focusNext = (i: number) => {
    for (let j = i + 1; j < players.length; j++) {
      if (!entries[players[j].id]?.skipped) {
        inputs.current[j]?.focus()
        inputs.current[j]?.select()
        return
      }
    }
    inputs.current[i]?.blur()
  }

  const save = () => {
    const results = loaded.map((p) => ({ player: p, value: parse(entries[p.id].value)!, previous: previous.get(p.id) }))
    execute(
      () =>
        saveEvaluationSessionAction({
          category_id: categoryId,
          evaluated_at: date,
          evaluator_coach_id: Number(coachId) || null,
          metric_key: test.key,
          metric_name: test.name,
          unit: test.unit || null,
          results: results.map((r) => ({ player_id: r.player.id, numeric_value: r.value })),
        }),
      () => {
        try {
          localStorage.removeItem(storageKey)
        } catch {
          // Nada que limpiar.
        }
        onSaved(results)
      },
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      {restored && (
        <p role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
          Recuperamos lo que habías cargado en este dispositivo.
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setEntries({})
              setRestored(false)
              try {
                localStorage.removeItem(storageKey)
              } catch {
                // Nada que limpiar.
              }
            }}
          >
            Empezar de cero
          </button>
        </p>
      )}

      {coaches.length > 0 && (
        <div className="flex max-w-sm flex-col gap-1">
          <FormSelect id="test-coach" label="Evaluó" value={coachId} onChange={setCoachId} placeholder="Yo" options={[{ value: '', label: 'Yo' }, ...coaches.map((c) => ({ value: String(c.id), label: c.name }))]} />
          {fieldErrors.evaluator_coach_id && <p className="text-sm text-destructive">{fieldErrors.evaluator_coach_id}</p>}
        </div>
      )}

      <ol className="flex flex-col divide-y rounded-xl border bg-card">
        {players.map((p, i) => {
          const entry = entries[p.id]
          const value = parse(entry?.value ?? '')
          const prev = previous.get(p.id)
          const delta = value !== null && prev ? value - prev.value : null
          const improved = delta === null || delta === 0 || test.better === 'none' ? null : test.better === 'higher' ? delta > 0 : delta < 0
          const inputId = `result-${p.id}`
          return (
            <li key={p.id} className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3', entry?.skipped && 'bg-muted/40')}>
              <div className="flex min-w-0 flex-1 basis-48 flex-col">
                <label htmlFor={inputId} className={cn('font-medium', entry?.skipped && 'text-muted-foreground line-through')}>
                  {p.name}
                </label>
                <span className="text-xs text-muted-foreground">
                  {prev ? `Anterior: ${fmt(prev.value)} ${test.unit} (${shortDate(prev.at)})` : 'Primera vez'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-24 text-right text-sm tabular-nums" aria-live="polite">
                  {delta !== null && delta !== 0 && (
                    <span className={cn('inline-flex items-center gap-1 font-medium', improved === true && 'text-success', improved === false && 'text-destructive', improved === null && 'text-muted-foreground')}>
                      {delta > 0 ? <ArrowUp className="size-3.5" aria-hidden="true" /> : <ArrowDown className="size-3.5" aria-hidden="true" />}
                      {delta > 0 ? '+' : '−'}
                      {fmt(Math.abs(delta))}
                      <span className="sr-only">{improved === true ? ', mejoró' : improved === false ? ', empeoró' : ''}</span>
                    </span>
                  )}
                  {delta === 0 && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Minus className="size-3.5" aria-hidden="true" />
                      Igual
                    </span>
                  )}
                </span>
                <div className="relative">
                  <Input
                    id={inputId}
                    ref={(el) => {
                      inputs.current[i] = el
                    }}
                    inputMode="decimal"
                    enterKeyHint="next"
                    autoComplete="off"
                    disabled={entry?.skipped}
                    value={entry?.value ?? ''}
                    onChange={(e) => set(p.id, { value: e.target.value.replace(/[^0-9.,-]/g, '') })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        focusNext(i)
                      }
                    }}
                    aria-invalid={entry?.value && value === null ? true : undefined}
                    className={cn('h-12 w-32 text-right text-xl font-semibold tabular-nums', test.unit && 'pr-12')}
                  />
                  {test.unit && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{test.unit}</span>}
                </div>
                <Button
                  type="button"
                  variant={entry?.skipped ? 'secondary' : 'ghost'}
                  className="h-12 w-28"
                  aria-pressed={!!entry?.skipped}
                  onClick={() => set(p.id, { skipped: !entry?.skipped })}
                >
                  {entry?.skipped ? 'Volver' : 'No la hizo'}
                </Button>
              </div>
            </li>
          )
        })}
      </ol>

      <FormError message={error ?? Object.entries(fieldErrors).find(([k]) => k !== 'evaluator_coach_id')?.[1]} />

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t bg-card/95 backdrop-blur-md md:bottom-0">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <span className="text-sm tabular-nums">
            <span className="font-semibold">{loaded.length}</span> de {players.length} cargados
            {pendingCount > 0 && loaded.length > 0 && <span className="text-muted-foreground"> · faltan {pendingCount}</span>}
          </span>
          <Button className="h-11 gap-2 px-5" disabled={pending || loaded.length === 0} onClick={save}>
            <Check className="size-4" aria-hidden="true" />
            {loaded.length ? `Guardar ${loaded.length} ${loaded.length === 1 ? 'resultado' : 'resultados'}` : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Summary({
  done,
  onAnother,
  backHref,
}: {
  done: { test: Test; results: { player: Named; value: number; previous?: Previous }[] }
  onAnother: () => void
  backHref: string
}) {
  const { test, results } = done
  const ranked = test.better === 'none' ? results : [...results].sort((a, b) => (test.better === 'higher' ? b.value - a.value : a.value - b.value))
  const average = results.reduce((s, r) => s + r.value, 0) / results.length
  const compared = results.filter((r) => r.previous)
  const improved = compared.filter((r) => (test.better === 'higher' ? r.value > r.previous!.value : test.better === 'lower' ? r.value < r.previous!.value : false))

  return (
    <div className="flex flex-col gap-6">
      <div role="status" className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/8 px-4 py-3">
        <Check className="size-5 shrink-0 text-success" aria-hidden="true" />
        <p className="text-sm">
          Se guardaron <span className="font-semibold">{results.length}</span> resultados de {test.name.toLowerCase()}. Ya aparecen en la evolución de cada jugador.
        </p>
      </div>

      <dl className="grid grid-cols-2 divide-x rounded-xl border bg-card sm:grid-cols-3">
        <div className="flex flex-col gap-1 px-4 py-3">
          <dt className="text-xs font-medium text-muted-foreground">Promedio</dt>
          <dd className="text-2xl font-semibold tabular-nums">
            {fmt(average)} <span className="text-base font-normal text-muted-foreground">{test.unit}</span>
          </dd>
        </div>
        {test.better !== 'none' && (
          <div className="flex flex-col gap-1 px-4 py-3">
            <dt className="text-xs font-medium text-muted-foreground">Mejor marca</dt>
            <dd className="text-2xl font-semibold tabular-nums">
              {fmt(ranked[0].value)} <span className="text-base font-normal text-muted-foreground">{test.unit}</span>
            </dd>
            <dd className="truncate text-xs text-muted-foreground">{ranked[0].player.name}</dd>
          </div>
        )}
        {test.better !== 'none' && (
          <div className="col-span-2 flex flex-col gap-1 border-t px-4 py-3 sm:col-span-1 sm:border-t-0">
            <dt className="text-xs font-medium text-muted-foreground">Mejoraron</dt>
            <dd className="text-2xl font-semibold tabular-nums">{compared.length ? `${improved.length} de ${compared.length}` : '—'}</dd>
            <dd className="text-xs text-muted-foreground">{compared.length ? 'contra su prueba anterior' : 'Es la primera vez que la toman'}</dd>
          </div>
        )}
      </dl>

      <section aria-labelledby="ranking" className="flex flex-col gap-3">
        <h2 id="ranking" className="text-base font-semibold">
          {test.better === 'none' ? 'Resultados' : 'Ranking del día'}
        </h2>
        <ol className="flex flex-col divide-y rounded-xl border bg-card">
          {ranked.map((r, i) => (
            <li key={r.player.id} className="flex items-center gap-3 px-4 py-2.5">
              {test.better !== 'none' && <span className="w-6 text-right text-sm tabular-nums text-muted-foreground">{i + 1}</span>}
              <span className="min-w-0 flex-1 truncate font-medium">{r.player.name}</span>
              {r.previous && <span className="text-xs text-muted-foreground">antes {fmt(r.previous.value)}</span>}
              <span className="w-24 text-right font-semibold tabular-nums">
                {fmt(r.value)} <span className="text-sm font-normal text-muted-foreground">{test.unit}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button className="h-11 gap-2" onClick={onAnother}>
          <Plus className="size-4" aria-hidden="true" />
          Tomar otra prueba
        </Button>
        <Link href={backHref} className={cn(buttonVariants({ variant: 'outline' }), 'h-11')}>
          Ver el tablero
        </Link>
      </div>
    </div>
  )
}
