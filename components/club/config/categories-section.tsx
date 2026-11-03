'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Layers, Pencil, Plus, Power } from 'lucide-react'
import { saveCategoryAction, setCategoryActiveAction } from '@/app/(app)/c/[club]/configuracion/actions'
import { FormSelect, Pill } from '@/components/club/shared'
import { BRANCHES, isBranch } from '@/lib/branches'
import { Button } from '@/components/ui/button'
import { SheetFooter } from '@/components/ui/sheet'
import type { Category, Season, Sport } from '@/lib/api/club'
import { ConfigSheet, ConfigTable, ConfirmDialog, Field, FormError, RowActions, SubmitButton, useConfigAction } from '@/components/club/forms'
import { EmptyConfig } from '@/components/club/empty-state'

const ALL = 'todos'
const NO_BRANCH = 'sin-rama'

function ageRange(category: Category): string {
  const { min_age: min, max_age: max } = category
  if (min != null && max != null) return min === max ? `${min} años` : `${min} a ${max} años`
  if (min != null) return `Desde ${min} años`
  if (max != null) return `Hasta ${max} años`
  return '—'
}

export function CategoriesSection({
  categories,
  sports,
  seasons,
  filters,
  can,
}: {
  categories: Category[]
  sports: Sport[]
  seasons: Season[]
  filters: { sport: string; season: string; branch: string }
  can: { create: boolean; update: boolean; delete: boolean }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [filtering, startFilter] = useTransition()
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [removing, setRemoving] = useState<Category | null>(null)
  const toggle = useConfigAction()

  const sportName = new Map(sports.map((s) => [s.id, s.name]))
  const seasonName = new Map(seasons.map((s) => [s.id, s.name]))
  const ready = sports.some((s) => s.is_active) && seasons.length > 0

  const setFilter = (key: 'deporte' | 'temporada' | 'rama', value: string) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (value === ALL) sp.delete(key)
    else sp.set(key, value)
    startFilter(() => router.replace(`${pathname}?${sp.toString()}`, { scroll: false }))
  }

  const addButton = can.create && ready && (
    <Button onClick={() => setEditing('new')} className="gap-2">
      <Plus className="size-4" aria-hidden="true" />
      Nueva categoría
    </Button>
  )

  if (!ready) {
    return (
      <EmptyConfig
        icon={Layers}
        title="Primero cargá un deporte y una temporada"
        description="Cada categoría es de un deporte en una temporada, por ejemplo Sub-15 de Fútbol en la temporada 2027."
      />
    )
  }

  const filtered = filters.sport !== ALL || filters.season !== ALL || filters.branch !== ALL

  return (
    <section className="flex flex-col gap-4" aria-label="Categorías">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className={`grid w-full gap-3 sm:w-auto sm:grid-cols-3 ${filtering ? 'opacity-60' : ''}`}>
          <div className="sm:w-52">
            <FormSelect
              id="filter-sport"
              label="Deporte"
              value={filters.sport}
              onChange={(v) => setFilter('deporte', v)}
              options={[{ value: ALL, label: 'Todos' }, ...sports.map((s) => ({ value: String(s.id), label: s.name }))]}
            />
          </div>
          <div className="sm:w-52">
            <FormSelect
              id="filter-season"
              label="Temporada"
              value={filters.season}
              onChange={(v) => setFilter('temporada', v)}
              options={[{ value: ALL, label: 'Todas' }, ...seasons.map((s) => ({ value: String(s.id), label: s.name }))]}
            />
          </div>
          <div className="sm:w-40">
            <FormSelect
              id="filter-branch"
              label="Rama"
              value={filters.branch}
              onChange={(v) => setFilter('rama', v)}
              options={[{ value: ALL, label: 'Todas' }, ...Object.entries(BRANCHES).map(([value, label]) => ({ value, label }))]}
            />
          </div>
        </div>
        {addButton}
      </div>

      {categories.length === 0 ? (
        <EmptyConfig
          icon={Layers}
          title={filtered ? 'No hay categorías con estos filtros' : 'Todavía no cargaste categorías'}
          description={
            filtered
              ? 'Probá con otro deporte, temporada o rama.'
              : 'Creá las categorías de la temporada, por ejemplo Sub-13, Sub-15 o Primera.'
          }
        />
      ) : (
        <ConfigTable
          caption="Categorías del club"
          head={
            <tr>
              <th scope="col" className="px-4 py-3">Categoría</th>
              <th scope="col" className="hidden px-4 py-3 sm:table-cell">Deporte</th>
              <th scope="col" className="hidden px-4 py-3 md:table-cell">Temporada</th>
              <th scope="col" className="hidden px-4 py-3 md:table-cell">Edades</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3 text-right">Acciones</th>
            </tr>
          }
        >
          {categories.map((category) => (
            <tr key={category.id} className="transition-colors hover:bg-muted/40">
              <td className="px-4 py-3">
                <span className="font-medium">{category.name}</span>
                {isBranch(category.branch) && (
                  <Pill tone="neutral" className="ml-2">
                    {BRANCHES[category.branch]}
                  </Pill>
                )}
                <span className="block text-xs text-muted-foreground sm:hidden">
                  {sportName.get(category.sport_id)} · {seasonName.get(category.season_id)}
                </span>
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">{sportName.get(category.sport_id) ?? '—'}</td>
              <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                {seasonName.get(category.season_id) ?? '—'}
              </td>
              <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{ageRange(category)}</td>
              <td className="px-4 py-3">
                <Pill tone={category.is_active ? 'ok' : 'neutral'}>{category.is_active ? 'Activa' : 'Inactiva'}</Pill>
              </td>
              <td className="px-4 py-3">
                <RowActions>
                  {can.update && (
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing(category)}>
                      <Pencil className="size-3.5" aria-hidden="true" />
                      <span className="sr-only sm:not-sr-only">Editar</span>
                    </Button>
                  )}
                  {category.is_active
                    ? can.delete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-destructive hover:text-destructive"
                          onClick={() => setRemoving(category)}
                        >
                          <Power className="size-3.5" aria-hidden="true" />
                          <span className="sr-only sm:not-sr-only">Desactivar</span>
                        </Button>
                      )
                    : can.update && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5"
                          disabled={toggle.pending}
                          onClick={() => toggle.execute(() => setCategoryActiveAction(category.id, true))}
                        >
                          <Power className="size-3.5" aria-hidden="true" />
                          <span className="sr-only sm:not-sr-only">Activar</span>
                        </Button>
                      )}
                </RowActions>
              </td>
            </tr>
          ))}
        </ConfigTable>
      )}

      <ConfigSheet
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === 'new' ? 'Nueva categoría' : 'Editar categoría'}
      >
        {editing !== null && (
          <CategoryForm
            category={editing === 'new' ? null : editing}
            sports={sports}
            seasons={seasons}
            defaults={filters}
            onDone={() => setEditing(null)}
          />
        )}
      </ConfigSheet>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`¿Desactivar ${removing?.name ?? 'la categoría'}?`}
        description="Deja de aparecer en los selectores de partidos y jugadores. El plantel y el historial se conservan."
        confirmLabel="Desactivar"
        onConfirm={() => setCategoryActiveAction(removing!.id, false)}
      />
    </section>
  )
}

function CategoryForm({
  category,
  sports,
  seasons,
  defaults,
  onDone,
}: {
  category: Category | null
  sports: Sport[]
  seasons: Season[]
  defaults: { sport: string; season: string }
  onDone: () => void
}) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const activeSports = sports.filter((s) => s.is_active || s.id === category?.sport_id)
  const currentSeason = seasons.find((s) => s.status === 'active') ?? seasons[0]

  const [sportId, setSportId] = useState(
    category ? String(category.sport_id) : defaults.sport !== ALL ? defaults.sport : String(activeSports[0]?.id ?? ''),
  )
  const [branch, setBranch] = useState<string>(category?.branch ?? NO_BRANCH)
  const [seasonId, setSeasonId] = useState(
    category ? String(category.season_id) : defaults.season !== ALL ? defaults.season : String(currentSeason?.id ?? ''),
  )

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('sport_id', sportId)
        data.set('season_id', seasonId)
        data.set('branch', branch === NO_BRANCH ? '' : branch)
        execute(() => saveCategoryAction(category?.id ?? null, data), onDone)
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <div className="flex flex-col gap-1.5">
          <FormSelect
            id="category-sport"
            label="Deporte"
            value={sportId}
            onChange={setSportId}
            options={activeSports.map((s) => ({ value: String(s.id), label: s.name }))}
          />
          {fieldErrors.sport_id && <p className="text-xs text-destructive">{fieldErrors.sport_id}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <FormSelect
            id="category-season"
            label="Temporada"
            value={seasonId}
            onChange={setSeasonId}
            options={seasons.map((s) => ({ value: String(s.id), label: s.name }))}
          />
          {fieldErrors.season_id && <p className="text-xs text-destructive">{fieldErrors.season_id}</p>}
        </div>
        <Field
          id="category-name"
          name="name"
          label="Nombre"
          placeholder="ej. Sub-15"
          defaultValue={category?.name}
          maxLength={80}
          required
          autoFocus
          error={fieldErrors.name}
        />
        <div className="flex flex-col gap-1.5">
          <FormSelect
            id="category-branch"
            label="Rama"
            value={branch}
            onChange={setBranch}
            options={[{ value: NO_BRANCH, label: 'Sin definir' }, ...Object.entries(BRANCHES).map(([value, label]) => ({ value, label }))]}
          />
          {fieldErrors.branch && <p className="text-xs text-destructive">{fieldErrors.branch}</p>}
          <p className="text-xs text-muted-foreground">Con rama femenina o masculina, el sistema avisa si sumás a un jugador de otro género.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            id="category-min"
            name="min_age"
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            label="Edad desde"
            defaultValue={category?.min_age ?? ''}
            error={fieldErrors.min_age}
          />
          <Field
            id="category-max"
            name="max_age"
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            label="Edad hasta"
            defaultValue={category?.max_age ?? ''}
            error={fieldErrors.max_age}
          />
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">Opcional. Dejalas vacías si la categoría no tiene límite de edad.</p>
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{category ? 'Guardar cambios' : 'Crear categoría'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}
