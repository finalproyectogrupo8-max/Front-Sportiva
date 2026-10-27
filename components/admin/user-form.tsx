'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createUserAction, type CreateUserState } from '@/app/admin/usuarios/actions'

export function UserForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [state, action, pending] = useActionState<CreateUserState, FormData>(
    createUserAction,
    {},
  )

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message)
      formRef.current?.reset()
    }
  }, [state.ok, state.message, state.timestamp])

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <UserPlus className="size-5" aria-hidden="true" />
          <CardTitle className="text-lg">Alta de usuario</CardTitle>
        </div>
        <CardDescription>
          Creá un nuevo usuario de plataforma. La contraseña inicial debe tener al menos 12 caracteres.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="flex flex-col gap-4">
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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

          <Button type="submit" className="mt-2 w-full gap-2" disabled={pending}>
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
        </form>
      </CardContent>
    </Card>
  )
}

