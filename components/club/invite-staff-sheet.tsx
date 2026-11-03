'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { inviteClubUserAction, type InviteClubUserState } from '@/app/(app)/c/[club]/equipo/actions'
import { RoleChecklist } from '@/components/admin/role-checklist'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formKey } from '@/lib/form-key'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { ClubRole } from '@/lib/api/admin'

export function InviteStaffSheet({ roles }: { roles: ClubRole[] }) {
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState(0)

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setSession((current) => current + 1)
          setOpen(true)
        }}
        className="cursor-pointer gap-2"
      >
        <UserPlus className="size-4" aria-hidden="true" />
        Invitar al equipo
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto data-[side=right]:sm:max-w-md">
          {open && <InviteStaffForm key={session} roles={roles} onClose={() => setOpen(false)} />}
        </SheetContent>
      </Sheet>
    </>
  )
}

function InviteStaffForm({ roles, onClose }: { roles: ClubRole[]; onClose: () => void }) {
  const router = useRouter()
  const [state, action, pending] = useActionState<InviteClubUserState, FormData>(inviteClubUserAction, {})

  useEffect(() => {
    if (!state.ok) return
    toast.success(state.message ?? 'La persona se agregó al equipo.')
    router.refresh()
  }, [state.ok, state.message, state.timestamp, router])

  if (state.ok) {
    return (
      <>
        <SheetHeader className="pr-12">
          <SheetTitle>Listo</SheetTitle>
          <SheetDescription role="status" aria-live="polite">{state.message}</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <Button type="button" onClick={onClose}>Listo</Button>
        </SheetFooter>
      </>
    )
  }

  return (
    <>
      <SheetHeader className="pr-12">
        <SheetTitle>Invitar al equipo</SheetTitle>
        <SheetDescription>
          Si todavía no tiene cuenta, le vamos a enviar una invitación por mail para que elija su contraseña. Elegí también los roles que va a tener.
        </SheetDescription>
      </SheetHeader>
      <form key={formKey(state)} action={action} className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-staff-name">Nombre completo</Label>
            <Input
              id="invite-staff-name"
              name="name"
              autoComplete="name"
              defaultValue={state.values?.name}
              aria-invalid={state.fieldErrors?.name ? true : undefined}
              aria-describedby={state.fieldErrors?.name ? 'invite-staff-name-error' : 'invite-staff-name-help'}
              disabled={pending}
            />
            <p id="invite-staff-name-help" className="text-xs text-muted-foreground">
              Si todavía no tiene cuenta en Sportiva, completá el nombre para crearla.
            </p>
            {state.fieldErrors?.name && (
              <p id="invite-staff-name-error" role="alert" aria-live="polite" className="text-xs text-destructive">
                {state.fieldErrors.name}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-staff-email">Correo electrónico</Label>
            <Input
              id="invite-staff-email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state.values?.email}
              aria-invalid={state.fieldErrors?.email ? true : undefined}
              aria-describedby={state.fieldErrors?.email ? 'invite-staff-email-error' : undefined}
              required
              disabled={pending}
            />
            {state.fieldErrors?.email && (
              <p id="invite-staff-email-error" role="alert" aria-live="polite" className="text-xs text-destructive">
                {state.fieldErrors.email}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Roles</span>
            <RoleChecklist
              roles={roles}
              defaultSelected={state.values?.roles}
              disabled={pending}
              error={state.fieldErrors?.roles}
              idPrefix="invite-staff"
            />
          </div>
          {state.error && (
            <p role="alert" aria-live="polite" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
        </div>
        <SheetFooter className="border-t">
          <Button type="submit" className="w-full cursor-pointer gap-2" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Enviando...
              </>
            ) : (
              <>
                <UserPlus className="size-4" aria-hidden="true" />
                Enviar invitación
              </>
            )}
          </Button>
        </SheetFooter>
      </form>
    </>
  )
}
