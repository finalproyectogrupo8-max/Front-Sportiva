'use client'

import { useMemo, useState } from 'react'
import { CalendarClock, Search, ShieldCheck, ShieldX } from 'lucide-react'
import { EmptyConfig } from '@/components/club/forms'
import { Input } from '@/components/ui/input'
import type { CategoryEligibility, PlayerEligibility, RequirementStatus } from '@/lib/api/eligibility'
import { cn } from '@/lib/utils'
import { RequirementPanel } from './requirement-panel'
import { REQUIREMENT_STATUS } from './status'

type Column = { id: number; name: string; competition: string; required: boolean }

/** Grilla jugador × requisito con semáforo. Las acciones reemplazan la fila del jugador en el lugar. */
export function EligibilityGrid({
  club,
  rows: initialRows,
  summary,
  can,
}: {
  club: string
  rows: PlayerEligibility[]
  summary: CategoryEligibility | null
  can: { update: boolean; approve: boolean }
}) {
  const [rows, setRows] = useState(initialRows)
  const [onlyMissing, setOnlyMissing] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<{ playerId: number; requirementId: number } | null>(null)

  // Columnas: todos los requisitos de las competencias de la categoría, en el orden de la API.
  const columns = useMemo(() => {
    const byId = new Map<number, Column>()
    for (const row of rows) {
      for (const r of row.requirements) {
        if (!byId.has(r.requirement_id)) {
          byId.set(r.requirement_id, { id: r.requirement_id, name: r.name, competition: r.competition_name, required: r.is_required })
        }
      }
    }
    return [...byId.values()]
  }, [rows])
  const manyCompetitions = new Set(columns.map((c) => c.competition)).size > 1

  const eligible = rows.filter((r) => r.is_eligible).length
  const term = search.trim().toLowerCase()
  const visible = rows.filter((r) => (!onlyMissing || !r.is_eligible) && (!term || r.player_name.toLowerCase().includes(term)))

  const selectedRow = selected ? rows.find((r) => r.player_id === selected.playerId) : undefined
  const selectedStatus = selectedRow?.requirements.find((r) => r.requirement_id === selected?.requirementId)

  /** Cambia el estado de una celda ya (optimista) y devuelve cómo deshacerlo. */
  const optimistic = (playerId: number, requirementId: number, status: string) => {
    const before = rows
    setRows((prev) =>
      prev.map((row) =>
        row.player_id !== playerId
          ? row
          : { ...row, requirements: row.requirements.map((r) => (r.requirement_id === requirementId ? { ...r, status } : r)) },
      ),
    )
    return () => setRows(before)
  }
  const replaceRow = (row: PlayerEligibility) => setRows((prev) => prev.map((r) => (r.player_id === row.player_id ? row : r)))

  if (rows.length === 0) {
    return (
      <EmptyConfig
        icon={ShieldCheck}
        title="La categoría no tiene jugadores"
        description="Sumá jugadores desde su ficha en el módulo Jugadores y acá vas a ver qué papeles le faltan a cada uno."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border bg-card p-4">
        <p className="flex items-baseline gap-1.5">
          <span className="font-display text-3xl font-bold leading-none tabular-nums">{eligible}</span>
          <span className="text-sm text-muted-foreground">de {rows.length} habilitados</span>
        </p>
        {summary?.days_to_deadline != null && (
          <p className={cn('flex items-center gap-1.5 text-sm', summary.days_to_deadline <= 15 && eligible < rows.length ? 'font-medium text-destructive' : 'text-muted-foreground')}>
            <CalendarClock className="size-4" aria-hidden="true" />
            {summary.days_to_deadline === 0 ? 'La inscripción cierra hoy' : `Cierre de inscripción en ${summary.days_to_deadline} días`}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar jugador" aria-label="Buscar jugador" className="h-9 pl-9" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} className="size-4 accent-primary" />
            Solo a los que les falta algo
          </label>
        </div>
      </div>

      {/* Referencias */}
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Referencias">
        {(['approved', 'submitted', 'pending', 'rejected', 'expired'] as const).map((s) => {
          const Icon = REQUIREMENT_STATUS[s].icon
          return (
            <li key={s} className="flex items-center gap-1.5">
              <span className={cn('flex size-5 items-center justify-center rounded-md', REQUIREMENT_STATUS[s].className)}>
                <Icon className="size-3" aria-hidden="true" />
              </span>
              {REQUIREMENT_STATUS[s].label}
            </li>
          )
        })}
        <li className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
          Vence en 30 días
        </li>
      </ul>

      {/* Grilla: scroll horizontal y la columna del jugador fija */}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Papeles de cada jugador de la categoría</caption>
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="sticky left-0 z-10 min-w-44 border-b bg-muted px-4 py-2.5 text-left font-medium sm:min-w-56">
                Jugador
              </th>
              {columns.map((c) => (
                <th key={c.id} scope="col" className="min-w-24 border-b bg-muted px-2 py-2.5 text-center font-medium">
                  <span className="block leading-tight text-foreground">{c.name}</span>
                  {(manyCompetitions || !c.required) && (
                    <span className="block text-[10px] font-normal leading-tight">
                      {[manyCompetitions ? c.competition : null, c.required ? null : 'opcional'].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.player_id} className="group">
                <th scope="row" className="sticky left-0 z-10 border-b bg-card px-4 py-2.5 text-left font-normal group-hover:bg-muted">
                  <span className="flex items-center gap-2">
                    {row.is_eligible ? (
                      <ShieldCheck className="size-4 shrink-0 text-success" aria-label="Habilitado" />
                    ) : (
                      <ShieldX className="size-4 shrink-0 text-destructive" aria-label="No habilitado" />
                    )}
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">
                        {row.shirt_number != null && <span className="tabular-nums text-muted-foreground">{row.shirt_number} · </span>}
                        {row.player_name}
                      </span>
                      {!row.is_eligible && (
                        <span className="text-[11px] text-destructive">
                          Le {row.missing === 1 ? 'falta 1 papel' : `faltan ${row.missing} papeles`}
                        </span>
                      )}
                    </span>
                  </span>
                </th>
                {columns.map((c) => {
                  const cell = row.requirements.find((r) => r.requirement_id === c.id)
                  return (
                    <td key={c.id} className="border-b px-2 py-2 text-center group-hover:bg-muted/40">
                      {cell && <Cell cell={cell} playerName={row.player_name} onOpen={() => setSelected({ playerId: row.player_id, requirementId: c.id })} />}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {onlyMissing && !term ? 'Todos están habilitados.' : 'Ningún jugador coincide con la búsqueda.'}
          </p>
        )}
      </div>

      <RequirementPanel
        club={club}
        open={Boolean(selectedRow && selectedStatus)}
        onOpenChange={(o) => !o && setSelected(null)}
        row={selectedRow ?? null}
        requirement={selectedStatus ?? null}
        can={can}
        onOptimistic={optimistic}
        onSaved={replaceRow}
      />
    </div>
  )
}

function Cell({ cell, playerName, onOpen }: { cell: RequirementStatus; playerName: string; onOpen: () => void }) {
  const s = REQUIREMENT_STATUS[cell.status] ?? REQUIREMENT_STATUS.pending
  const Icon = s.icon
  if (cell.status === 'not_applicable') {
    return (
      <span className="text-xs text-muted-foreground/60" title="No le corresponde">
        <span aria-hidden="true">—</span>
        <span className="sr-only">No aplica</span>
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'relative inline-flex size-9 items-center justify-center rounded-lg transition hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        s.className,
      )}
      aria-label={`${cell.name} de ${playerName}: ${s.label}${cell.expiring_soon ? ', vence pronto' : ''}`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {cell.expiring_soon && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-warning ring-2 ring-card" aria-hidden="true" />}
    </button>
  )
}
