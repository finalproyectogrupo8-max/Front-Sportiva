'use client'

import { useRef, useState } from 'react'
import { ImageUp, Loader2, Trash2 } from 'lucide-react'
import {
  removeLogoAction,
  saveProfileAction,
  uploadLogoAction,
} from '@/app/(app)/c/[club]/configuracion/actions'
import { ClubCrest } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Club } from '@/lib/api/club'
import { ConfirmDialog, Field, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'

const FALLBACK_COLOR = '#1d4ed8'

export function ProfileSection({ club, canEdit }: { club: Club; canEdit: boolean }) {
  const profile = useConfigAction()
  const [color, setColor] = useState(club.primary_color ?? FALLBACK_COLOR)
  const [shortName, setShortName] = useState(club.short_name ?? '')
  const maxYear = new Date().getFullYear()

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Datos del club</CardTitle>
          <CardDescription>
            {canEdit
              ? 'Se ven en el menú, en las convocatorias y en lo que reciben los jugadores.'
              : 'Solo el administrador del club puede cambiarlos.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const data = new FormData(e.currentTarget)
              profile.execute(() => saveProfileAction(data))
            }}
          >
            <fieldset disabled={!canEdit || profile.pending} className="flex flex-col gap-4">
              <Field
                id="club-name"
                name="name"
                label="Nombre"
                defaultValue={club.name}
                required
                maxLength={255}
                error={profile.fieldErrors.name}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="club-short"
                  name="short_name"
                  label="Sigla"
                  hint="Hasta 6 letras. Va en el escudo si no subiste uno."
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value.toUpperCase())}
                  maxLength={6}
                  error={profile.fieldErrors.short_name}
                />
                <Field
                  id="club-founded"
                  name="founded_year"
                  type="number"
                  inputMode="numeric"
                  label="Año de fundación"
                  defaultValue={club.founded_year ?? ''}
                  min={1800}
                  max={maxYear}
                  error={profile.fieldErrors.founded_year}
                />
              </div>
              <Field
                id="club-city"
                name="city"
                label="Ciudad"
                placeholder="ej. Banfield, Buenos Aires"
                defaultValue={club.city ?? ''}
                maxLength={120}
                error={profile.fieldErrors.city}
              />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="club-color">Color del club</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="club-color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-14 cursor-pointer rounded-md border bg-card p-1 disabled:cursor-not-allowed"
                    aria-describedby="club-color-hint"
                  />
                  <Input
                    name="primary_color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    aria-label="Color en hexadecimal"
                    aria-invalid={profile.fieldErrors.primary_color ? true : undefined}
                    className="w-32 font-mono text-xs"
                    maxLength={7}
                  />
                </div>
                {profile.fieldErrors.primary_color ? (
                  <p className="text-xs text-destructive">{profile.fieldErrors.primary_color}</p>
                ) : (
                  <p id="club-color-hint" className="text-xs text-muted-foreground">
                    Es un acento: el escudo y los detalles del club. El resto mantiene los colores de Sportiva.
                  </p>
                )}
              </div>
              <FormError message={profile.error} />
              {canEdit && (
                <div className="sm:w-48">
                  <SubmitButton pending={profile.pending}>Guardar cambios</SubmitButton>
                </div>
              )}
            </fieldset>
          </form>
        </CardContent>
      </Card>

      <LogoCard club={club} canEdit={canEdit} color={color} short={shortName || club.name.slice(0, 2)} />
    </div>
  )
}

function LogoCard({ club, canEdit, color, short }: { club: Club; canEdit: boolean; color: string; short: string }) {
  const upload = useConfigAction()
  const inputRef = useRef<HTMLInputElement>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escudo</CardTitle>
        <CardDescription>PNG, JPG o WEBP de hasta 1 MB. Mejor si es cuadrado y con fondo transparente.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <ClubCrest short={short} color={color} logoUrl={club.logo_url} className="size-28 rounded-2xl text-3xl" />

        {canEdit && (
          <form
            className="flex w-full flex-col gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              ref={inputRef}
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              id="club-logo"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const data = new FormData()
                data.append('logo', file)
                upload.execute(() => uploadLogoAction(data))
                e.target.value = ''
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={upload.pending}
              onClick={() => inputRef.current?.click()}
            >
              {upload.pending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ImageUp className="size-4" aria-hidden="true" />
              )}
              {club.logo_url ? 'Cambiar escudo' : 'Subir escudo'}
            </Button>
            {club.logo_url && (
              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2 text-destructive hover:text-destructive"
                disabled={upload.pending}
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Quitar escudo
              </Button>
            )}
            {(upload.fieldErrors.logo || upload.error) && (
              <p role="alert" className="text-center text-xs text-destructive">
                {upload.fieldErrors.logo ?? upload.error}
              </p>
            )}
          </form>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="¿Quitar el escudo?"
        description="Se va a mostrar la sigla sobre el color del club hasta que subas otro."
        confirmLabel="Quitar escudo"
        onConfirm={removeLogoAction}
      />
    </Card>
  )
}
