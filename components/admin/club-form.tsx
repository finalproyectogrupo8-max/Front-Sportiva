'use client'

import { useActionState, useEffect, useState } from 'react'
import { Building2, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useWatchProvisioning } from '@/components/admin/provisioning-watcher'
import { Label } from '@/components/ui/label'
import { createTenantAction, type CreateTenantState } from '@/app/(app)/admin/clubes/actions'
import { formKey } from '@/lib/form-key'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita acentos
    .replace(/[^a-z0-9]+/g, '_') // Espacios y símbolos pasan a guion bajo: "Villa Real" → "villa_real"
    .replace(/^_+|_+$/g, '') // Quita guiones bajos iniciales y finales
    .slice(0, 50)
}

function ClubFormFields({
  state,
  action,
  pending,
}: {
  state: CreateTenantState
  action: (payload: FormData) => void
  pending: boolean
}) {
  const [name, setName] = useState(state.values?.name ?? '')
  const [slug, setSlug] = useState(state.values?.slug ?? '')
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(Boolean(state.values?.slug))

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)
    if (!isSlugManuallyEdited) {
      setSlug(slugify(newName))
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true)
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
  }

  const handleSuggestSlug = () => {
    setSlug(slugify(name))
    setIsSlugManuallyEdited(false)
  }

  return (
    <form action={action} className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 px-4 pb-4">
      {/* Nombre del Club */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="create-club-name">Nombre del club</Label>
        <Input
          id="create-club-name"
          name="name"
          type="text"
          autoComplete="off"
          placeholder="ej. Club Atlético River Plate"
          value={name}
          onChange={handleNameChange}
          aria-invalid={state.fieldErrors?.name ? true : undefined}
          aria-describedby={state.fieldErrors?.name ? 'name-error' : undefined}
          required
          autoFocus
          disabled={pending}
        />
        {state.fieldErrors?.name && (
          <p id="name-error" className="text-xs text-destructive">
            {state.fieldErrors.name}
          </p>
        )}
      </div>

      {/* Slug */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="create-club-slug">Identificador (slug)</Label>
          {name && isSlugManuallyEdited && (
            <button
              type="button"
              onClick={handleSuggestSlug}
              className="flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer"
              title="Auto-generar a partir del nombre"
            >
              <Sparkles className="size-3" aria-hidden="true" />
              Auto-generar
            </button>
          )}
        </div>
        <Input
          id="create-club-slug"
          name="slug"
          type="text"
          autoComplete="off"
          placeholder="ej. river_plate"
          value={slug}
          onChange={handleSlugChange}
          aria-invalid={state.fieldErrors?.slug ? true : undefined}
          aria-describedby={state.fieldErrors?.slug ? 'slug-error' : 'slug-help'}
          required
          disabled={pending}
          maxLength={50}
          className="font-mono text-xs"
        />
        {state.fieldErrors?.slug ? (
          <p id="slug-error" className="text-xs text-destructive">
            {state.fieldErrors.slug}
          </p>
        ) : (
          <div id="slug-help" className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            <p>
              Base de datos:{' '}
              <span className="font-mono text-foreground">
                {slug ? `club_${slug}` : 'club_<slug>'}
              </span>
            </p>
            <p>
              Ruta de acceso:{' '}
              <span className="font-mono text-foreground">{slug ? `/c/${slug}` : '/c/<slug>'}</span>
            </p>
          </div>
        )}
      </div>

      {/* Administrador del club: se crea y se asocia junto con el club */}
      <fieldset className="flex flex-col gap-4 border-t pt-4" disabled={pending}>
        <legend className="sr-only">Administrador del club</legend>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-foreground">Administrador del club</h3>
          <p className="text-xs text-muted-foreground">
            Le vamos a enviar una invitación por mail para que elija su contraseña.
          </p>
        </div>
        <AdminField
          id="create-club-admin-name"
          name="admin_name"
          label="Nombre completo"
          placeholder="ej. Martín Palermo"
          autoComplete="off"
          defaultValue={state.values?.admin_name}
          error={state.fieldErrors?.admin_name}
        />
        <AdminField
          id="create-club-admin-email"
          name="admin_email"
          type="email"
          label="Correo electrónico"
          placeholder="ej. admin@club.com"
          autoComplete="off"
          defaultValue={state.values?.admin_email}
          error={state.fieldErrors?.admin_email}
        />
      </fieldset>

      {/* Mensaje de error general */}
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.error}
        </p>
      )}

      </div>

      <SheetFooter className="border-t">
      <Button type="submit" className="w-full gap-2 cursor-pointer" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Guardando...
          </>
        ) : (
          <>
            <Building2 className="size-4" aria-hidden="true" />
            Crear club
          </>
        )}
      </Button>
      </SheetFooter>
    </form>
  )
}

function AdminField({
  id,
  label,
  error,
  ...input
}: React.ComponentProps<typeof Input> & { id: string; label: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...input}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Botón "Nuevo club": abre el alta en un panel lateral. Al guardar, el panel se cierra enseguida:
 * la base del club se crea en segundo plano y el vigilante avisa con un toast cuando está lista.
 */
export function NewClubSheet() {
  const [open, setOpen] = useState(false)
  // Cada apertura arranca un formulario vacío.
  const [session, setSession] = useState(0)

  const openNew = () => {
    setSession((n) => n + 1)
    setOpen(true)
  }

  return (
    <>
      <Button type="button" onClick={openNew} className="cursor-pointer gap-2">
        <Building2 className="size-4" aria-hidden="true" />
        Nuevo club
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto data-[side=right]:sm:max-w-md">
          {open && <NewClubFlow key={session} onCreated={() => setOpen(false)} />}
        </SheetContent>
      </Sheet>
    </>
  )
}

function NewClubFlow({ onCreated }: { onCreated: () => void }) {
  const [state, action, pending] = useActionState<CreateTenantState, FormData>(createTenantAction, {})
  const watchProvisioning = useWatchProvisioning()

  useEffect(() => {
    if (!state.ok || !state.tenant) return
    const tenant = state.tenant
    if (tenant.status === 'provisioning') {
      watchProvisioning({ id: tenant.id, name: tenant.name })
      toast.info(`Club "${tenant.name}" creado.`, {
        description: `Estamos aprovisionando su base de datos. Te avisamos cuando esté lista. Su administrador ya quedó asociado.`,
      })
    } else {
      toast.success(`Club "${tenant.name}" creado y activo.`, {
        description: 'Su administrador ya quedó asociado.',
      })
    }
    onCreated()
  }, [state.ok, state.tenant, state.timestamp]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <SheetHeader className="pr-12">
        <SheetTitle>Nuevo club</SheetTitle>
        <SheetDescription>
          Se crea con su propia base de datos, que se prepara en segundo plano: podés seguir usando el
          sistema mientras tanto.
        </SheetDescription>
      </SheetHeader>
      <ClubFormFields key={formKey(state)} state={state} action={action} pending={pending} />
    </>
  )
}
