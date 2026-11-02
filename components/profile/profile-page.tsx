'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, LogOut } from 'lucide-react'
import { changePasswordAction, logoutOthersAction, updateNameAction } from '@/app/(app)/perfil/actions'
import { ClubCrest } from '@/components/brand/logo'
import { ConfirmDialog, Field, FormError, SubmitButton, useConfigAction } from '@/components/club/forms'
import { ModuleHeader, PageBody } from '@/components/club/shared'
import { Button } from '@/components/ui/button'

type Club = { slug: string; name: string; short_name?: string | null; primary_color?: string | null; logo_url?: string | null; roles: string[] }

export function ProfilePage({ name, email, clubs, backHref, backLabel }: { name: string; email: string; clubs: Club[]; backHref: string; backLabel: string }) {
  const [confirmLogout, setConfirmLogout] = useState(false)

  return (
    <>
      <ModuleHeader title="Mi perfil" description={email}>
        <Link href={backHref} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {backLabel}
        </Link>
      </ModuleHeader>
      <PageBody className="mx-0 max-w-4xl">
        <Section title="Nombre" description="Así te ven en el club: en los pedidos, las convocatorias y la asistencia.">
          <NameForm name={name} />
        </Section>

        <Section title="Contraseña" description="Al cambiarla se cierran tus sesiones en otros dispositivos. En este seguís adentro.">
          <PasswordForm />
        </Section>

        <Section title="Mis clubes" description="Los clubes donde tenés acceso y tu rol en cada uno.">
          {clubs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no tenés acceso a ningún club.</p>
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border">
              {clubs.map((c) => (
                <li key={c.slug} className="flex items-center gap-3 px-3 py-2.5">
                  <ClubCrest short={c.short_name || c.name.slice(0, 3).toUpperCase()} color={c.primary_color || "oklch(0.5 0.2 262)"} logoUrl={c.logo_url} className="size-8 rounded-md text-[10px]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{c.roles.length ? c.roles.join(' · ') : 'Sin rol asignado'}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Sesiones" description="Si entraste desde una compu prestada o perdiste el celular, cerrá la sesión en los demás dispositivos.">
          <Button variant="outline" className="w-fit gap-2" onClick={() => setConfirmLogout(true)}>
            <LogOut className="size-4" aria-hidden="true" />
            Cerrar las demás sesiones
          </Button>
        </Section>
      </PageBody>

      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title="Cerrar las demás sesiones"
        description="Se cierra tu sesión en todos los otros dispositivos. En este seguís adentro."
        confirmLabel="Cerrar sesiones"
        onConfirm={logoutOthersAction}
      />
    </>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const id = `perfil-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`
  return (
    <section aria-labelledby={id} className="grid gap-4 border-b pb-8 last:border-0 md:grid-cols-[14rem_minmax(0,1fr)]">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-base font-semibold">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex min-w-0 flex-col gap-3">{children}</div>
    </section>
  )
}

function NameForm({ name }: { name: string }) {
  const [value, setValue] = useState(name)
  const { pending, error, fieldErrors, execute } = useConfigAction()
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault()
        execute(() => updateNameAction(value), () => undefined)
      }}
    >
      <Field id="profile-name" label="Nombre y apellido" value={value} onChange={(e) => setValue(e.target.value)} required maxLength={255} className="flex-1" error={fieldErrors.name ?? error} />
      <div className="sm:w-40">
        <SubmitButton pending={pending}>Guardar</SubmitButton>
      </div>
    </form>
  )
}

function PasswordForm() {
  const [values, setValues] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [formKey, setFormKey] = useState(0)
  const { pending, error, fieldErrors, execute } = useConfigAction()
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [key]: e.target.value }))

  return (
    <form
      key={formKey}
      className="flex max-w-sm flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        execute(
          () => changePasswordAction(values),
          () => {
            setValues({ current_password: '', password: '', password_confirmation: '' })
            setFormKey((k) => k + 1)
          },
        )
      }}
    >
      <Field id="current-password" label="Contraseña actual" type="password" autoComplete="current-password" value={values.current_password} onChange={set('current_password')} required error={fieldErrors.current_password} />
      <Field id="new-password" label="Contraseña nueva" type="password" autoComplete="new-password" value={values.password} onChange={set('password')} required minLength={12} hint="Mínimo 12 caracteres." error={fieldErrors.password} />
      <Field id="confirm-password" label="Repetila" type="password" autoComplete="new-password" value={values.password_confirmation} onChange={set('password_confirmation')} required error={fieldErrors.password_confirmation} />
      <FormError message={error} />
      <SubmitButton pending={pending}>Cambiar contraseña</SubmitButton>
    </form>
  )
}
