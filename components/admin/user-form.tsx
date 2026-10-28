'use client'

import { useActionState, useState } from 'react'
import { CheckCircle2, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { createUserAction, type CreateUserState } from '@/app/admin/usuarios/actions'
import { formKey } from '@/lib/form-key'
import { UserClubsTable } from '@/components/admin/user-clubs-table'

/** Botón "Nuevo usuario": abre el alta en un panel lateral y, al crearlo, ofrece asociarlo a clubes. */
export function NewUserSheet() {
  const [open, setOpen] = useState(false)
  // Cada apertura (o "Crear otro") arranca un formulario vacío.
  const [session, setSession] = useState(0)

  const openNew = () => {
    setSession((n) => n + 1)
    setOpen(true)
  }

  return (
    <>
      <Button type="button" onClick={openNew} className="cursor-pointer gap-2">
        <UserPlus className="size-4" aria-hidden="true" />
        Nuevo usuario
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto data-[side=right]:sm:max-w-md">
          {open && <NewUserFlow key={session} onAnother={openNew} onClose={() => setOpen(false)} />}
        </SheetContent>
      </Sheet>
    </>
  )
}

function NewUserFlow({ onAnother, onClose }: { onAnother: () => void; onClose: () => void }) {
  const [state, action, pending] = useActionState<CreateUserState, FormData>(createUserAction, {})

  // El panel mismo confirma el alta (sin toast: taparía los botones del panel).
  // Paso 2: el usuario ya existe, se puede asociar a clubes desde acá.
  if (state.ok && state.user) {
    const user = state.user
    return (
      <>
        <SheetHeader className="pr-12">
          <SheetTitle>Usuario creado</SheetTitle>
          <SheetDescription>Podés asociarlo a uno o más clubes ahora, o hacerlo más tarde.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3">
            <CheckCircle2 className="size-5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-foreground">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">Asociar a clubes</h3>
            <UserClubsTable user={user} />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end border-t">
          <Button type="button" variant="outline" onClick={onAnother} className="cursor-pointer gap-2">
            <UserPlus className="size-4" aria-hidden="true" />
            Crear otro
          </Button>
          <Button type="button" onClick={onClose} className="cursor-pointer">
            Listo
          </Button>
        </SheetFooter>
      </>
    )
  }

  return (
    <>
      <SheetHeader className="pr-12">
        <SheetTitle>Nuevo usuario</SheetTitle>
        <SheetDescription>La contraseña inicial debe tener al menos 12 caracteres.</SheetDescription>
      </SheetHeader>
      <UserFormFields key={formKey(state)} state={state} action={action} pending={pending} />
    </>
  )
}

function UserFormFields({
  state,
  action,
  pending,
}: {
  state: CreateUserState
  action: (payload: FormData) => void
  pending: boolean
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form action={action} className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 px-4 pb-4">
        {/* Nombre */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="create-user-name">Nombre completo</Label>
          <Input
            id="create-user-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="ej. Martín Palermo"
            defaultValue={state.values?.name ?? ''}
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

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="create-user-email">Correo electrónico</Label>
          <Input
            id="create-user-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ej. martin@ejemplo.com"
            defaultValue={state.values?.email ?? ''}
            aria-invalid={state.fieldErrors?.email ? true : undefined}
            aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
            required
            disabled={pending}
          />
          {state.fieldErrors?.email && (
            <p id="email-error" className="text-xs text-destructive">
              {state.fieldErrors.email}
            </p>
          )}
        </div>

        {/* Contraseña */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="create-user-password">Contraseña inicial</Label>
          <div className="relative">
            <Input
              id="create-user-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Mínimo 12 caracteres"
              aria-invalid={state.fieldErrors?.password ? true : undefined}
              aria-describedby="password-help password-error"
              required
              disabled={pending}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {state.fieldErrors?.password ? (
            <p id="password-error" className="text-xs text-destructive">
              {state.fieldErrors.password}
            </p>
          ) : (
            <p id="password-help" className="text-xs text-muted-foreground">
              Exigido por la API: mínimo 12 caracteres.
            </p>
          )}
        </div>

        {/* Mensaje de error general */}
        {state.error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {state.error}
          </p>
        )}
      </div>

      <SheetFooter className="border-t">
        <Button type="submit" className="w-full cursor-pointer gap-2" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Guardando...
            </>
          ) : (
            <>
              <UserPlus className="size-4" aria-hidden="true" />
              Crear usuario
            </>
          )}
        </Button>
      </SheetFooter>
    </form>
  )
}
