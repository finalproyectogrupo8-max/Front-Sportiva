'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { Copy, Eye, Loader2, Lock, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { PermissionGrid, type PermissionSelection } from '@/components/admin/permission-grid'
import {
  deleteRoleAction,
  duplicateRoleAction,
  saveRoleAction,
  type SaveRoleState,
} from '@/app/(app)/admin/clubes/[id]/role-actions'
import type { ClubRole, PermissionModule } from '@/lib/api/admin'

/** null: panel cerrado. "new": rol nuevo. Si no, el rol que se ve o edita. */
type Editing = null | 'new' | ClubRole

function selectionOf(role: ClubRole | null): PermissionSelection {
  const selection: PermissionSelection = {}
  for (const permission of role?.permissions ?? []) {
    selection[permission.name] = permission.scope === 'own' ? 'own' : 'all'
  }
  return selection
}

/** Roles del club: los estándar (solo lectura, se duplican) y los custom (se editan y borran). */
export function ClubRolesSection({
  tenantId,
  roles,
  modules,
  disabled,
}: {
  tenantId: number
  roles: ClubRole[]
  modules: PermissionModule[]
  /** El club no está activo: todavía no tiene roles. */
  disabled?: boolean
}) {
  const [editing, setEditing] = useState<Editing>(null)
  const [session, setSession] = useState(0)

  const open = (target: Exclude<Editing, null>) => {
    setSession((n) => n + 1)
    setEditing(target)
  }

  const current = editing === 'new' ? null : editing
  const readOnly = current?.is_system ?? false

  return (
    <section className="flex flex-col gap-4" aria-labelledby="roles-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-foreground" aria-hidden="true" />
            <h2 id="roles-title" className="text-lg font-semibold text-foreground">
              Roles del club
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Los estándar vienen con cada club y no se editan: duplicalos para armar uno propio.
          </p>
        </div>
        <Button type="button" onClick={() => open('new')} disabled={disabled} className="cursor-pointer gap-2">
          <Plus className="size-4" aria-hidden="true" />
          Nuevo rol
        </Button>
      </div>

      {roles.length === 0 ? (
        <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          El club todavía no tiene roles. Se crean cuando termina el alta.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul className="divide-y">
            {roles.map((role) => (
              <RoleRow key={role.slug} tenantId={tenantId} role={role} onOpen={() => open(role)} />
            ))}
          </ul>
        </div>
      )}

      <Sheet open={editing !== null} onOpenChange={(value) => !value && setEditing(null)}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto data-[side=right]:sm:max-w-2xl">
          <SheetHeader className="pr-12">
            <SheetTitle>
              {editing === 'new' ? 'Nuevo rol' : readOnly ? current?.name : `Editar ${current?.name}`}
            </SheetTitle>
            <SheetDescription>
              {readOnly
                ? 'Rol estándar: no se edita. Duplicalo para crear uno propio a partir de este.'
                : 'Elegí qué puede ver y hacer en cada módulo. En algunas acciones podés limitarlo a sus categorías.'}
            </SheetDescription>
          </SheetHeader>
          {editing !== null && (
            <RoleForm
              key={session}
              tenantId={tenantId}
              role={current}
              modules={modules}
              readOnly={readOnly}
              onDone={() => setEditing(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </section>
  )
}

function RoleRow({ tenantId, role, onOpen }: { tenantId: number; role: ClubRole; onOpen: () => void }) {
  const [pending, startTransition] = useTransition()
  const users = role.users_count ?? 0

  const duplicate = () =>
    startTransition(async () => {
      const res = await duplicateRoleAction(tenantId, role.slug)
      if (res.ok) toast.success(`Se creó "${res.name}". Editalo para ajustar sus permisos.`)
      else toast.error(res.error)
    })

  const remove = () => {
    if (!window.confirm(`¿Borrar el rol "${role.name}"?`)) return
    startTransition(async () => {
      const res = await deleteRoleAction(tenantId, role.slug)
      if (res.ok) toast.success(`Rol "${role.name}" borrado.`)
      else toast.error(res.error)
    })
  }

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">{role.name}</span>
          {role.is_system ? (
            <Badge variant="outline" className="gap-1 text-[11px] font-normal text-muted-foreground">
              <Lock className="size-3" aria-hidden="true" />
              Estándar
            </Badge>
          ) : (
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[11px] font-normal text-primary">
              Custom
            </Badge>
          )}
        </div>
        {role.description && <p className="text-xs text-muted-foreground">{role.description}</p>}
        <p className="text-[11px] text-muted-foreground">
          {role.permissions?.length ?? 0} permisos · {users} {users === 1 ? 'usuario' : 'usuarios'}
        </p>
      </div>

      <div className="flex shrink-0 gap-1.5">
        <Button type="button" variant="outline" size="sm" onClick={onOpen} className="h-7 cursor-pointer gap-1 px-2 text-xs">
          {role.is_system ? <Eye className="size-3" aria-hidden="true" /> : <Pencil className="size-3" aria-hidden="true" />}
          {role.is_system ? 'Ver' : 'Editar'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={duplicate}
          disabled={pending}
          className="h-7 cursor-pointer gap-1 px-2 text-xs"
        >
          {pending ? <Loader2 className="size-3 animate-spin" aria-hidden="true" /> : <Copy className="size-3" aria-hidden="true" />}
          Duplicar
        </Button>
        {!role.is_system && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={remove}
            disabled={pending}
            title={users > 0 ? 'Sacáselo a sus usuarios antes de borrarlo' : undefined}
            className="h-7 cursor-pointer gap-1 border-destructive/30 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3" aria-hidden="true" />
            Borrar
          </Button>
        )}
      </div>
    </li>
  )
}

function RoleForm({
  tenantId,
  role,
  modules,
  readOnly,
  onDone,
}: {
  tenantId: number
  role: ClubRole | null
  modules: PermissionModule[]
  readOnly: boolean
  onDone: () => void
}) {
  const [state, action, pending] = useActionState<SaveRoleState, FormData>(saveRoleAction, {})
  const [selection, setSelection] = useState<PermissionSelection>(() => selectionOf(role))
  const [duplicating, startDuplicate] = useTransition()

  useEffect(() => {
    if (!state.ok) return
    toast.success(role ? 'Rol actualizado.' : 'Rol creado. Ya lo podés asignar a los miembros.')
    onDone()
  }, [state.ok, state.timestamp]) // eslint-disable-line react-hooks/exhaustive-deps

  const permissions = Object.entries(selection).map(([name, scope]) => ({ name, scope }))

  const duplicate = () =>
    startDuplicate(async () => {
      if (!role) return
      const res = await duplicateRoleAction(tenantId, role.slug)
      if (res.ok) {
        toast.success(`Se creó "${res.name}". Editalo para ajustar sus permisos.`)
        onDone()
      } else {
        toast.error(res.error)
      }
    })

  return (
    <form action={action} className="flex flex-1 flex-col">
      <input type="hidden" name="tenant_id" value={tenantId} />
      <input type="hidden" name="slug" value={role?.slug ?? ''} />
      <input type="hidden" name="permissions" value={JSON.stringify(permissions)} />

      <div className="flex flex-col gap-4 px-4 pb-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role-name">Nombre</Label>
          <Input
            id="role-name"
            name="name"
            defaultValue={role?.name ?? ''}
            placeholder="Ej.: Profe con indumentaria"
            maxLength={80}
            disabled={readOnly || pending}
            aria-invalid={state.fieldErrors?.name ? true : undefined}
          />
          {state.fieldErrors?.name && <p className="text-xs text-destructive">{state.fieldErrors.name}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role-description">Descripción</Label>
          <Textarea
            id="role-description"
            name="description"
            defaultValue={role?.description ?? ''}
            placeholder="Para quién es este rol"
            maxLength={255}
            rows={2}
            disabled={readOnly || pending}
          />
          {state.fieldErrors?.description && (
            <p className="text-xs text-destructive">{state.fieldErrors.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm leading-none font-medium">Permisos</span>
            <span className="text-xs text-muted-foreground">{permissions.length} elegidos</span>
          </div>
          {state.fieldErrors?.permissions && (
            <p className="text-xs text-destructive">{state.fieldErrors.permissions}</p>
          )}
          <PermissionGrid modules={modules} value={selection} onChange={setSelection} readOnly={readOnly || pending} />
        </div>

        {state.error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {state.error}
          </p>
        )}
      </div>

      <SheetFooter className="sticky bottom-0 border-t bg-background">
        {readOnly ? (
          <Button type="button" onClick={duplicate} disabled={duplicating} className="w-full cursor-pointer gap-2">
            {duplicating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            Duplicar para editar
          </Button>
        ) : (
          <Button type="submit" disabled={pending} className="w-full cursor-pointer gap-2">
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {role ? 'Guardar cambios' : 'Crear rol'}
          </Button>
        )}
      </SheetFooter>
    </form>
  )
}
