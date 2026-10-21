'use client'

import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react'
import { Loader2, Plus, Trash2, UserPlus } from 'lucide-react'
import { addMembershipAction, createTenantAction, createUserAction, removeMembershipAction } from '@/app/admin/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MEMBERSHIP_STATUS_LABELS, TENANT_STATUS_LABELS } from '@/lib/admin-labels'
import {
  INITIAL_ADMIN_ACTION_STATE,
  type AdminActionState,
  type AdminFieldErrors,
  type AdminMembership,
  type AdminTenant,
  type AdminUser,
} from '@/lib/admin-types'
import {
  validateMembershipFields,
  validateTenantFields,
  validateUserFields,
} from '@/lib/admin-validation'

interface AdminConsoleProps {
  users: AdminUser[]
  tenants: AdminTenant[]
  memberships: AdminMembership[]
}

function getFieldErrors(
  stateErrors: AdminFieldErrors | undefined,
  clientErrors: AdminFieldErrors,
  field: string,
): string[] {
  return clientErrors[field] ?? stateErrors?.[field] ?? []
}

function FieldMessages({ id, errors }: { id: string; errors: string[] }) {
  if (errors.length === 0) return null

  return (
    <ul id={id} className="flex flex-col gap-1 text-sm text-destructive">
      {errors.map((error) => <li key={error}>{error}</li>)}
    </ul>
  )
}

function FormFeedback({
  state,
  clientMessage,
}: {
  state: AdminActionState
  clientMessage?: string
}) {
  const message = clientMessage ?? state.message
  if (!message) return null

  const isError = Boolean(clientMessage) || !state.ok
  return (
    <p
      role="alert"
      className={
        isError
          ? 'rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive'
          : 'rounded-lg bg-success/10 px-3 py-2 text-sm text-success'
      }
    >
      {message}
    </p>
  )
}

function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <Button type="submit" className="h-10 gap-2" disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
      {children}
    </Button>
  )
}

function UsersPanel({ users }: { users: AdminUser[] }) {
  const [state, action, pending] = useActionState(createUserAction, INITIAL_ADMIN_ACTION_STATE)
  const [clientErrors, setClientErrors] = useState<AdminFieldErrors>({})
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset()
    }
  }, [state])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget)
    const errors = validateUserFields({
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
    })
    setClientErrors(errors)
    if (Object.keys(errors).length > 0) event.preventDefault()
  }

  const nameErrors = getFieldErrors(state.errors, clientErrors, 'name')
  const emailErrors = getFieldErrors(state.errors, clientErrors, 'email')
  const passwordErrors = getFieldErrors(state.errors, clientErrors, 'password')

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(17rem,0.75fr)_minmax(0,1.25fr)]">
      <section aria-labelledby="users-form-title" className="flex flex-col gap-4 rounded-xl border bg-card p-5">
        <div>
          <h2 id="users-form-title" className="font-display text-2xl font-bold uppercase">Crear usuario</h2>
          <p className="text-sm text-muted-foreground">El usuario va a poder asociarse a uno o más clubes.</p>
        </div>
        <form ref={formRef} action={action} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-name">Nombre</Label>
            <Input
              id="user-name"
              name="name"
              autoComplete="name"
              required
              aria-invalid={nameErrors.length > 0}
              aria-describedby={nameErrors.length ? 'user-name-error' : undefined}
              className="h-11"
            />
            <FieldMessages id="user-name-error" errors={nameErrors} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={emailErrors.length > 0}
              aria-describedby={emailErrors.length ? 'user-email-error' : undefined}
              className="h-11"
            />
            <FieldMessages id="user-email-error" errors={emailErrors} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="user-password">Contraseña</Label>
            <Input
              id="user-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              aria-invalid={passwordErrors.length > 0}
              aria-describedby={passwordErrors.length ? 'user-password-error' : undefined}
              className="h-11"
            />
            <FieldMessages id="user-password-error" errors={passwordErrors} />
          </div>
          <FormFeedback
            state={state}
            clientMessage={Object.keys(clientErrors).length ? 'Revisá los campos marcados antes de continuar.' : undefined}
          />
          <SubmitButton pending={pending}>Crear usuario</SubmitButton>
        </form>
      </section>

      <section aria-labelledby="users-table-title" className="flex min-w-0 flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="users-table-title" className="font-display text-2xl font-bold uppercase">Usuarios</h2>
            <p className="text-sm text-muted-foreground">{users.length} en la plataforma</p>
          </div>
        </div>
        <div className="max-w-full overflow-x-auto rounded-xl border bg-card">
          <table className="w-full table-fixed text-sm">
            <caption className="sr-only">Usuarios de la plataforma</caption>
            <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-2 py-2.5 font-medium sm:px-4">Nombre</th>
                <th scope="col" className="px-2 py-2.5 font-medium sm:px-4">Email</th>
                <th scope="col" className="px-2 py-2.5 font-medium sm:px-4">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-2 py-3 font-medium sm:px-4">{user.name}</td>
                  <td className="break-all px-2 py-3 text-muted-foreground sm:px-4">{user.email}</td>
                  <td className="px-2 py-3 sm:px-4">
                    {user.is_platform_admin ? <Badge variant="secondary">Admin</Badge> : <span className="text-muted-foreground">Usuario</span>}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Todavía no hay usuarios.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function TenantsPanel({ users, tenants }: { users: AdminUser[]; tenants: AdminTenant[] }) {
  const [state, action, pending] = useActionState(createTenantAction, INITIAL_ADMIN_ACTION_STATE)
  const [clientErrors, setClientErrors] = useState<AdminFieldErrors>({})
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset()
    }
  }, [state])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget)
    const errors = validateTenantFields({
      name: String(formData.get('name') ?? ''),
      slug: String(formData.get('slug') ?? ''),
    })
    setClientErrors(errors)
    if (Object.keys(errors).length > 0) event.preventDefault()
  }

  const nameErrors = getFieldErrors(state.errors, clientErrors, 'name')
  const slugErrors = getFieldErrors(state.errors, clientErrors, 'slug')
  const adminErrors = getFieldErrors(state.errors, clientErrors, 'admin_user_id')

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(17rem,0.75fr)_minmax(0,1.25fr)]">
      <section aria-labelledby="tenants-form-title" className="flex flex-col gap-4 rounded-xl border bg-card p-5">
        <div>
          <h2 id="tenants-form-title" className="font-display text-2xl font-bold uppercase">Crear club</h2>
          <p className="text-sm text-muted-foreground">El slug define el identificador seguro de su base de datos.</p>
        </div>
        <form ref={formRef} action={action} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tenant-name">Nombre</Label>
            <Input
              id="tenant-name"
              name="name"
              required
              aria-invalid={nameErrors.length > 0}
              aria-describedby={nameErrors.length ? 'tenant-name-error' : undefined}
              className="h-11"
            />
            <FieldMessages id="tenant-name-error" errors={nameErrors} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tenant-slug">Slug</Label>
            <Input
              id="tenant-slug"
              name="slug"
              required
              pattern="[a-z0-9_]+"
              maxLength={40}
              autoCapitalize="none"
              autoComplete="off"
              aria-invalid={slugErrors.length > 0}
              aria-describedby={slugErrors.length ? 'tenant-slug-error' : undefined}
              className="h-11 font-mono"
            />
            <FieldMessages id="tenant-slug-error" errors={slugErrors} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tenant-admin">Administrador del club <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            <select
              id="tenant-admin"
              name="admin_user_id"
              defaultValue=""
              aria-invalid={adminErrors.length > 0}
              aria-describedby={adminErrors.length ? 'tenant-admin-error' : undefined}
              className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
            >
              <option value="">Sin administrador por ahora</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}
            </select>
            <FieldMessages id="tenant-admin-error" errors={adminErrors} />
          </div>
          <FormFeedback
            state={state}
            clientMessage={Object.keys(clientErrors).length ? 'Revisá los campos marcados antes de continuar.' : undefined}
          />
          <SubmitButton pending={pending}>Crear club</SubmitButton>
        </form>
      </section>

      <section aria-labelledby="tenants-table-title" className="flex min-w-0 flex-col gap-3">
        <div>
          <h2 id="tenants-table-title" className="font-display text-2xl font-bold uppercase">Clubes</h2>
          <p className="text-sm text-muted-foreground">{tenants.length} en la plataforma</p>
        </div>
        <div className="max-w-full overflow-x-auto rounded-xl border bg-card">
          <table className="w-full table-fixed text-sm">
            <caption className="sr-only">Clubes de la plataforma</caption>
            <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-2 py-2.5 font-medium sm:px-4">Nombre</th>
                <th scope="col" className="px-2 py-2.5 font-medium sm:px-4">Slug</th>
                <th scope="col" className="px-2 py-2.5 font-medium sm:px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="px-2 py-3 font-medium sm:px-4">{tenant.name}</td>
                  <td className="break-all px-2 py-3 font-mono text-xs sm:px-4">{tenant.slug}</td>
                  <td className="px-2 py-3 sm:px-4">
                    <Badge variant={tenant.status === 'failed' ? 'destructive' : 'secondary'}>
                      {TENANT_STATUS_LABELS[tenant.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Todavía no hay clubes.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function MembershipsPanel({
  users,
  tenants,
  memberships,
}: {
  users: AdminUser[]
  tenants: AdminTenant[]
  memberships: AdminMembership[]
}) {
  const [state, action, pending] = useActionState(addMembershipAction, INITIAL_ADMIN_ACTION_STATE)
  const [clientErrors, setClientErrors] = useState<AdminFieldErrors>({})
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset()
    }
  }, [state])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget)
    const errors = validateMembershipFields({
      user_id: String(formData.get('user_id') ?? ''),
      tenant_slug: String(formData.get('tenant_slug') ?? ''),
    })
    setClientErrors(errors)
    if (Object.keys(errors).length > 0) event.preventDefault()
  }

  function confirmRemoval(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm('¿Querés quitar esta asociación?')) event.preventDefault()
  }

  const userErrors = getFieldErrors(state.errors, clientErrors, 'user_id')
  const tenantErrors = getFieldErrors(state.errors, clientErrors, 'tenant_slug')

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(17rem,0.75fr)_minmax(0,1.25fr)]">
      <section aria-labelledby="memberships-form-title" className="flex flex-col gap-4 rounded-xl border bg-card p-5">
        <div>
          <h2 id="memberships-form-title" className="font-display text-2xl font-bold uppercase">Asociar usuario</h2>
          <p className="text-sm text-muted-foreground">Una persona puede tener acceso a varios clubes.</p>
        </div>
        <form ref={formRef} action={action} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="membership-user">Usuario</Label>
            <select
              id="membership-user"
              name="user_id"
              defaultValue=""
              required
              aria-invalid={userErrors.length > 0}
              aria-describedby={userErrors.length ? 'membership-user-error' : undefined}
              className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
            >
              <option value="">Elegí un usuario</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.email}</option>)}
            </select>
            <FieldMessages id="membership-user-error" errors={userErrors} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="membership-tenant">Club</Label>
            <select
              id="membership-tenant"
              name="tenant_slug"
              defaultValue=""
              required
              aria-invalid={tenantErrors.length > 0}
              aria-describedby={tenantErrors.length ? 'membership-tenant-error' : undefined}
              className="h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
            >
              <option value="">Elegí un club</option>
              {tenants.map((tenant) => <option key={tenant.id} value={tenant.slug}>{tenant.name}</option>)}
            </select>
            <FieldMessages id="membership-tenant-error" errors={tenantErrors} />
          </div>
          <FormFeedback
            state={state}
            clientMessage={Object.keys(clientErrors).length ? 'Revisá los campos marcados antes de continuar.' : undefined}
          />
          <Button type="submit" className="h-10 gap-2" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <UserPlus className="size-4" aria-hidden="true" />}
            Asociar a club
          </Button>
        </form>
      </section>

      <section aria-labelledby="memberships-table-title" className="flex min-w-0 flex-col gap-3">
        <div>
          <h2 id="memberships-table-title" className="font-display text-2xl font-bold uppercase">Asociaciones</h2>
          <p className="text-sm text-muted-foreground">{memberships.length} en total</p>
        </div>
        <div className="max-w-full overflow-x-auto rounded-xl border bg-card">
          <table className="w-full table-fixed text-sm">
            <caption className="sr-only">Asociaciones de usuarios con clubes</caption>
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[28%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-1 py-2.5 font-medium sm:px-3">Usuario</th>
                <th scope="col" className="px-1 py-2.5 font-medium sm:px-3">Email</th>
                <th scope="col" className="px-1 py-2.5 font-medium sm:px-3">Club</th>
                <th scope="col" className="px-1 py-2.5 font-medium sm:px-3">Estado</th>
                <th scope="col" className="px-1 py-2.5 sm:px-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {memberships.map((membership) => (
                <tr key={membership.id}>
                  <td className="break-all px-1 py-3 font-medium sm:px-3">{membership.user.name}</td>
                  <td className="break-all px-1 py-3 text-muted-foreground sm:px-3">{membership.user.email}</td>
                  <td className="break-all px-1 py-3 sm:px-3">{membership.tenant.name}</td>
                  <td className="px-1 py-3 sm:px-3">
                    <Badge variant={membership.status === 'active' ? 'secondary' : 'outline'}>
                      {MEMBERSHIP_STATUS_LABELS[membership.status]}
                    </Badge>
                  </td>
                  <td className="px-1 py-3 sm:px-3">
                    <form action={removeMembershipAction} onSubmit={confirmRemoval}>
                      <input type="hidden" name="membership_id" value={membership.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Quitar asociación de ${membership.user.name} con ${membership.tenant.name}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {memberships.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Todavía no hay asociaciones.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export function AdminConsole({ users, tenants, memberships }: AdminConsoleProps) {
  return (
    <Tabs defaultValue="users" className="w-full min-w-0">
      <TabsList className="grid h-auto w-full grid-cols-3 p-1">
        <TabsTrigger value="users" className="min-h-9">Usuarios</TabsTrigger>
        <TabsTrigger value="tenants" className="min-h-9">Clubes</TabsTrigger>
        <TabsTrigger value="memberships" className="min-h-9">Asociaciones</TabsTrigger>
      </TabsList>
      <TabsContent value="users" className="mt-5 min-w-0 inert:hidden">
        <UsersPanel users={users} />
      </TabsContent>
      <TabsContent value="tenants" className="mt-5 min-w-0 inert:hidden">
        <TenantsPanel users={users} tenants={tenants} />
      </TabsContent>
      <TabsContent value="memberships" className="mt-5 min-w-0 inert:hidden">
        <MembershipsPanel users={users} tenants={tenants} memberships={memberships} />
      </TabsContent>
    </Tabs>
  )
}
