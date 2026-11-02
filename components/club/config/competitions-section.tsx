'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  Copy,
  FileText,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  Trophy,
  X,
} from 'lucide-react'
import {
  copyCompetitionAction,
  deleteCompetitionAction,
  saveCompetitionAction,
} from '@/app/(app)/c/[club]/configuracion/actions'
import { FormSelect, Pill, type Tone } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SheetFooter } from '@/components/ui/sheet'
import type { Category, Competition, CompetitionRequirement, RequirementInput, Season, Sport } from '@/lib/api/club'
import { formatDay } from '@/lib/format-date'
import { cn } from '@/lib/utils'
import { ConfigSheet, ConfirmDialog, Field, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { EmptyConfig } from '@/components/club/empty-state'

const ALL = 'todos'

/** Requisitos típicos de una liga infantil o juvenil, para cargar con un toque. */
const SUGGESTED: Omit<RequirementInput, 'id'>[] = [
  { name: 'Apto médico', validity_months: 12, requires_file: true, minors_only: false, is_required: true },
  { name: 'Ficha de inscripción firmada', validity_months: null, requires_file: true, minors_only: false, is_required: true },
  { name: 'Copia del DNI', validity_months: null, requires_file: true, minors_only: false, is_required: true },
  { name: 'Autorización de los padres', validity_months: 12, requires_file: true, minors_only: true, is_required: true },
]

function deadlinePill(competition: Competition): { tone: Tone; label: string } | null {
  const days = competition.days_to_deadline
  if (days == null) return null
  if (days < 0) return { tone: 'neutral', label: 'Inscripción cerrada' }
  if (days === 0) return { tone: 'bad', label: 'La inscripción cierra hoy' }
  if (days <= 15) return { tone: 'warn', label: `Cierra en ${days} ${days === 1 ? 'día' : 'días'}` }
  return { tone: 'info', label: `Cierra el ${formatDay(competition.registration_deadline)}` }
}

function requirementTags(r: CompetitionRequirement | RequirementInput): string[] {
  const tags: string[] = []
  tags.push(r.validity_months ? `vence cada ${r.validity_months} ${r.validity_months === 1 ? 'mes' : 'meses'}` : 'no vence')
  if (r.requires_file) tags.push('con archivo')
  if (r.minors_only) tags.push('solo menores')
  if (!r.is_required) tags.push('opcional')
  return tags
}

export function CompetitionsSection({
  competitions,
  sports,
  seasons,
  categories,
  filters,
  can,
}: {
  competitions: Competition[]
  sports: Sport[]
  seasons: Season[]
  categories: Category[]
  filters: { sport: string; season: string }
  can: { create: boolean; update: boolean; delete: boolean }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filtering, startFilter] = useTransition()
  const [editing, setEditing] = useState<Competition | 'new' | null>(null)
  const [copying, setCopying] = useState<Competition | null>(null)
  // Después de duplicar se abre la copia para elegir sus categorías, cuando llega en la lista nueva.
  const [openAfterCopy, setOpenAfterCopy] = useState<number | null>(null)
  if (openAfterCopy !== null) {
    const copy = competitions.find((c) => c.id === openAfterCopy)
    if (copy) {
      setOpenAfterCopy(null)
      setEditing(copy)
    }
  }
  const [removing, setRemoving] = useState<Competition | null>(null)

  const sportName = new Map(sports.map((s) => [s.id, s.name]))
  const seasonName = new Map(seasons.map((s) => [s.id, s.name]))
  const ready = sports.length > 0 && seasons.length > 0

  const setFilter = (key: 'deporte' | 'temporada', value: string) => {
    const sp = new URLSearchParams(searchParams.toString())
    sp.set(key, value)
    startFilter(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }))
  }

  const addButton = can.create && ready && (
    <Button onClick={() => setEditing('new')} className="gap-2">
      <Plus className="size-4" aria-hidden="true" />
      Nueva competencia
    </Button>
  )

  if (!ready && can.create) {
    return (
      <EmptyConfig
        icon={Trophy}
        title="Primero cargá un deporte y una temporada"
        description="Cada competencia es de un deporte en una temporada, por ejemplo la Liga Metropolitana de fútbol 2027."
      />
    )
  }

  return (
    <section className="flex flex-col gap-4" aria-label="Competencias">
      <p className="max-w-3xl text-sm text-muted-foreground">
        Las ligas y torneos que juega el club. Cada una pide sus papeles: con eso se calcula quién está habilitado
        para jugar.
      </p>

      <div className="flex flex-wrap items-end justify-between gap-3">
        {ready && (
          <div className={cn('grid w-full gap-3 sm:w-auto sm:grid-cols-2', filtering && 'opacity-60')}>
            <div className="sm:w-52">
              <FormSelect
                id="filter-comp-season"
                label="Temporada"
                value={filters.season}
                onChange={(v) => setFilter('temporada', v)}
                options={[{ value: ALL, label: 'Todas' }, ...seasons.map((s) => ({ value: String(s.id), label: s.name }))]}
              />
            </div>
            <div className="sm:w-52">
              <FormSelect
                id="filter-comp-sport"
                label="Deporte"
                value={filters.sport}
                onChange={(v) => setFilter('deporte', v)}
                options={[{ value: ALL, label: 'Todos' }, ...sports.map((s) => ({ value: String(s.id), label: s.name }))]}
              />
            </div>
          </div>
        )}
        {addButton}
      </div>

      {competitions.length === 0 ? (
        <EmptyConfig
          icon={Trophy}
          title="No hay competencias para mostrar"
          description={
            can.create
              ? 'Cargá la liga o el torneo que juega el club, con las categorías que participan y los papeles que pide.'
              : 'Todavía no hay competencias cargadas para tus categorías.'
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {competitions.map((competition) => {
            const deadline = deadlinePill(competition)
            const requirements = competition.requirements ?? []
            return (
              <article key={competition.id} className="flex flex-col gap-4 rounded-xl border bg-card p-5">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="text-lg font-semibold leading-tight">{competition.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {[sportName.get(competition.sport_id), seasonName.get(competition.season_id), competition.organizer]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  {deadline && (
                    <Pill tone={deadline.tone}>
                      <CalendarClock className="size-3" aria-hidden="true" />
                      {deadline.label}
                    </Pill>
                  )}
                </header>

                <div className="flex flex-col gap-1.5">
                  <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Categorías</h4>
                  {competition.categories && competition.categories.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {competition.categories.map((c) => (
                        <li key={c.id} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                          {c.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Pill tone="warn" className="w-fit">Sin categorías: elegí cuáles la juegan</Pill>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Requisitos ({requirements.length})
                  </h4>
                  {requirements.length > 0 ? (
                    <ol className="flex flex-col divide-y rounded-lg border">
                      {requirements.map((r) => (
                        <li key={r.id} className="flex items-start gap-2 px-3 py-2 text-sm">
                          <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <span className="flex min-w-0 flex-col">
                            <span className="font-medium">{r.name}</span>
                            <span className="text-xs text-muted-foreground">{requirementTags(r).join(' · ')}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-xs text-muted-foreground">No pide papeles: todos los jugadores están habilitados.</p>
                  )}
                </div>

                {(can.update || can.create || can.delete) && (
                  <footer className="mt-auto flex flex-wrap gap-1 border-t pt-3">
                    {can.update && (
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing(competition)}>
                        <Pencil className="size-3.5" aria-hidden="true" />
                        Editar
                      </Button>
                    )}
                    {can.create && (
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setCopying(competition)}>
                        <Copy className="size-3.5" aria-hidden="true" />
                        Duplicar
                      </Button>
                    )}
                    {can.delete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => setRemoving(competition)}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Eliminar
                      </Button>
                    )}
                  </footer>
                )}
              </article>
            )
          })}
        </div>
      )}

      <ConfigSheet
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === 'new' ? 'Nueva competencia' : 'Editar competencia'}
        description="Datos, categorías que la juegan y papeles que pide."
        wide
      >
        {editing !== null && (
          <CompetitionForm
            competition={editing === 'new' ? null : editing}
            sports={sports}
            seasons={seasons}
            categories={categories}
            defaults={filters}
            onDone={() => setEditing(null)}
          />
        )}
      </ConfigSheet>

      <ConfigSheet
        open={copying !== null}
        onOpenChange={(open) => !open && setCopying(null)}
        title="Duplicar competencia"
        description="Se copian los datos y los requisitos. Después elegís sus categorías: por ejemplo, la misma liga para la rama masculina."
      >
        {copying && (
          <CopyForm
            competition={copying}
            seasons={seasons}
            onDone={(id) => {
              setCopying(null)
              if (id) setOpenAfterCopy(id)
            }}
          />
        )}
      </ConfigSheet>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`¿Eliminar ${removing?.name ?? 'la competencia'}?`}
        description="Se borran sus requisitos y los papeles que cargaron los jugadores para ella. No se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => deleteCompetitionAction(removing!.id)}
      />
    </section>
  )
}

/* Formulario */

type RequirementRow = {
  key: string
  id?: number
  name: string
  validity: string
  requires_file: boolean
  minors_only: boolean
  is_required: boolean
}

let rowSeq = 0
const newKey = () => `r${++rowSeq}`

function toRow(r: CompetitionRequirement | Omit<RequirementInput, 'id'>): RequirementRow {
  return {
    key: newKey(),
    id: 'id' in r ? r.id : undefined,
    name: r.name,
    validity: r.validity_months ? String(r.validity_months) : '',
    requires_file: r.requires_file,
    minors_only: r.minors_only,
    is_required: r.is_required,
  }
}

function CompetitionForm({
  competition,
  sports,
  seasons,
  categories,
  defaults,
  onDone,
}: {
  competition: Competition | null
  sports: Sport[]
  seasons: Season[]
  categories: Category[]
  defaults: { sport: string; season: string }
  onDone: () => void
}) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const activeSports = sports.filter((s) => s.is_active || s.id === competition?.sport_id)
  const currentSeason = seasons.find((s) => s.status === 'active') ?? seasons[0]

  const [sportId, setSportId] = useState(
    competition ? String(competition.sport_id) : defaults.sport !== ALL ? defaults.sport : String(activeSports[0]?.id ?? ''),
  )
  const [seasonId, setSeasonId] = useState(
    competition ? String(competition.season_id) : defaults.season !== ALL ? defaults.season : String(currentSeason?.id ?? ''),
  )
  const [categoryIds, setCategoryIds] = useState<number[]>(competition?.categories?.map((c) => c.id) ?? [])
  const [rows, setRows] = useState<RequirementRow[]>(() => (competition?.requirements ?? []).map(toRow))
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const available = categories.filter(
    (c) =>
      String(c.sport_id) === sportId &&
      String(c.season_id) === seasonId &&
      (c.is_active || categoryIds.includes(c.id)),
  )
  // Al cambiar de deporte o temporada, las categorías elegidas que ya no corresponden no se mandan.
  const selected = categoryIds.filter((id) => available.some((c) => c.id === id))

  const update = (index: number, patch: Partial<RequirementRow>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  const move = (from: number, to: number) =>
    setRows((prev) => {
      if (to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  const missingSuggestions = SUGGESTED.filter(
    (s) => !rows.some((r) => r.name.trim().toLowerCase() === s.name.toLowerCase()),
  )

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        execute(
          () =>
            saveCompetitionAction(competition?.id ?? null, {
              sport_id: Number(sportId),
              season_id: Number(seasonId),
              name: String(data.get('name') ?? ''),
              organizer: String(data.get('organizer') ?? ''),
              registration_deadline: String(data.get('registration_deadline') ?? ''),
              category_ids: selected,
              requirements: rows.map((r) => ({
                ...(r.id ? { id: r.id } : {}),
                name: r.name,
                validity_months: r.validity.trim() === '' ? null : Number(r.validity),
                requires_file: r.requires_file,
                minors_only: r.minors_only,
                is_required: r.is_required,
              })),
            }),
          onDone,
        )
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-5 px-4 pb-4">
        <div className="flex flex-col gap-4">
          <Field
            id="comp-name"
            name="name"
            label="Nombre"
            placeholder="ej. Liga Metropolitana 2027"
            defaultValue={competition?.name}
            maxLength={150}
            required
            autoFocus
            error={fieldErrors.name}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FormSelect
                id="comp-sport"
                label="Deporte"
                value={sportId}
                onChange={setSportId}
                options={activeSports.map((s) => ({ value: String(s.id), label: s.name }))}
              />
              {fieldErrors.sport_id && <p className="text-xs text-destructive">{fieldErrors.sport_id}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <FormSelect
                id="comp-season"
                label="Temporada"
                value={seasonId}
                onChange={setSeasonId}
                options={seasons.map((s) => ({ value: String(s.id), label: s.name }))}
              />
              {fieldErrors.season_id && <p className="text-xs text-destructive">{fieldErrors.season_id}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="comp-organizer"
              name="organizer"
              label="Organiza"
              placeholder="ej. Federación Metropolitana"
              defaultValue={competition?.organizer ?? ''}
              maxLength={150}
              error={fieldErrors.organizer}
            />
            <Field
              id="comp-deadline"
              name="registration_deadline"
              type="date"
              label="Cierre de inscripción"
              hint="Opcional. Se usa para avisar los días que faltan."
              defaultValue={competition?.registration_deadline ?? ''}
              error={fieldErrors.registration_deadline}
            />
          </div>
        </div>

        {/* Categorías */}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Categorías que la juegan</legend>
          {available.length === 0 ? (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              No hay categorías activas de este deporte en esta temporada. Crealas en la pestaña Categorías.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {available.map((c) => {
                const checked = selected.includes(c.id)
                return (
                  <label
                    key={c.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring',
                      checked ? 'border-primary/50 bg-primary/10 text-foreground' : 'hover:bg-muted',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={checked}
                      onChange={() =>
                        setCategoryIds((prev) => (checked ? prev.filter((id) => id !== c.id) : [...prev, c.id]))
                      }
                    />
                    {c.name}
                  </label>
                )
              })}
            </div>
          )}
          {fieldErrors.category_ids && <p className="text-xs text-destructive">{fieldErrors.category_ids}</p>}
        </fieldset>

        {/* Requisitos */}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Requisitos para estar habilitado</legend>
          <p className="-mt-1 text-xs text-muted-foreground">
            Los papeles que pide la competencia. Arrastrá para ordenarlos como aparecen en la ficha del jugador.
          </p>

          {rows.length > 0 && (
            <ol className="flex flex-col gap-2">
              {rows.map((row, i) => (
                <li
                  key={row.key}
                  draggable
                  onDragStart={(e) => {
                    setDragIndex(i)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (dragIndex !== null && dragIndex !== i) {
                      move(dragIndex, i)
                      setDragIndex(i)
                    }
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className={cn(
                    'flex flex-col gap-2 rounded-lg border bg-card p-3',
                    dragIndex === i && 'border-primary/50 opacity-70',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical
                      className="mt-2 size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
                      aria-hidden="true"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <Label htmlFor={`req-name-${row.key}`} className="sr-only">
                        Nombre del requisito {i + 1}
                      </Label>
                      <Input
                        id={`req-name-${row.key}`}
                        value={row.name}
                        onChange={(e) => update(i, { name: e.target.value })}
                        placeholder="ej. Apto médico"
                        maxLength={120}
                        aria-invalid={fieldErrors[`requirements.${i}.name`] ? true : undefined}
                      />
                      {fieldErrors[`requirements.${i}.name`] && (
                        <p className="text-xs text-destructive">{fieldErrors[`requirements.${i}.name`]}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={i === 0}
                        onClick={() => move(i, i - 1)}
                        aria-label={`Subir ${row.name || `requisito ${i + 1}`}`}
                      >
                        <ArrowUp className="size-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={i === rows.length - 1}
                        onClick={() => move(i, i + 1)}
                        aria-label={`Bajar ${row.name || `requisito ${i + 1}`}`}
                      >
                        <ArrowDown className="size-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                        aria-label={`Quitar ${row.name || `requisito ${i + 1}`}`}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-6 text-sm">
                    <label className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Vence cada</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={120}
                        value={row.validity}
                        onChange={(e) => update(i, { validity: e.target.value })}
                        placeholder="—"
                        className="h-7 w-16 px-2 text-xs"
                        aria-invalid={fieldErrors[`requirements.${i}.validity_months`] ? true : undefined}
                      />
                      <span className="text-xs text-muted-foreground">meses</span>
                    </label>
                    <Toggle checked={row.requires_file} onChange={(v) => update(i, { requires_file: v })}>
                      Pide archivo
                    </Toggle>
                    <Toggle checked={row.minors_only} onChange={(v) => update(i, { minors_only: v })}>
                      Solo menores
                    </Toggle>
                    <Toggle checked={row.is_required} onChange={(v) => update(i, { is_required: v })}>
                      Obligatorio
                    </Toggle>
                  </div>
                  {fieldErrors[`requirements.${i}.validity_months`] && (
                    <p className="pl-6 text-xs text-destructive">{fieldErrors[`requirements.${i}.validity_months`]}</p>
                  )}
                </li>
              ))}
            </ol>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                setRows((prev) => [
                  ...prev,
                  toRow({ name: '', validity_months: null, requires_file: true, minors_only: false, is_required: true }),
                ])
              }
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Agregar requisito
            </Button>
            {missingSuggestions.map((s) => (
              <Button
                key={s.name}
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setRows((prev) => [...prev, toRow(s)])}
              >
                <Plus className="size-3" aria-hidden="true" />
                {s.name}
              </Button>
            ))}
          </div>
        </fieldset>

        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{competition ? 'Guardar cambios' : 'Crear competencia'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}

function Toggle({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  children: React.ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-xs">
      <input type="checkbox" className="size-3.5 accent-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  )
}

function CopyForm({ competition, seasons, onDone }: { competition: Competition; seasons: Season[]; onDone: (id?: number) => void }) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [seasonId, setSeasonId] = useState(String(competition.season_id))
  const sameSeason = Number(seasonId) === competition.season_id

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('season_id', seasonId)
        execute(() => copyCompetitionAction(competition.id, data), (result) => onDone(result.id))
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <div className="flex flex-col gap-1.5">
          <FormSelect
            id="copy-season"
            label="Temporada"
            value={seasonId}
            onChange={setSeasonId}
            options={seasons.map((s) => ({ value: String(s.id), label: s.id === competition.season_id ? `${s.name} (la misma)` : s.name }))}
          />
          {fieldErrors.season_id && <p className="text-xs text-destructive">{fieldErrors.season_id}</p>}
        </div>
        <Field
          id="copy-name"
          name="name"
          label="Nombre"
          key={sameSeason ? 'misma' : 'otra'}
          defaultValue={sameSeason ? `${competition.name} (copia)` : competition.name}
          maxLength={150}
          required
          error={fieldErrors.name}
        />
        <Field
          id="copy-deadline"
          name="registration_deadline"
          type="date"
          label="Cierre de inscripción"
          hint="Opcional."
          error={fieldErrors.registration_deadline}
        />
        <p className="text-xs text-muted-foreground">
          Se copian {competition.requirements?.length ?? 0} requisitos.
        </p>
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>Duplicar y elegir categorías</SubmitButton>
      </SheetFooter>
    </form>
  )
}
