'use client'

import { useState, useTransition } from 'react'
import { KeyRound, Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { sendPasswordResetAction, updateUserAction } from '@/app/(app)/admin/usuarios/actions'
import type { AdminUser } from '@/lib/api/admin'

/** Editar nombre y email de un usuario, y mandarle el mail para restablecer la contraseña (FRO-21). */
export function EditUserSheet({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string>()
  const [saving, startSaving] = useTransition()
  const [sending, startSending] = useTransition()

  const openSheet = () => {
    setName(user.name)
    setEmail(user.email)
    setErrors({})
    setError(undefined)
    setOpen(true)
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="h-7 cursor-pointer gap-1 px-2 text-xs" onClick={openSheet} aria-label={`Editar a ${user.name}`}>
        <Pencil className="size-3" aria-hidden="true" />
        Editar
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md">
          <SheetHeader className="pr-12">
            <SheetTitle>Editar usuario</SheetTitle>
            <SheetDescription>No hay borrado: para quitarle el acceso, desactivalo desde el listado.</SheetDescription>
          </SheetHeader>
          <form
            className="flex flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault()
              startSaving(async () => {
                const result = await updateUserAction(user.id, { name: name.trim(), email: email.trim() })
                if (result.ok) {
                  toast.success(result.message)
                  setOpen(false)
                  return
                }
                setErrors(result.fieldErrors ?? {})
                setError(result.error)
              })
            }}
          >
            <div className="flex flex-col gap-4 px-4 pb-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-user-name">Nombre completo</Label>
                <Input id="edit-user-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={255} aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? 'edit-user-name-error' : undefined} />
                {errors.name && <p id="edit-user-name-error" className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-user-email">Correo electrónico</Label>
                <Input id="edit-user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? 'edit-user-email-error' : undefined} />
                {errors.email && <p id="edit-user-email-error" className="text-xs text-destructive">{errors.email}</p>}
              </div>
              {error && (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              <div className="mt-2 flex flex-col gap-2 rounded-lg border p-3">
                <span className="text-sm font-medium">Contraseña</span>
                <p className="text-xs text-muted-foreground">Le llega un mail con un link para elegir una nueva. Solo funciona si el usuario está activo.</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit cursor-pointer gap-2"
                  disabled={sending || !user.is_active}
                  onClick={() =>
                    startSending(async () => {
                      const result = await sendPasswordResetAction(user.id)
                      if (result.ok) toast.success(result.message)
                      else toast.error(result.error ?? 'No se pudo mandar el mail.')
                    })
                  }
                >
                  {sending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />}
                  Enviar mail para restablecer
                </Button>
              </div>
            </div>
            <SheetFooter className="mt-auto border-t">
              <Button type="submit" className="w-full cursor-pointer gap-2" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Guardar cambios
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
