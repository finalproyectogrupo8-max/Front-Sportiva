'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Flag, ListOrdered, Pencil, Plus, Target, Trash2 } from 'lucide-react'
import { deleteObjectiveAction, saveObjectiveAction, saveStandingsAction } from '@/app/(app)/c/[club]/competencia/actions'
import { EmptyConfig } from '@/components/club/empty-state'
import { ConfigSheet, ConfirmDialog, Field, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { FormSelect, Meter, ModuleHeader, PageBody, Pill, Stat, type Tone } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Objective = {
  id: number
  category_id: number | null
  category_name?: string | null
  title: string
  description: string | null
  target_value: number | null
  current_value: number | null
  unit: string | null
  progress: number | null
  status: string
  due_date: string | null
}
type StandingRow = {
  team_name: string
  is_own: boolean
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  points: number
}
type Named = { id: number; name: string }

const STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'Sin empezar', tone: 'neutral' },
  in_progress: { label: 'En curso', tone: 'info' },
  achieved: { label: 'Cumplido', tone: 'ok' },
  missed: { label: 'No se cumplió', tone: 'bad' },
}
const COUNTERS = [
  ['played', 'PJ', 'Jugados'],
  ['won', 'G', 'Ganados'],
  ['drawn', 'E', 'Empatados'],
  ['lost', 'P', 'Perdidos'],
  ['goals_for', 'GF', 'A favor'],
  ['goals_against', 'GC', 'En contra'],
  ['points', 'Pts', 'Puntos'],
] as const

export function ProjectModule({
  season,
  seasons,
  competitions,
  competitionId,
  categoryId,
  standings,
  objectives,
  categories,
  canEdit,
}: {
  season: Named
  seasons: Named[]
  competitions: (Named & { categories: Named[] })[]
  competitionId: number | null
  categoryId: number | null
  standings: StandingRow[]
  objectives: Objective[]
  categories: Named[]
  canEdit: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [editingTable, setEditingTable] = useState(false)
  const competition = competitions.find((c) => c.id === competitionId)
  const own = standings.find((r) => r.is_own)
  const position = own ? standings.indexOf(own) + 1 : null

  const select = (competencia: number, categoria?: number) => {
    const params = new URLSearchParams({ temporada: String(season.id), competencia: String(competencia) })
    if (categoria) params.set('categoria', String(categoria))
    router.replace(`${pathname}?${params}`, { scroll: false })
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Deportivo"
        title="Proyecto deportivo"
        description={`Objetivos de la temporada ${season.name} y tabla de posiciones de cada competencia.`}
      >
        {seasons.length > 1 && (
          <div className="w-60">
            <FormSelect
              id="temporada"
              label="Temporada"
              value={String(season.id)}
              onChange={(v) => router.replace(`${pathname}?temporada=${v}`, { scroll: false })}
              options={seasons.map((s) => ({ value: String(s.id), label: s.name }))}
            />
          </div>
        )}
      </ModuleHeader>

      <PageBody>
        <section aria-labelledby="tabla" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="tabla" className="text-base font-semibold">
              Tabla de posiciones
            </h2>
            {competition && (
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-full sm:w-72">
                  <FormSelect
                    id="competencia"
                    label="Competencia"
                    value={String(competition.id)}
                    onChange={(v) => select(Number(v))}
                    options={competitions.map((c) => ({ value: String(c.id), label: c.name }))}
                  />
                </div>
                {competition.categories.length > 1 && (
                  <div className="w-44">
                    <FormSelect
                      id="categoria-tabla"
                      label="Categoría"
                      value={String(categoryId ?? '')}
                      onChange={(v) => select(competition.id, Number(v))}
                      options={competition.categories.map((c) => ({ value: String(c.id), label: c.name }))}
                    />
                  </div>
                )}
                {canEdit && categoryId && (
                  <Button variant="outline" className="gap-2" onClick={() => setEditingTable(true)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    {standings.length ? 'Editar tabla' : 'Cargar tabla'}
                  </Button>
                )}
              </div>
            )}
          </div>

          {!competition ? (
            <EmptyConfig
              icon={ListOrdered}
              title="No hay competencias en esta temporada"
              description="Cargá las competencias y sus categorías en la configuración del club para armar la tabla."
            />
          ) : standings.length === 0 ? (
            <EmptyConfig
              icon={ListOrdered}
              title="Todavía no hay tabla"
              description="La tabla se carga a mano: copiá las posiciones que publica la liga después de cada fecha."
              action={canEdit ? <Button onClick={() => setEditingTable(true)}>Cargar tabla</Button> : undefined}
            />
          ) : (
            <>
              {own && position && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Stat label="Posición" value={`${position}°`} hint={`de ${standings.length} · ${competition.name}`} />
                  <Stat label="Puntos" value={own.points} hint={`${own.won}G · ${own.drawn}E · ${own.lost}P`} />
                  <Stat label="A favor / en contra" value={`${own.goals_for} / ${own.goals_against}`} hint={own.played ? `${(own.goals_for / own.played).toFixed(1)} por partido` : undefined} />
                  <Stat
                    label="Diferencia"
                    value={
                      <span className={own.goals_for - own.goals_against >= 0 ? 'text-success' : 'text-destructive'}>
                        {own.goals_for - own.goals_against > 0 ? '+' : ''}
                        {own.goals_for - own.goals_against}
                      </span>
                    }
                    hint={own.played ? `${Math.round((own.won / own.played) * 100)}% de partidos ganados` : undefined}
                  />
                </div>
              )}
              <StandingsTable rows={standings} />
            </>
          )}
        </section>

        <Objectives seasonId={season.id} objectives={objectives} categories={categories} canEdit={canEdit} />
      </PageBody>

      {competition && categoryId && (
        <StandingsEditor
          key={`${competition.id}-${categoryId}-${editingTable}`}
          open={editingTable}
          onOpenChange={setEditingTable}
          competitionId={competition.id}
          categoryId={categoryId}
          title={`${competition.name} · ${competition.categories.find((c) => c.id === categoryId)?.name ?? ''}`}
          initial={standings}
        />
      )}
    </>
  )
}

function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[560px] text-sm">
        <caption className="sr-only">Tabla de posiciones</caption>
        <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="w-10 px-3 py-2 text-left font-medium">#</th>
            <th scope="col" className="px-3 py-2 text-left font-medium">Equipo</th>
            {COUNTERS.map(([key, short, long]) => (
              <th key={key} scope="col" className="px-2 py-2 text-right font-medium">
                <abbr title={long} className="no-underline">{short}</abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.team_name} className={cn('border-b last:border-0', row.is_own && 'bg-primary/8 font-semibold')}>
              <td className="px-3 py-2 tabular-nums text-muted-foreground">{i + 1}</td>
              <td className="px-3 py-2">
                {row.team_name}
                {row.is_own && <span className="sr-only"> (nuestro club)</span>}
              </td>
              {COUNTERS.map(([key]) => (
                <td key={key} className={cn('px-2 py-2 text-right tabular-nums', key === 'points' && 'font-semibold')}>
                  {row[key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const emptyRow = (): StandingRow => ({ team_name: '', is_own: false, played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0, points: 0 })

function StandingsEditor({
  open,
  onOpenChange,
  competitionId,
  categoryId,
  title,
  initial,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  competitionId: number
  categoryId: number
  title: string
  initial: StandingRow[]
}) {
  const [rows, setRows] = useState<StandingRow[]>(initial.length ? initial.map((r) => ({ ...r })) : [emptyRow(), emptyRow()])
  const { pending, error, fieldErrors, execute } = useConfigAction()
  const update = (i: number, patch: Partial<StandingRow>) => setRows((all) => all.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const move = (i: number, by: number) =>
    setRows((all) => {
      const next = [...all]
      const [row] = next.splice(i, 1)
      next.splice(i + by, 0, row)
      return next
    })
  const rowError = (i: number) => Object.entries(fieldErrors).find(([k]) => k.startsWith(`rows.${i}.`))?.[1]

  return (
    <ConfigSheet open={open} onOpenChange={onOpenChange} title="Tabla de posiciones" description={`${title}. Ordená los equipos del primero al último y marcá cuál es el club.`} wide>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          const filled = rows.filter((r) => r.team_name.trim() !== '').map((r) => ({ ...r, team_name: r.team_name.trim() }))
          execute(() => saveStandingsAction(competitionId, categoryId, filled), () => onOpenChange(false))
        }}
      >
        <ol className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <li key={i} className={cn('flex flex-col gap-2 rounded-lg border p-3', row.is_own && 'border-primary/50 bg-primary/5')}>
              <div className="flex items-end gap-2">
                <span className="w-6 pb-2 text-sm tabular-nums text-muted-foreground">{i + 1}°</span>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor={`team-${i}`}>Equipo</Label>
                  <Input id={`team-${i}`} value={row.team_name} onChange={(e) => update(i, { team_name: e.target.value })} aria-invalid={rowError(i) ? true : undefined} />
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label={`Subir ${row.team_name || 'fila'}`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp className="size-4" aria-hidden="true" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label={`Bajar ${row.team_name || 'fila'}`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown className="size-4" aria-hidden="true" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label={`Quitar ${row.team_name || 'fila'}`} onClick={() => setRows((all) => all.filter((_, j) => j !== i))}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {COUNTERS.map(([key, short, long]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <Label htmlFor={`${key}-${i}`} className="text-xs text-muted-foreground" title={long}>
                      {short}
                    </Label>
                    <Input
                      id={`${key}-${i}`}
                      type="number"
                      inputMode="numeric"
                      min={key === 'points' ? undefined : 0}
                      value={row[key]}
                      onChange={(e) => update(i, { [key]: Number(e.target.value) || 0 })}
                      className="tabular-nums"
                    />
                  </div>
                ))}
              </div>
              <label className="flex w-fit items-center gap-2 text-sm">
                <input type="radio" name="is_own" checked={row.is_own} onChange={() => setRows((all) => all.map((r, j) => ({ ...r, is_own: j === i })))} className="size-4 accent-primary" />
                Es nuestro club
              </label>
              {rowError(i) && <p className="text-sm text-destructive">{rowError(i)}</p>}
            </li>
          ))}
        </ol>
        <Button type="button" variant="outline" className="w-fit gap-2" onClick={() => setRows((all) => [...all, emptyRow()])} disabled={rows.length >= 40}>
          <Plus className="size-4" aria-hidden="true" />
          Agregar equipo
        </Button>
        <FormError message={error} />
        <SubmitButton pending={pending}>Guardar tabla</SubmitButton>
      </form>
    </ConfigSheet>
  )
}

function Objectives({ seasonId, objectives, categories, canEdit }: { seasonId: number; objectives: Objective[]; categories: Named[]; canEdit: boolean }) {
  const [editing, setEditing] = useState<Objective | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Objective | null>(null)
  const achieved = objectives.filter((o) => o.status === 'achieved').length

  return (
    <section aria-labelledby="objetivos" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="objetivos" className="text-base font-semibold">
            Objetivos de la temporada
          </h2>
          {objectives.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {achieved} de {objectives.length} cumplidos
            </p>
          )}
        </div>
        {canEdit && (
          <Button className="gap-2" onClick={() => setEditing('new')}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo objetivo
          </Button>
        )}
      </div>

      {objectives.length === 0 ? (
        <EmptyConfig
          icon={Target}
          title="Sin objetivos cargados"
          description="Por ejemplo: llegar a semifinales con la Sub-15, sumar 20 jugadores nuevos o terminar entre los 4 primeros."
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {objectives.map((o) => {
            const status = STATUS[o.status] ?? STATUS.in_progress
            return (
              <li key={o.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{o.category_name ?? 'Todo el club'}</span>
                    <h3 className="font-medium">{o.title}</h3>
                    {o.description && <p className="text-sm text-muted-foreground">{o.description}</p>}
                  </div>
                  <Pill tone={status.tone}>{status.label}</Pill>
                </div>
                {o.progress !== null && (
                  <div className="flex flex-col gap-1.5">
                    <Meter value={o.progress} tone={o.status === 'achieved' ? 'ok' : o.status === 'missed' ? 'bad' : 'info'} />
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {o.current_value ?? 0} de {o.target_value} {o.unit ?? ''} · {o.progress}%
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {o.due_date && (
                      <>
                        <Flag className="size-3.5" aria-hidden="true" />
                        Para el {new Date(`${o.due_date}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </>
                    )}
                  </span>
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(o)}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Eliminar ${o.title}`} onClick={() => setDeleting(o)}>
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ObjectiveSheet
        key={editing === 'new' ? 'new' : (editing?.id ?? 'none')}
        objective={editing}
        seasonId={seasonId}
        categories={categories}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar objetivo"
        description={`Se elimina "${deleting?.title ?? ''}".`}
        confirmLabel="Eliminar"
        onConfirm={() => deleteObjectiveAction(deleting!.id)}
      />
    </section>
  )
}

function ObjectiveSheet({
  objective,
  seasonId,
  categories,
  onClose,
}: {
  objective: Objective | 'new' | null
  seasonId: number
  categories: Named[]
  onClose: () => void
}) {
  const current = objective === 'new' ? null : objective
  const [categoryId, setCategoryId] = useState(String(current?.category_id ?? ''))
  const [status, setStatus] = useState(current?.status ?? 'in_progress')
  const { pending, error, fieldErrors, execute } = useConfigAction()

  return (
    <ConfigSheet open={objective !== null} onOpenChange={(open) => !open && onClose()} title={current ? 'Editar objetivo' : 'Nuevo objetivo'} description="Si tiene una meta numérica, el avance se calcula solo.">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          formData.set('category_id', categoryId)
          formData.set('status', status)
          execute(() => saveObjectiveAction(current?.id ?? null, seasonId, formData), onClose)
        }}
      >
        <Field id="title" name="title" label="Objetivo" defaultValue={current?.title} required maxLength={150} error={fieldErrors.title} />
        <FormSelect
          id="category_id"
          label="Categoría"
          value={categoryId}
          onChange={setCategoryId}
          placeholder="Todo el club"
          options={[{ value: '', label: 'Todo el club' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
        />
        <div className="grid grid-cols-3 gap-3">
          <Field id="current_value" name="current_value" label="Avance" type="number" step="any" min={0} defaultValue={current?.current_value ?? ''} error={fieldErrors.current_value} />
          <Field id="target_value" name="target_value" label="Meta" type="number" step="any" min={0} defaultValue={current?.target_value ?? ''} error={fieldErrors.target_value} />
          <Field id="unit" name="unit" label="Unidad" placeholder="partidos" defaultValue={current?.unit ?? ''} maxLength={30} error={fieldErrors.unit} />
        </div>
        <FormSelect id="status" label="Estado" value={status} onChange={setStatus} options={Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }))} />
        <Field id="due_date" name="due_date" label="Fecha límite" type="date" defaultValue={current?.due_date ?? ''} error={fieldErrors.due_date} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Detalle</Label>
          <Textarea id="description" name="description" defaultValue={current?.description ?? ''} maxLength={2000} rows={3} />
        </div>
        <FormError message={error} />
        <SubmitButton pending={pending}>{current ? 'Guardar cambios' : 'Crear objetivo'}</SubmitButton>
      </form>
    </ConfigSheet>
  )
}
