'use client'

import { useState } from 'react'
import { ArrowDownToLine, ArrowLeftRight, Download, ArrowUpFromLine, Boxes, Pencil, Plus, Scale, Trash2, Warehouse } from 'lucide-react'
import {
  deleteLocationAction,
  deleteMaterialAction,
  recordMovementAction,
  saveLocationAction,
  saveMaterialAction,
  transferAction,
} from '@/app/(app)/c/[club]/materiales/actions'
import { EmptyConfig } from '@/components/club/empty-state'
import { ConfigSheet, ConfigTable, ConfirmDialog, Field, FormError, RowActions, SubmitButton, useConfigAction } from '@/components/club/forms'
import { FormSelect, Meter, ModuleHeader, PageBody, Pill, Segmented, Stat, type Tone } from '@/components/club/shared'
import { usePathname } from 'next/navigation'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SheetFooter } from '@/components/ui/sheet'
import type { InventoryBalance, InventoryMovement, Material, StorageLocation } from '@/lib/api/inventory'
import { cn } from '@/lib/utils'

type Can = {
  viewStock: boolean
  adjust: boolean
  transfer: boolean
  createMaterial: boolean
  updateMaterial: boolean
  deleteMaterial: boolean
  createLocation: boolean
  updateLocation: boolean
  deleteLocation: boolean
}
type Tab = 'stock' | 'movimientos' | 'catalogo'
type MovementType = 'in' | 'out' | 'adjustment'

const MOVEMENT: Record<string, { label: string; sign: 1 | -1 | 0; icon: React.ComponentType<{ className?: string }>; tone: Tone }> = {
  in: { label: 'Ingreso', sign: 1, icon: ArrowDownToLine, tone: 'ok' },
  out: { label: 'Egreso', sign: -1, icon: ArrowUpFromLine, tone: 'bad' },
  adjustment: { label: 'Ajuste', sign: 0, icon: Scale, tone: 'warn' },
  transfer_in: { label: 'Transferencia (entra)', sign: 1, icon: ArrowLeftRight, tone: 'info' },
  transfer_out: { label: 'Transferencia (sale)', sign: -1, icon: ArrowLeftRight, tone: 'info' },
}
const WHEN = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toLocaleString('es-AR', { maximumFractionDigits: 2 }))

/** Materiales (FRO-19): stock por depósito, movimientos y catálogo, contra la API. */
export function MaterialsModule({
  materials,
  locations,
  balances,
  movements,
  loadError,
  can,
}: {
  materials: Material[]
  locations: StorageLocation[]
  balances: InventoryBalance[]
  movements: InventoryMovement[]
  loadError: boolean
  can: Can
}) {
  const [tab, setTab] = useState<Tab>(can.viewStock ? 'stock' : 'catalogo')
  const [location, setLocation] = useState<string>('all')
  const [moving, setMoving] = useState<{ type: MovementType; materialId?: number; locationId?: number } | null>(null)
  const [transferring, setTransferring] = useState<{ materialId?: number; fromId?: number } | null>(null)

  const qty = (materialId: number, locationId?: number) =>
    balances.filter((b) => b.material_id === materialId && (locationId === undefined || b.location_id === locationId)).reduce((s, b) => s + Number(b.quantity), 0)
  const activeMaterials = materials.filter((m) => m.is_active)
  const activeLocations = locations.filter((l) => l.is_active)
  const shownMaterials = activeMaterials.map((m) => {
    const total = location === 'all' ? qty(m.id) : qty(m.id, Number(location))
    return { material: m, total, low: total < Number(m.minimum_stock) }
  })
  const lowCount = activeMaterials.filter((m) => qty(m.id) < Number(m.minimum_stock)).length

  const pathname = usePathname()

  return (
    <>
      <ModuleHeader
        eyebrow="Operación"
        title="Materiales"
        description="Stock de utilería por depósito: ingresos, egresos, ajustes por conteo y transferencias, con su historial."
        actions={
          <>
            {balances.length > 0 && (
              <a href={`${pathname}/exportar`} className={buttonVariants({ variant: 'ghost', className: 'gap-1.5' })}>
                <Download className="size-4" aria-hidden="true" />
                Exportar stock
              </a>
            )}
            {can.transfer && activeLocations.length > 1 && (
              <Button variant="outline" className="gap-1.5" onClick={() => setTransferring({})}>
                <ArrowLeftRight className="size-4" aria-hidden="true" />
                Transferir
              </Button>
            )}
            {can.adjust && activeMaterials.length > 0 && activeLocations.length > 0 && (
              <Button className="gap-1.5" onClick={() => setMoving({ type: 'in' })}>
                <Plus className="size-4" aria-hidden="true" />
                Registrar movimiento
              </Button>
            )}
          </>
        }
      >
        <Segmented
          label="Vista"
          value={tab}
          onChange={setTab}
          options={[
            ...(can.viewStock
              ? [
                  { value: 'stock' as Tab, label: 'Stock', count: activeMaterials.length },
                  { value: 'movimientos' as Tab, label: 'Movimientos' },
                ]
              : []),
            { value: 'catalogo' as Tab, label: 'Materiales y depósitos' },
          ]}
        />
      </ModuleHeader>

      <PageBody>
        {loadError && <FormError message="No se pudieron cargar los materiales. Recargá la página." />}

        {tab === 'stock' && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Materiales" value={activeMaterials.length} />
              <Stat label="Depósitos" value={activeLocations.length} />
              <Stat label="Bajo mínimo" value={<span className={lowCount ? 'text-destructive' : ''}>{lowCount}</span>} />
              <Stat label="Movimientos recientes" value={movements.length} />
            </div>

            {activeLocations.length > 1 && (
              <Segmented
                label="Depósito"
                value={location}
                onChange={setLocation}
                options={[{ value: 'all', label: 'Todos' }, ...activeLocations.map((l) => ({ value: String(l.id), label: l.name }))]}
              />
            )}

            {activeMaterials.length === 0 ? (
              <EmptyConfig
                icon={Boxes}
                title="Todavía no hay materiales"
                description={activeLocations.length === 0 ? 'Empezá por crear un depósito y después los materiales (pelotas, conos, pecheras…).' : 'Cargá los materiales que guarda el club para llevar su stock.'}
                action={
                  (can.createMaterial || can.createLocation) && (
                    <Button onClick={() => setTab('catalogo')}>Ir a materiales y depósitos</Button>
                  )
                }
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {shownMaterials.map(({ material: m, total, low }) => {
                  const min = Number(m.minimum_stock)
                  const tone: Tone = low ? (total < min / 2 ? 'bad' : 'warn') : 'ok'
                  const perLocation = activeLocations.map((l) => ({ location: l, quantity: qty(m.id, l.id) })).filter((x) => x.quantity > 0)
                  return (
                    <li key={m.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-col">
                          <span className="font-medium leading-snug">{m.name}</span>
                          {m.description && <span className="truncate text-xs text-muted-foreground">{m.description}</span>}
                        </div>
                        <Pill tone={tone}>{tone === 'ok' ? 'OK' : tone === 'warn' ? 'Reponer' : 'Crítico'}</Pill>
                      </div>
                      <div className="flex items-end justify-between">
                        <span>
                          <span className="font-display text-3xl font-bold leading-none tabular-nums">{fmt(total)}</span>
                          <span className="text-xs text-muted-foreground"> {m.unit}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">mín. {fmt(min)}</span>
                      </div>
                      <Meter value={total} max={Math.max(min * 2, total, 1)} tone={tone} />
                      {location === 'all' && perLocation.length > 0 && (
                        <ul className="flex flex-wrap gap-1.5 text-xs">
                          {perLocation.map((x) => (
                            <li key={x.location.id} className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                              {x.location.name}: <span className="font-medium tabular-nums text-foreground">{fmt(x.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {can.adjust && (
                        <div className="mt-auto flex flex-wrap gap-1.5 border-t pt-3">
                          {(['in', 'out', 'adjustment'] as const).map((type) => {
                            const Icon = MOVEMENT[type].icon
                            return (
                              <Button
                                key={type}
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5"
                                onClick={() => setMoving({ type, materialId: m.id, locationId: location === 'all' ? undefined : Number(location) })}
                              >
                                <Icon className="size-3.5" aria-hidden="true" />
                                {type === 'adjustment' ? 'Contar' : MOVEMENT[type].label}
                              </Button>
                            )
                          })}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}

        {tab === 'movimientos' && <MovementsTable movements={movements} />}

        {tab === 'catalogo' && <Catalog materials={materials} locations={locations} can={can} />}
      </PageBody>

      <ConfigSheet
        open={moving !== null}
        onOpenChange={(open) => !open && setMoving(null)}
        title="Registrar movimiento"
        description="Ingreso (compra o donación), egreso (se usó, se rompió, se perdió) o ajuste por conteo."
      >
        {moving && <MovementForm initial={moving} materials={activeMaterials} locations={activeLocations} qty={qty} onDone={() => setMoving(null)} />}
      </ConfigSheet>

      <ConfigSheet open={transferring !== null} onOpenChange={(open) => !open && setTransferring(null)} title="Transferir entre depósitos">
        {transferring && <TransferForm materials={activeMaterials} locations={activeLocations} qty={qty} onDone={() => setTransferring(null)} />}
      </ConfigSheet>
    </>
  )
}

function MovementsTable({ movements }: { movements: InventoryMovement[] }) {
  if (movements.length === 0) {
    return <EmptyConfig icon={ArrowLeftRight} title="Sin movimientos" description="Cada ingreso, egreso, ajuste o transferencia queda registrado acá." />
  }
  return (
    <ConfigTable
      caption="Últimos movimientos de stock"
      head={
        <tr>
          <th scope="col" className="px-4 py-3">Fecha</th>
          <th scope="col" className="px-4 py-3">Material</th>
          <th scope="col" className="hidden px-4 py-3 sm:table-cell">Depósito</th>
          <th scope="col" className="px-4 py-3">Tipo</th>
          <th scope="col" className="px-4 py-3 text-right">Cantidad</th>
          <th scope="col" className="hidden px-4 py-3 md:table-cell">Motivo</th>
        </tr>
      }
    >
      {movements.map((m) => {
        const kind = MOVEMENT[m.movement_type] ?? { label: m.movement_type, sign: 0, icon: Scale, tone: 'neutral' as Tone }
        const value = kind.sign === 0 ? Number(m.quantity) : kind.sign * Math.abs(Number(m.quantity))
        return (
          <tr key={m.id} className="transition-colors hover:bg-muted/40">
            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{WHEN.format(new Date(m.created_at))}</td>
            <td className="px-4 py-3">
              <span className="font-medium">{m.material?.name ?? `#${m.material_id}`}</span>
              <span className="block text-xs text-muted-foreground sm:hidden">{m.location?.name}</span>
            </td>
            <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{m.location?.name ?? `#${m.location_id}`}</td>
            <td className="px-4 py-3">
              <Pill tone={kind.tone}>{kind.label}</Pill>
            </td>
            <td className={cn('px-4 py-3 text-right font-display text-lg font-bold tabular-nums', value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : '')}>
              {value > 0 ? '+' : ''}
              {fmt(value)}
            </td>
            <td className="hidden max-w-64 truncate px-4 py-3 text-muted-foreground md:table-cell">
              {[m.reason, m.reference].filter(Boolean).join(' · ') || '—'}
            </td>
          </tr>
        )
      })}
    </ConfigTable>
  )
}

function MovementForm({
  initial,
  materials,
  locations,
  qty,
  onDone,
}: {
  initial: { type: MovementType; materialId?: number; locationId?: number }
  materials: Material[]
  locations: StorageLocation[]
  qty: (materialId: number, locationId?: number) => number
  onDone: () => void
}) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [type, setType] = useState<MovementType>(initial.type)
  const [materialId, setMaterialId] = useState(String(initial.materialId ?? materials[0]?.id ?? ''))
  const [locationId, setLocationId] = useState(String(initial.locationId ?? locations[0]?.id ?? ''))
  const material = materials.find((m) => String(m.id) === materialId)
  const current = materialId && locationId ? qty(Number(materialId), Number(locationId)) : 0

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('movement_type', type)
        data.set('material_id', materialId)
        data.set('location_id', locationId)
        data.set('current', String(current))
        execute(() => recordMovementAction(data), onDone)
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <Segmented
          label="Tipo de movimiento"
          value={type}
          onChange={setType}
          options={[
            { value: 'in', label: 'Ingreso' },
            { value: 'out', label: 'Egreso' },
            { value: 'adjustment', label: 'Ajuste por conteo' },
          ]}
        />
        <FormSelect id="mov-material" label="Material" value={materialId} onChange={setMaterialId} options={materials.map((m) => ({ value: String(m.id), label: m.name }))} />
        <FormSelect id="mov-location" label="Depósito" value={locationId} onChange={setLocationId} options={locations.map((l) => ({ value: String(l.id), label: l.name }))} />
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
          Hay <span className="font-semibold tabular-nums">{fmt(current)}</span> {material?.unit ?? ''} en este depósito.
        </p>
        <Field
          id="mov-quantity"
          name="quantity"
          type="number"
          inputMode="decimal"
          step="any"
          min={0}
          label={type === 'adjustment' ? 'Cantidad contada' : 'Cantidad'}
          hint={type === 'adjustment' ? 'Lo que hay de verdad: el sistema registra la diferencia.' : undefined}
          required
          autoFocus
          error={fieldErrors.quantity}
        />
        <Field id="mov-reason" name="reason" label="Motivo" placeholder={type === 'in' ? 'ej. Compra, donación' : type === 'out' ? 'ej. Se rompieron, se perdieron' : 'ej. Conteo de fin de mes'} maxLength={255} error={fieldErrors.reason} />
        <Field id="mov-reference" name="reference" label="Referencia" placeholder="ej. Factura 0001-1234" maxLength={100} error={fieldErrors.reference} />
        <FormError message={error ?? fieldErrors.material_id ?? fieldErrors.location_id} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{type === 'in' ? 'Registrar ingreso' : type === 'out' ? 'Registrar egreso' : 'Ajustar stock'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}

function TransferForm({
  materials,
  locations,
  qty,
  onDone,
}: {
  materials: Material[]
  locations: StorageLocation[]
  qty: (materialId: number, locationId?: number) => number
  onDone: () => void
}) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [materialId, setMaterialId] = useState(String(materials[0]?.id ?? ''))
  const [fromId, setFromId] = useState(String(locations[0]?.id ?? ''))
  const [toId, setToId] = useState(String(locations[1]?.id ?? ''))
  const available = materialId && fromId ? qty(Number(materialId), Number(fromId)) : 0

  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('material_id', materialId)
        data.set('from_location_id', fromId)
        data.set('to_location_id', toId)
        execute(() => transferAction(data), onDone)
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <FormSelect id="tr-material" label="Material" value={materialId} onChange={setMaterialId} options={materials.map((m) => ({ value: String(m.id), label: m.name }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormSelect id="tr-from" label="Desde" value={fromId} onChange={setFromId} options={locations.map((l) => ({ value: String(l.id), label: l.name }))} />
          <div className="flex flex-col gap-1.5">
            <FormSelect id="tr-to" label="Hacia" value={toId} onChange={setToId} options={locations.filter((l) => String(l.id) !== fromId).map((l) => ({ value: String(l.id), label: l.name }))} />
            {fieldErrors.to_location_id && <p className="text-xs text-destructive">{fieldErrors.to_location_id}</p>}
          </div>
        </div>
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
          Disponibles en el origen: <span className="font-semibold tabular-nums">{fmt(available)}</span>
        </p>
        <Field id="tr-quantity" name="quantity" type="number" inputMode="decimal" step="any" min={0.01} max={available || undefined} label="Cantidad" required autoFocus error={fieldErrors.quantity} />
        <Field id="tr-reason" name="reason" label="Motivo" placeholder="ej. Para el entrenamiento en el anexo" maxLength={255} error={fieldErrors.reason} />
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>Transferir</SubmitButton>
      </SheetFooter>
    </form>
  )
}

function Catalog({ materials, locations, can }: { materials: Material[]; locations: StorageLocation[]; can: Can }) {
  const [editingMaterial, setEditingMaterial] = useState<Material | 'new' | null>(null)
  const [editingLocation, setEditingLocation] = useState<StorageLocation | 'new' | null>(null)
  const [removing, setRemoving] = useState<{ kind: 'material'; item: Material } | { kind: 'location'; item: StorageLocation } | null>(null)

  return (
    <div className="grid gap-8 xl:grid-cols-2">
      <section className="flex flex-col gap-3" aria-labelledby="cat-materiales">
        <div className="flex items-center justify-between gap-3">
          <h2 id="cat-materiales" className="flex items-center gap-2 text-sm font-semibold">
            <Boxes className="size-4 text-muted-foreground" aria-hidden="true" />
            Materiales
          </h2>
          {can.createMaterial && (
            <Button size="sm" className="gap-1.5" onClick={() => setEditingMaterial('new')}>
              <Plus className="size-4" aria-hidden="true" />
              Nuevo material
            </Button>
          )}
        </div>
        {materials.length === 0 ? (
          <EmptyConfig icon={Boxes} title="Sin materiales" description="Pelotas, conos, pecheras, botiquín… con la unidad y el stock mínimo de cada uno." />
        ) : (
          <ConfigTable
            caption="Materiales"
            head={
              <tr>
                <th scope="col" className="px-4 py-3">Material</th>
                <th scope="col" className="px-4 py-3">Mínimo</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            }
          >
            {materials.map((m) => (
              <tr key={m.id} className={cn('transition-colors hover:bg-muted/40', !m.is_active && 'opacity-60')}>
                <td className="px-4 py-3">
                  <span className="font-medium">{m.name}</span>
                  {!m.is_active && <Pill tone="neutral" className="ml-2">Inactivo</Pill>}
                  {m.description && <span className="block truncate text-xs text-muted-foreground">{m.description}</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                  {fmt(Number(m.minimum_stock))} {m.unit}
                </td>
                <td className="px-4 py-3">
                  <RowActions>
                    {can.updateMaterial && (
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditingMaterial(m)}>
                        <Pencil className="size-3.5" aria-hidden="true" />
                        <span className="sr-only sm:not-sr-only">Editar</span>
                      </Button>
                    )}
                    {can.deleteMaterial && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setRemoving({ kind: 'material', item: m })} aria-label={`Eliminar ${m.name}`}>
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </RowActions>
                </td>
              </tr>
            ))}
          </ConfigTable>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="cat-depositos">
        <div className="flex items-center justify-between gap-3">
          <h2 id="cat-depositos" className="flex items-center gap-2 text-sm font-semibold">
            <Warehouse className="size-4 text-muted-foreground" aria-hidden="true" />
            Depósitos
          </h2>
          {can.createLocation && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditingLocation('new')}>
              <Plus className="size-4" aria-hidden="true" />
              Nuevo depósito
            </Button>
          )}
        </div>
        {locations.length === 0 ? (
          <EmptyConfig icon={Warehouse} title="Sin depósitos" description="Dónde se guardan los materiales: utilería, pañol, el anexo…" />
        ) : (
          <ConfigTable
            caption="Depósitos"
            head={
              <tr>
                <th scope="col" className="px-4 py-3">Depósito</th>
                <th scope="col" className="px-4 py-3">Código</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            }
          >
            {locations.map((l) => (
              <tr key={l.id} className={cn('transition-colors hover:bg-muted/40', !l.is_active && 'opacity-60')}>
                <td className="px-4 py-3">
                  <span className="font-medium">{l.name}</span>
                  {!l.is_active && <Pill tone="neutral" className="ml-2">Inactivo</Pill>}
                  {l.description && <span className="block truncate text-xs text-muted-foreground">{l.description}</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.location_code ?? '—'}</td>
                <td className="px-4 py-3">
                  <RowActions>
                    {can.updateLocation && (
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditingLocation(l)}>
                        <Pencil className="size-3.5" aria-hidden="true" />
                        <span className="sr-only sm:not-sr-only">Editar</span>
                      </Button>
                    )}
                    {can.deleteLocation && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setRemoving({ kind: 'location', item: l })} aria-label={`Eliminar ${l.name}`}>
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </RowActions>
                </td>
              </tr>
            ))}
          </ConfigTable>
        )}
      </section>

      <ConfigSheet open={editingMaterial !== null} onOpenChange={(open) => !open && setEditingMaterial(null)} title={editingMaterial === 'new' ? 'Nuevo material' : 'Editar material'}>
        {editingMaterial !== null && <MaterialForm material={editingMaterial === 'new' ? null : editingMaterial} onDone={() => setEditingMaterial(null)} />}
      </ConfigSheet>
      <ConfigSheet open={editingLocation !== null} onOpenChange={(open) => !open && setEditingLocation(null)} title={editingLocation === 'new' ? 'Nuevo depósito' : 'Editar depósito'}>
        {editingLocation !== null && <LocationForm location={editingLocation === 'new' ? null : editingLocation} onDone={() => setEditingLocation(null)} />}
      </ConfigSheet>
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`¿Eliminar ${removing?.item.name ?? ''}?`}
        description={removing?.kind === 'material' ? 'Solo se puede eliminar un material sin stock. Si ya no se usa, conviene desactivarlo.' : 'Solo se puede eliminar un depósito vacío.'}
        confirmLabel="Eliminar"
        onConfirm={() => (removing!.kind === 'material' ? deleteMaterialAction(removing!.item.id) : deleteLocationAction(removing!.item.id))}
      />
    </div>
  )
}

function ActiveSwitch({ id, defaultChecked, label }: { id: string; defaultChecked: boolean; label: string }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <Label htmlFor={id} className="flex flex-col items-start gap-0.5">
        <span>Activo</span>
        <span className="text-xs font-normal text-muted-foreground">{label}</span>
      </Label>
      <input id={id} type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="size-5 accent-primary" />
      <input type="hidden" name="is_active" value={on ? 'on' : 'off'} />
    </div>
  )
}

function MaterialForm({ material, onDone }: { material: Material | null; onDone: () => void }) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        execute(() => saveMaterialAction(material?.id ?? null, data), onDone)
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <Field id="mat-name" name="name" label="Nombre" placeholder="ej. Pelotas N.º 5" defaultValue={material?.name} maxLength={120} required autoFocus error={fieldErrors.name} />
        <Field id="mat-description" name="description" label="Descripción" placeholder="ej. Para entrenamiento de inferiores" defaultValue={material?.description ?? ''} maxLength={255} error={fieldErrors.description} />
        <div className="grid grid-cols-2 gap-4">
          <Field id="mat-unit" name="unit" label="Unidad" placeholder="unidades" defaultValue={material?.unit ?? 'unidades'} maxLength={30} required error={fieldErrors.unit} />
          <Field
            id="mat-min"
            name="minimum_stock"
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            label="Stock mínimo"
            hint="Debajo de esto avisa."
            defaultValue={material ? Number(material.minimum_stock) : 0}
            error={fieldErrors.minimum_stock}
          />
        </div>
        <ActiveSwitch id="mat-active" defaultChecked={material?.is_active ?? true} label="Los inactivos no aparecen en el stock." />
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{material ? 'Guardar cambios' : 'Crear material'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}

function LocationForm({ location, onDone }: { location: StorageLocation | null; onDone: () => void }) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        execute(() => saveLocationAction(location?.id ?? null, data), onDone)
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <Field id="loc-name" name="name" label="Nombre" placeholder="ej. Utilería principal" defaultValue={location?.name} maxLength={120} required autoFocus error={fieldErrors.name} />
        <Field id="loc-code" name="location_code" label="Código" placeholder="ej. UT-1" defaultValue={location?.location_code ?? ''} maxLength={30} error={fieldErrors.location_code} />
        <Field id="loc-description" name="description" label="Descripción" placeholder="ej. Debajo de la tribuna" defaultValue={location?.description ?? ''} maxLength={255} error={fieldErrors.description} />
        <ActiveSwitch id="loc-active" defaultChecked={location?.is_active ?? true} label="Los inactivos no se ofrecen para movimientos." />
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{location ? 'Guardar cambios' : 'Crear depósito'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}
