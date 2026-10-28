'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { KeyRound, Loader2, LogIn, Search, UserPlus, Users, X } from 'lucide-react'
import { toast } from 'sonner'
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
import {
  addMembershipAction,
  searchUsersAction,
  type AddMembershipState,
  type UserOption,
} from '@/app/admin/clubes/[id]/actions'
import { MEMBERSHIP_ROLES } from '@/lib/membership-roles'

const SEARCH_DEBOUNCE_MS = 300

function UserPicker({
  selected,
  onSelect,
  error,
  disabled,
}: {
  selected: UserOption | null
  onSelect: (user: UserOption | null) => void
  error?: string
  disabled: boolean
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserOption[]>([])
  const [searching, startSearch] = useTransition()

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) return

    let cancelled = false
    const timeout = setTimeout(() => {
      startSearch(async () => {
        const users = await searchUsersAction(term)
        if (!cancelled) setResults(users)
      })
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [query])

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">{selected.name}</span>
          <span className="truncate text-xs text-muted-foreground">{selected.email}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onSelect(null)}
          disabled={disabled}
          aria-label="Cambiar usuario"
        >
          <X className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    )
  }

  const term = query.trim()
  // Con menos de 2 caracteres no se busca: se ignoran los resultados de una búsqueda anterior.
  const visibleResults = term.length >= 2 ? results : []

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="membership-user"
          type="search"
          autoComplete="off"
          placeholder="Buscar por nombre o email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'membership-user-error' : undefined}
          disabled={disabled}
        />
        {searching && (
          <Loader2
            className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>

      {term.length >= 2 && !searching && results.length === 0 && (
        <p className="text-xs text-muted-foreground">No hay usuarios activos que coincidan.</p>
      )}

      {visibleResults.length > 0 && (
        <ul className="flex max-h-60 flex-col overflow-y-auto rounded-lg border bg-popover" role="listbox">
          {visibleResults.map((user) => (
            <li key={user.id} role="option" aria-selected={false}>
              <button
                type="button"
                className="flex w-full cursor-pointer flex-col px-3 py-2 text-left hover:bg-muted"
                onClick={() => {
                  onSelect(user)
                  setQuery('')
                  setResults([])
                }}
              >
                <span className="text-sm font-medium text-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Botón "Agregar miembro": abre un panel lateral para asociar un usuario existente al club. */
export function AddMemberSheet({
  tenantId,
  tenantSlug,
  disabled,
}: {
  tenantId: number
  tenantSlug: string
  /** Solo se pueden agregar miembros a un club activo. */
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState(0)

  const openNew = () => {
    setSession((n) => n + 1)
    setOpen(true)
  }

  return (
    <>
      <Button
        type="button"
        onClick={openNew}
        disabled={disabled}
        className="cursor-pointer gap-2"
        title={disabled ? 'Solo se pueden agregar miembros a un club activo' : undefined}
      >
        <UserPlus className="size-4" aria-hidden="true" />
        Agregar miembro
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto data-[side=right]:sm:max-w-md">
          <SheetHeader className="pr-12">
            <SheetTitle>Agregar miembro</SheetTitle>
            <SheetDescription>
              Asociá un usuario existente al club. Después de esto puede entrar con su email y contraseña.
            </SheetDescription>
          </SheetHeader>
          {open && (
            <MembershipFormFields
              key={session}
              tenantId={tenantId}
              tenantSlug={tenantSlug}
              onAdded={() => setOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

function MembershipFormFields({
  tenantId,
  tenantSlug,
  onAdded,
}: {
  tenantId: number
  tenantSlug: string
  onAdded: () => void
}) {
  const [state, action, pending] = useActionState<AddMembershipState, FormData>(addMembershipAction, {})
  const [selected, setSelected] = useState<UserOption | null>(null)

  useEffect(() => {
    if (!state.ok) return
    // El panel se cierra, así que el toast no tapa nada.
    toast.success(selected ? `${selected.name} ahora es miembro del club.` : 'Miembro agregado al club.')
    onAdded()
  }, [state.ok, state.timestamp]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={action} className="flex flex-1 flex-col">
      <input type="hidden" name="tenant_id" value={tenantId} />
      <input type="hidden" name="user_id" value={selected?.id ?? ''} />

      <div className="flex flex-col gap-4 px-4 pb-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="membership-user">Usuario</Label>
          <UserPicker
            selected={selected}
            onSelect={setSelected}
            error={state.fieldErrors?.user_id}
            disabled={pending}
          />
          {state.fieldErrors?.user_id && (
            <p id="membership-user-error" className="text-xs text-destructive">
              {state.fieldErrors.user_id}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="membership-role">Rol</Label>
          <select
            id="membership-role"
            name="role"
            defaultValue={MEMBERSHIP_ROLES[0].value}
            disabled={pending}
            aria-invalid={state.fieldErrors?.role ? true : undefined}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            {MEMBERSHIP_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {state.fieldErrors?.role && <p className="text-xs text-destructive">{state.fieldErrors.role}</p>}
        </div>

        {state.error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {state.error}
          </p>
        )}

        <HowMembersEnter slug={tenantSlug} />
      </div>

      <SheetFooter className="border-t">
        <Button type="submit" className="w-full cursor-pointer gap-2" disabled={pending || !selected}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Agregando...
            </>
          ) : (
            <>
              <UserPlus className="size-4" aria-hidden="true" />
              Agregar al club
            </>
          )}
        </Button>
      </SheetFooter>
    </form>
  )
}

function HowMembersEnter({ slug }: { slug: string }) {
  const steps = [
    { icon: LogIn, text: 'El miembro inicia sesión con su email y contraseña.' },
    {
      icon: Users,
      text: (
        <>
          Si este es su único club, entra directo a <code className="font-mono text-foreground">/c/{slug}</code>.
          Si tiene varios, lo elige en el selector.
        </>
      ),
    },
    { icon: KeyRound, text: 'Al desactivar la membresía pierde el acceso al club en el momento.' },
  ]

  return (
    <div className="mt-2 flex flex-col gap-3 rounded-xl border border-dashed bg-muted/30 p-4">
      <h3 className="text-sm font-semibold text-foreground">Cómo entra un miembro</h3>
      <ol className="flex flex-col gap-3">
        {steps.map(({ icon: Icon, text }, index) => (
          <li key={index} className="flex gap-3 text-xs leading-relaxed text-muted-foreground">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
