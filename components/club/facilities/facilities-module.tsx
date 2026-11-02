'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Hammer, MapPin, Pencil, Plus, Trash2, UserCheck, Warehouse, Wrench, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  assignRepairAction,
  cancelRepairAction,
  deleteComponentAction,
  deleteFacilityAction,
  reportRepairAction,
  resolveRepairAction,
  saveComponentAction,
  saveFacilityAction,
  setComponentConditionAction,
} from '@/app/(app)/c/[club]/canchas/actions'
import { EmptyConfig } from '@/components/club/empty-state'
import { ConfigSheet, ConfigTable, ConfirmDialog, Field, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { FormSelect, ModuleHeader, PageBody, Pill, Segmented, Stat, type Tone } from '@/components/club/shared'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import type { ActionResult } from '@/lib/action-result'
import type { ClubUser, Facility, FacilityComponent, MaintenanceRecord, RepairRequest } from '@/lib/api/facilities'
import { cn } from '@/lib/utils'

type Can = {
  viewRepairs: boolean
  viewMaintenance: boolean
  createFacility: boolean
  updateFacility: boolean
  deleteFacility: boolean
  report: boolean
  assign: boolean
  resolve: boolean
}
type Tab = 'instalaciones' | 'reparaciones' | 'mantenimiento'

const TYPE: Record<string, string> = { court: 'Cancha', gym: 'Gimnasio', locker_room: 'Vestuario', other: 'Otro' }
const CONDITION: Record<string, { label: string; tone: Tone }> = {
  ok: { label: 'OK', tone: 'ok' },
  review: { label: 'Revisar', tone: 'warn' },
  out_of_service: { label: 'Fuera de servicio', tone: 'bad' },
}
const REPAIR_STATUS: Record<string, { label: string; tone: Tone }> = {
  open: { label: 'Sin asignar', tone: 'warn' },
  assigned: { label: 'Asignada', tone: 'info' },
  in_progress: { label: 'En curso', tone: 'info' },
  resolved: { label: 'Resuelta', tone: 'ok' },
  cancelled: { label: 'Cancelada', tone: 'neutral' },
}
const PRIORITY: Record<string, { label: string; tone: Tone }> = {
  low: { label: 'Baja', tone: 'neutral' },
  normal: { label: 'Normal', tone: 'neutral' },
  high: { label: 'Alta', tone: 'warn' },
  urgent: { label: 'Urgente', tone: 'bad' },
}
const OPEN_REPAIR = new Set(['open', 'assigned', 'in_progress'])
const DAY = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'America/Argentina/Buenos_Aires' })
const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

/** Canchas (FRO-19): instalaciones con el estado de sus elementos, reparaciones y mantenimiento. */
export function FacilitiesModule({
  facilities,
  repairs,
  maintenance,
  users,
  openRepairId,
  startReport,
  can,
}: {
  facilities: Facility[]
  repairs: RepairRequest[]
  maintenance: MaintenanceRecord[]
  users: ClubUser[]
  openRepairId: number | null
  startReport: boolean
  can: Can
}) {
  const [tab, setTab] = useState<Tab>(openRepairId && can.viewRepairs ? 'reparaciones' : 'instalaciones')
  const [repairFilter, setRepairFilter] = useState<'abiertas' | 'resueltas' | 'todas'>('abiertas')
  const [editingFacility, setEditingFacility] = useState<Facility | 'new' | null>(null)
  const [editingComponent, setEditingComponent] = useState<{ facility: Facility; component: FacilityComponent | null } | null>(null)
  const [reporting, setReporting] = useState<{ facilityId?: number; componentId?: number } | null>(startReport && can.report ? {} : null)
  const [selectedRepair, setSelectedRepair] = useState<number | null>(openRepairId)
  const [removing, setRemoving] = useState<{ kind: 'facility'; item: Facility } | { kind: 'component'; item: FacilityComponent } | null>(null)

  const userName = (id: number | null) => (id ? (users.find((u) => u.id === id)?.display_name ?? `#${id}`) : null)
  const openRepairs = repairs.filter((r) => OPEN_REPAIR.has(r.status))
  const components = facilities.flatMap((f) => f.components ?? [])
  const outOfService = components.filter((c) => c.condition_status === 'out_of_service').length
  const shownRepairs = repairs.filter((r) => (repairFilter === 'todas' ? true : repairFilter === 'abiertas' ? OPEN_REPAIR.has(r.status) : r.status === 'resolved'))
  const selected = repairs.find((r) => r.id === selectedRepair) ?? null

  return (
    <>
      <ModuleHeader
        eyebrow="Infraestructura"
        title="Canchas"
        description="Estado de cada instalación y sus elementos, reparaciones (reportar, asignar, resolver) e historial de mantenimiento."
        actions={
          <>
            {can.createFacility && (
              <Button variant="outline" className="gap-1.5" onClick={() => setEditingFacility('new')}>
                <Plus className="size-4" aria-hidden="true" />
                Nueva instalación
              </Button>
            )}
            {can.report && facilities.length > 0 && (
              <Button className="gap-1.5" onClick={() => setReporting({})}>
                <AlertTriangle className="size-4" aria-hidden="true" />
                Reportar problema
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
            { value: 'instalaciones' as Tab, label: 'Instalaciones', count: facilities.length },
            ...(can.viewRepairs ? [{ value: 'reparaciones' as Tab, label: 'Reparaciones', count: openRepairs.length }] : []),
            ...(can.viewMaintenance ? [{ value: 'mantenimiento' as Tab, label: 'Mantenimiento' }] : []),
          ]}
        />
      </ModuleHeader>

      <PageBody>
        {tab === 'instalaciones' && (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Instalaciones" value={facilities.length} />
              <Stat label="Fuera de servicio" value={<span className={facilities.some((f) => f.status === 'out_of_service') ? 'text-destructive' : ''}>{facilities.filter((f) => f.status === 'out_of_service').length}</span>} />
              <Stat label="Elementos sin usar" value={<span className={outOfService ? 'text-destructive' : ''}>{outOfService}</span>} />
              <Stat label="Reparaciones abiertas" value={openRepairs.length} />
            </div>
            {facilities.length === 0 ? (
              <EmptyConfig
                icon={Warehouse}
                title="Todavía no hay instalaciones"
                description="Cargá las canchas, el gimnasio y los vestuarios, con sus elementos (aros, redes, arcos, luces…)."
                action={can.createFacility && <Button onClick={() => setEditingFacility('new')}>Nueva instalación</Button>}
              />
            ) : (
              <ul className="grid gap-4 lg:grid-cols-2">
                {facilities.map((f) => (
                  <FacilityCard
                    key={f.id}
                    facility={f}
                    openRepairs={openRepairs.filter((r) => r.facility_id === f.id).length}
                    can={can}
                    onEdit={() => setEditingFacility(f)}
                    onDelete={() => setRemoving({ kind: 'facility', item: f })}
                    onAddComponent={() => setEditingComponent({ facility: f, component: null })}
                    onEditComponent={(c) => setEditingComponent({ facility: f, component: c })}
                    onDeleteComponent={(c) => setRemoving({ kind: 'component', item: c })}
                    onReport={(componentId) => setReporting({ facilityId: f.id, componentId })}
                  />
                ))}
              </ul>
            )}
          </>
        )}

        {tab === 'reparaciones' && (
          <>
            <Segmented
              label="Estado"
              value={repairFilter}
              onChange={setRepairFilter}
              options={[
                { value: 'abiertas', label: 'Abiertas', count: openRepairs.length },
                { value: 'resueltas', label: 'Resueltas', count: repairs.filter((r) => r.status === 'resolved').length },
                { value: 'todas', label: 'Todas', count: repairs.length },
              ]}
            />
            {shownRepairs.length === 0 ? (
              <EmptyConfig icon={Wrench} title={repairs.length === 0 ? 'Sin reparaciones' : 'No hay reparaciones con ese estado'} description="Cuando alguien reporta un problema aparece acá para asignarlo y resolverlo." />
            ) : (
              <ul className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
                {shownRepairs.map((r) => {
                  const status = REPAIR_STATUS[r.status] ?? { label: r.status, tone: 'neutral' as Tone }
                  return (
                    <li key={r.id}>
                      <button type="button" onClick={() => setSelectedRepair(r.id)} className="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-muted/50">
                        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', r.status === 'resolved' ? 'bg-success/10 text-success' : 'bg-warning/15 text-warning')}>
                          {r.status === 'resolved' ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <Wrench className="size-5" aria-hidden="true" />}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium">{r.title}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {r.facility?.name}
                            {r.component && ` · ${r.component.name}`} · {DAY.format(new Date(r.reported_at))}
                            {r.assigned_to && ` · ${userName(r.assigned_to)}`}
                          </span>
                        </span>
                        {(r.priority === 'high' || r.priority === 'urgent') && OPEN_REPAIR.has(r.status) && (
                          <Pill tone={PRIORITY[r.priority].tone} className="hidden sm:inline-flex">
                            {PRIORITY[r.priority].label}
                          </Pill>
                        )}
                        <Pill tone={status.tone}>{status.label}</Pill>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}

        {tab === 'mantenimiento' &&
          (maintenance.length === 0 ? (
            <EmptyConfig icon={Hammer} title="Sin mantenimiento registrado" description="Cada reparación resuelta queda acá, con lo que se hizo y lo que costó." />
          ) : (
            <ConfigTable
              caption="Historial de mantenimiento"
              head={
                <tr>
                  <th scope="col" className="px-4 py-3">Fecha</th>
                  <th scope="col" className="px-4 py-3">Instalación</th>
                  <th scope="col" className="px-4 py-3">Qué se hizo</th>
                  <th scope="col" className="hidden px-4 py-3 md:table-cell">Quién</th>
                  <th scope="col" className="px-4 py-3 text-right">Costo</th>
                </tr>
              }
            >
              {maintenance.map((m) => (
                <tr key={m.id} className="align-top transition-colors hover:bg-muted/40">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{DAY.format(new Date(m.performed_at))}</td>
                  <td className="px-4 py-3 font-medium">{m.facility?.name ?? `#${m.facility_id}`}</td>
                  <td className="px-4 py-3">
                    {m.repair_request && <span className="block text-xs text-muted-foreground">{m.repair_request.title}</span>}
                    {m.description}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{userName(m.performed_by) ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{m.cost != null ? money.format(Number(m.cost)) : '—'}</td>
                </tr>
              ))}
            </ConfigTable>
          ))}
      </PageBody>

      <ConfigSheet open={editingFacility !== null} onOpenChange={(open) => !open && setEditingFacility(null)} title={editingFacility === 'new' ? 'Nueva instalación' : 'Editar instalación'}>
        {editingFacility !== null && <FacilityForm facility={editingFacility === 'new' ? null : editingFacility} onDone={() => setEditingFacility(null)} />}
      </ConfigSheet>
      <ConfigSheet open={editingComponent !== null} onOpenChange={(open) => !open && setEditingComponent(null)} title={editingComponent?.component ? 'Editar elemento' : `Nuevo elemento${editingComponent ? ` · ${editingComponent.facility.name}` : ''}`}>
        {editingComponent && <ComponentForm facilityId={editingComponent.facility.id} component={editingComponent.component} onDone={() => setEditingComponent(null)} />}
      </ConfigSheet>
      <ConfigSheet open={reporting !== null} onOpenChange={(open) => !open && setReporting(null)} title="Reportar un problema" description="Le llega a quien maneja el mantenimiento para asignarlo.">
        {reporting && <ReportForm facilities={facilities} initial={reporting} onDone={() => setReporting(null)} />}
      </ConfigSheet>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelectedRepair(null)}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
          {selected && <RepairDetail key={selected.id + selected.status} repair={selected} users={users} userName={userName} can={can} onClose={() => setSelectedRepair(null)} />}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`¿Eliminar ${removing?.item.name ?? ''}?`}
        description={removing?.kind === 'facility' ? 'Se borra la instalación con sus elementos.' : 'Se borra el elemento de la instalación.'}
        confirmLabel="Eliminar"
        onConfirm={() => (removing!.kind === 'facility' ? deleteFacilityAction(removing!.item.id) : deleteComponentAction(removing!.item.id))}
      />
    </>
  )
}

function FacilityCard({
  facility: f,
  openRepairs,
  can,
  onEdit,
  onDelete,
  onAddComponent,
  onEditComponent,
  onDeleteComponent,
  onReport,
}: {
  facility: Facility
  openRepairs: number
  can: Can
  onEdit: () => void
  onDelete: () => void
  onAddComponent: () => void
  onEditComponent: (c: FacilityComponent) => void
  onDeleteComponent: (c: FacilityComponent) => void
  onReport: (componentId?: number) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const items = f.components ?? []
  const setCondition = (c: FacilityComponent, condition: string) =>
    startTransition(async () => {
      const result: ActionResult = await setComponentConditionAction(c.id, condition).catch(() => ({ ok: false, error: 'No se pudo guardar.' }))
      if (result.ok) {
        toast.success(`${c.name}: ${CONDITION[condition].label}`)
        router.refresh()
      } else toast.error(result.error ?? 'No se pudo guardar.')
    })

  return (
    <li className={cn('flex flex-col overflow-hidden rounded-xl border bg-card', f.status === 'out_of_service' && 'border-destructive/40')}>
      <div className="flex items-start gap-3 border-b p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{f.name}</h2>
            <Pill tone="neutral">{TYPE[f.type] ?? f.type}</Pill>
            {f.status === 'out_of_service' && <Pill tone="bad">Fuera de servicio</Pill>}
            {openRepairs > 0 && <Pill tone="warn">{openRepairs === 1 ? '1 reparación' : `${openRepairs} reparaciones`}</Pill>}
          </div>
          {f.location && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" aria-hidden="true" />
              {f.location}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {can.updateFacility && (
            <Button variant="ghost" size="icon" className="size-8" onClick={onEdit} aria-label={`Editar ${f.name}`}>
              <Pencil className="size-3.5" aria-hidden="true" />
            </Button>
          )}
          {can.deleteFacility && (
            <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={onDelete} aria-label={`Eliminar ${f.name}`}>
              <Trash2 className="size-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">Sin elementos cargados.</p>
      ) : (
        <ul className="flex flex-col divide-y">
          {items.map((c) => {
            const condition = CONDITION[c.condition_status] ?? { label: c.condition_status, tone: 'neutral' as Tone }
            return (
              <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{c.name}</span>
                  {c.last_inspected_at && <span className="text-xs text-muted-foreground">Revisado el {DAY.format(new Date(c.last_inspected_at))}</span>}
                </span>
                {can.updateFacility ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<button type="button" disabled={pending} className="rounded-full" />} aria-label={`Estado de ${c.name}: ${condition.label}. Cambiar`}>
                      <Pill tone={condition.tone}>{condition.label}</Pill>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {Object.entries(CONDITION).map(([value, o]) => (
                        <DropdownMenuItem key={value} onClick={() => setCondition(c, value)}>
                          {o.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem onClick={() => onEditComponent(c)}>Editar…</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDeleteComponent(c)} className="text-destructive">
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Pill tone={condition.tone}>{condition.label}</Pill>
                )}
                {can.report && c.condition_status !== 'ok' && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onReport(c.id)}>
                    Reportar
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {(can.updateFacility || can.report) && (
        <div className="mt-auto flex gap-2 border-t p-3">
          {can.updateFacility && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={onAddComponent}>
              <Plus className="size-3.5" aria-hidden="true" />
              Agregar elemento
            </Button>
          )}
          {can.report && (
            <Button variant="ghost" size="sm" className="ml-auto gap-1.5" onClick={() => onReport()}>
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              Reportar problema
            </Button>
          )}
        </div>
      )}
    </li>
  )
}

function RepairDetail({
  repair: r,
  users,
  userName,
  can,
  onClose,
}: {
  repair: RepairRequest
  users: ClubUser[]
  userName: (id: number | null) => string | null
  can: Can
  onClose: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [assignee, setAssignee] = useState(r.assigned_to ? String(r.assigned_to) : '')
  const [resolving, setResolving] = useState(false)
  const { pending: saving, fieldErrors, error, execute } = useConfigAction()
  const status = REPAIR_STATUS[r.status] ?? { label: r.status, tone: 'neutral' as Tone }
  const open = OPEN_REPAIR.has(r.status)

  const run = (action: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const result: ActionResult = await action().catch(() => ({ ok: false, error: 'No se pudo guardar.' }))
      if (result.ok) {
        toast.success(result.message)
        router.refresh()
      } else toast.error(result.error ?? Object.values(result.fieldErrors ?? {})[0] ?? 'No se pudo guardar.')
    })

  return (
    <>
      <SheetHeader className="gap-1 border-b p-6 pr-12">
        <SheetDescription className="text-xs font-medium uppercase tracking-widest text-primary">
          Reparación · {r.facility?.name}
          {r.component && ` · ${r.component.name}`}
        </SheetDescription>
        <SheetTitle className="font-display text-2xl font-bold uppercase leading-none">{r.title}</SheetTitle>
        <div className="mt-2 flex flex-wrap gap-2">
          <Pill tone={status.tone}>{status.label}</Pill>
          {PRIORITY[r.priority] && <Pill tone={PRIORITY[r.priority].tone}>Prioridad {PRIORITY[r.priority].label.toLowerCase()}</Pill>}
        </div>
      </SheetHeader>
      <div className="flex flex-col gap-5 p-6">
        <p className="whitespace-pre-line text-sm">{r.description}</p>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Reportó</dt>
            <dd className="font-medium">{userName(r.reported_by) ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Fecha</dt>
            <dd className="font-medium">{DAY.format(new Date(r.reported_at))}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Asignada a</dt>
            <dd className="font-medium">{userName(r.assigned_to) ?? 'Nadie todavía'}</dd>
          </div>
          {r.resolved_at && (
            <div>
              <dt className="text-xs text-muted-foreground">Resuelta</dt>
              <dd className="font-medium">{DAY.format(new Date(r.resolved_at))}</dd>
            </div>
          )}
        </dl>
        {r.maintenance_record && (
          <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-sm">
            <p className="font-medium">Qué se hizo</p>
            <p className="text-muted-foreground">{r.maintenance_record.description}</p>
            {r.maintenance_record.cost != null && <p className="mt-1 tabular-nums">{money.format(Number(r.maintenance_record.cost))}</p>}
          </div>
        )}

        {open && can.assign && (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FormSelect id="repair-assignee" label="Asignar a" value={assignee} onChange={setAssignee} options={users.map((u) => ({ value: String(u.id), label: u.display_name }))} placeholder="Elegí a alguien del club" />
            </div>
            <Button className="gap-1.5" disabled={pending || !assignee || assignee === String(r.assigned_to)} onClick={() => run(() => assignRepairAction(r.id, Number(assignee)))}>
              <UserCheck className="size-4" aria-hidden="true" />
              Asignar
            </Button>
          </div>
        )}

        {resolving && (
          <form
            className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4"
            onSubmit={(e) => {
              e.preventDefault()
              const data = new FormData(e.currentTarget)
              execute(() => resolveRepairAction(r.id, data), () => router.refresh())
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="resolve-description">Qué se hizo</Label>
              <Textarea id="resolve-description" name="description" required autoFocus placeholder="ej. Se cambió la red del arco norte." />
              {fieldErrors.description && <p className="text-xs text-destructive">{fieldErrors.description}</p>}
            </div>
            <Field id="resolve-cost" name="cost" type="number" inputMode="decimal" min={0} step="any" label="Costo (opcional)" placeholder="$" error={fieldErrors.cost} />
            <FormError message={error} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setResolving(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                Marcar resuelta
              </Button>
            </div>
          </form>
        )}
      </div>
      {open && can.resolve && !resolving && (
        <SheetFooter className="mt-auto flex-row gap-2 border-t">
          <Button variant="ghost" className="gap-1.5 text-muted-foreground" disabled={pending} onClick={() => run(() => cancelRepairAction(r.id))}>
            <X className="size-4" aria-hidden="true" />
            Cancelar reparación
          </Button>
          <Button className="ml-auto gap-1.5" disabled={pending || !r.assigned_to} title={!r.assigned_to ? 'Primero asignala' : undefined} onClick={() => setResolving(true)}>
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Resolver
          </Button>
        </SheetFooter>
      )}
      {!open && (
        <SheetFooter className="mt-auto border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </SheetFooter>
      )}
    </>
  )
}

function FacilityForm({ facility, onDone }: { facility: Facility | null; onDone: () => void }) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [type, setType] = useState(facility?.type ?? 'court')
  const [status, setStatus] = useState(facility?.status ?? 'active')
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('type', type)
        data.set('status', status)
        execute(() => saveFacilityAction(facility?.id ?? null, data), onDone)
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <Field id="fac-name" name="name" label="Nombre" placeholder="ej. Cancha 1" defaultValue={facility?.name} maxLength={120} required autoFocus error={fieldErrors.name} />
        <div className="grid grid-cols-2 gap-4">
          <FormSelect id="fac-type" label="Tipo" value={type} onChange={setType} options={Object.entries(TYPE).map(([value, label]) => ({ value, label }))} />
          <FormSelect id="fac-status" label="Estado" value={status} onChange={setStatus} options={[{ value: 'active', label: 'En uso' }, { value: 'out_of_service', label: 'Fuera de servicio' }]} />
        </div>
        <Field id="fac-location" name="location" label="Ubicación" placeholder="ej. Sede principal, al fondo" defaultValue={facility?.location ?? ''} maxLength={200} error={fieldErrors.location} />
        <Field id="fac-notes" name="notes" label="Notas" defaultValue={facility?.notes ?? ''} error={fieldErrors.notes} />
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{facility ? 'Guardar cambios' : 'Crear instalación'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}

function ComponentForm({ facilityId, component, onDone }: { facilityId: number; component: FacilityComponent | null; onDone: () => void }) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [condition, setCondition] = useState(component?.condition_status ?? 'ok')
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('condition_status', condition)
        execute(() => saveComponentAction(facilityId, component?.id ?? null, data), onDone)
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <Field id="comp-name" name="name" label="Elemento" placeholder="ej. Aro norte, red, luminaria 3" defaultValue={component?.name} maxLength={100} required autoFocus error={fieldErrors.name} />
        <FormSelect id="comp-condition" label="Estado" value={condition} onChange={setCondition} options={Object.entries(CONDITION).map(([value, o]) => ({ value, label: o.label }))} />
        <Field id="comp-notes" name="notes" label="Notas" defaultValue={component?.notes ?? ''} error={fieldErrors.notes} />
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>{component ? 'Guardar cambios' : 'Agregar elemento'}</SubmitButton>
      </SheetFooter>
    </form>
  )
}

function ReportForm({ facilities, initial, onDone }: { facilities: Facility[]; initial: { facilityId?: number; componentId?: number }; onDone: () => void }) {
  const { pending, fieldErrors, error, execute } = useConfigAction()
  const [facilityId, setFacilityId] = useState(String(initial.facilityId ?? facilities[0]?.id ?? ''))
  const [componentId, setComponentId] = useState(initial.componentId ? String(initial.componentId) : '')
  const [priority, setPriority] = useState('normal')
  const [condition, setCondition] = useState('review')
  const facility = facilities.find((f) => String(f.id) === facilityId)
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        data.set('facility_id', facilityId)
        data.set('component_id', componentId)
        data.set('priority', priority)
        data.set('component_condition_status', condition)
        execute(() => reportRepairAction(data), onDone)
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-4 px-4 pb-4">
        <FormSelect
          id="rep-facility"
          label="Instalación"
          value={facilityId}
          onChange={(v) => {
            setFacilityId(v)
            setComponentId('')
          }}
          options={facilities.map((f) => ({ value: String(f.id), label: f.name }))}
        />
        {(facility?.components?.length ?? 0) > 0 && (
          <FormSelect id="rep-component" label="Elemento (opcional)" value={componentId} onChange={setComponentId} options={[{ value: '', label: 'Toda la instalación' }, ...(facility?.components ?? []).map((c) => ({ value: String(c.id), label: c.name }))]} />
        )}
        {componentId && (
          <FormSelect id="rep-condition" label="¿Se puede usar?" value={condition} onChange={setCondition} options={[{ value: 'review', label: 'Sí, pero hay que revisarlo' }, { value: 'out_of_service', label: 'No: queda fuera de servicio' }]} />
        )}
        <Field id="rep-title" name="title" label="Qué pasa" placeholder="ej. Red del arco norte cortada" maxLength={150} required autoFocus error={fieldErrors.title} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rep-description">Detalle</Label>
          <Textarea id="rep-description" name="description" required placeholder="Contá dónde está y desde cuándo." />
          {fieldErrors.description && <p className="text-xs text-destructive">{fieldErrors.description}</p>}
        </div>
        <FormSelect id="rep-priority" label="Prioridad" value={priority} onChange={setPriority} options={Object.entries(PRIORITY).map(([value, p]) => ({ value, label: p.label }))} />
        <FormError message={error} />
      </fieldset>
      <SheetFooter className="mt-auto border-t">
        <SubmitButton pending={pending}>Reportar</SubmitButton>
      </SheetFooter>
    </form>
  )
}
