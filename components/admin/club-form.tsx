'use client'

import { useActionState, useEffect, useState } from 'react'
import { Building2, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTenantAction, type CreateTenantState } from '@/app/admin/clubes/actions'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplaza espacios y símbolos con guiones
    .replace(/^-+|-+$/g, '') // Quita guiones iniciales y finales
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
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
  }

  const handleSuggestSlug = () => {
    setSlug(slugify(name))
    setIsSlugManuallyEdited(false)
  }

  return (
    <form action={action} className="flex flex-col gap-4">
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
          placeholder="ej. river-plate"
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

      {/* Mensaje de error general */}
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="mt-2 w-full gap-2 cursor-pointer" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Creando club...
          </>
        ) : (
          <>
            <Building2 className="size-4" aria-hidden="true" />
            Crear club
          </>
        )}
      </Button>
    </form>
  )
}

export function ClubForm() {
  const [state, action, pending] = useActionState<CreateTenantState, FormData>(
    createTenantAction,
    {},
  )

  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message)
    }
  }, [state.ok, state.message, state.timestamp])

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <Building2 className="size-5" aria-hidden="true" />
          <CardTitle className="text-lg">Alta de club</CardTitle>
        </div>
        <CardDescription>
          Registrá un nuevo club en la plataforma. Se creará en estado de provisión para configurar su
          base de datos aislada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ClubFormFields
          key={state.timestamp ?? 0}
          state={state}
          action={action}
          pending={pending}
        />
      </CardContent>
    </Card>
  )
}

