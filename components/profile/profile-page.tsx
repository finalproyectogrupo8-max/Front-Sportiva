'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, LogOut, ShieldCheck } from 'lucide-react'
import { changePasswordAction, logoutOthersAction, updateNameAction } from '@/app/(app)/perfil/actions'
import { ClubCrest } from '@/components/brand/logo'
import { ConfirmDialog, Field, FormError, useConfigAction } from '@/components/club/forms'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Club = { slug: string; name: string; short_name?: string | null; primary_color?: string | null; logo_url?: string | null; roles: string[] }

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?'

/**
 * Mi perfil. Se abre dentro de la navegación de donde viene (administración o club) y usa todo el
 * ancho: a la izquierda quién sos y tus clubes, a la derecha los ajustes de la cuenta.
 */
export function ProfilePage({
  name,
  email,
  isPlatformAdmin,
  clubs,
  currentClub,
}: {
  name: string
  email: string
  isPlatformAdmin: boolean
  clubs: Club[]
  currentClub?: string
}) {
  const [confirmLogout, setConfirmLogout] = useState(false)

  return (
    <div className="mx-auto flex w-full max-w-[120rem] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">Mi perfil</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">Tus datos de acceso a Sportiva y los clubes donde participás.</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)]">
        <aside className="flex flex-col overflow-hidden rounded-xl border bg-card lg:sticky lg:top-20">
          <div className="flex items-center gap-4 p-5 lg:flex-col lg:items-start">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-foreground font-display text-2xl font-bold text-background lg:size-16" aria-hidden="true">
              {initials(name)}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="truncate text-lg font-semibold">{name}</p>
              <p className="truncate text-sm text-muted-foreground">{email}</p>
              {isPlatformAdmin && (
                <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  Administración de Sportiva
                </span>
              )}
            </div>
          </div>

          <section aria-labelledby="perfil-clubes" className="flex flex-col gap-1 border-t p-3">
            <h2 id="perfil-clubes" className="flex items-baseline justify-between px-2 pb-1 pt-1 text-sm font-semibold">
              Tus clubes
              {clubs.length > 0 && <span className="text-xs font-normal text-muted-foreground tabular-nums">{clubs.length}</span>}
            </h2>
            {clubs.length === 0 ? (
              <p className="px-2 pb-2 text-sm text-muted-foreground">Todavía no tenés acceso a ningún club. Cuando te inviten, aparece acá.</p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {clubs.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/c/${c.slug}`} aria-current={c.slug === currentClub ? 'page' : undefined} className="group flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-muted/60">
                      <ClubCrest short={c.short_name || c.name.slice(0, 3).toUpperCase()} color={c.primary_color || 'oklch(0.5 0.2 262)'} logoUrl={c.logo_url} className="size-9 rounded-md text-[10px]" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{c.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{c.roles.length ? c.roles.join(' · ') : 'Sin rol asignado'}</span>
                      </span>
                      {c.slug === currentClub ? (
                        <span className="shrink-0 text-xs text-muted-foreground">Estás acá</span>
                      ) : (
                        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <div className="grid items-start gap-6 xl:grid-cols-2">
          <Panel title="Tus datos" description="Así te ven en el club: en los pedidos, las convocatorias y la asistencia.">
            <NameForm name={name} email={email} />
          </Panel>

          <Panel title="Contraseña" description="Al cambiarla se cierran tus sesiones en otros dispositivos. En este seguís adentro." className="xl:row-span-2">
            <PasswordForm />
          </Panel>

          <Panel title="Sesiones" description="Si entraste desde una compu prestada o perdiste el celular, cerrá la sesión en los demás dispositivos.">
            <Button variant="outline" className="w-fit gap-2" onClick={() => setConfirmLogout(true)}>
              <LogOut className="size-4" aria-hidden="true" />
              Cerrar las demás sesiones
            </Button>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title="Cerrar las demás sesiones"
        description="Se cierra tu sesión en todos los otros dispositivos. En este seguís adentro."
        confirmLabel="Cerrar sesiones"
        onConfirm={logoutOthersAction}
      />
    </div>
  )
}

function Panel({ title, description, className, children }: { title: string; description: string; className?: string; children: React.ReactNode }) {
  const id = `perfil-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`
  return (
    <section aria-labelledby={id} className={cn('flex flex-col gap-5 rounded-xl border bg-card p-5', className)}>
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-base font-semibold">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" className="gap-2" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {pending ? 'Guardando…' : children}
    </Button>
  )
}

function NameForm({ name, email }: { name: string; email: string }) {
  const [value, setValue] = useState(name)
  const { pending, error, fieldErrors, execute } = useConfigAction()
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        execute(() => updateNameAction(value), () => undefined)
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <Field id="profile-name" label="Nombre y apellido" value={value} onChange={(e) => setValue(e.target.value)} required maxLength={255} autoComplete="name" error={fieldErrors.name ?? error} />
        <Field id="profile-email" label="Email" value={email} readOnly disabled hint="Con este email entrás. Para cambiarlo, hablá con un administrador." />
      </div>
      <div className="flex justify-end">
        <Submit pending={pending}>Guardar</Submit>
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
      className="flex flex-col gap-4"
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <Field id="new-password" label="Contraseña nueva" type="password" autoComplete="new-password" value={values.password} onChange={set('password')} required minLength={12} hint="Mínimo 12 caracteres." error={fieldErrors.password} />
        <Field id="confirm-password" label="Repetila" type="password" autoComplete="new-password" value={values.password_confirmation} onChange={set('password_confirmation')} required error={fieldErrors.password_confirmation} />
      </div>
      <FormError message={error} />
      <div className="flex justify-end">
        <Submit pending={pending}>Cambiar contraseña</Submit>
      </div>
    </form>
  )
}
