'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { deleteTenantAction, updateTenantAction } from '@/app/(app)/admin/clubes/actions'
import type { AdminTenant } from '@/lib/api/admin'

/** Editar el nombre y el perfil del club, y darlo de baja (FRO-21). */
export function EditClubActions({ tenant }: { tenant: AdminTenant }) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" className="cursor-pointer gap-2" onClick={() => setEditing(true)}>
        <Pencil className="size-4" aria-hidden="true" />
        Editar club
      </Button>
      <Button type="button" variant="outline" className="cursor-pointer gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleting(true)}>
        <Trash2 className="size-4" aria-hidden="true" />
        Dar de baja
      </Button>
      <Sheet open={editing} onOpenChange={setEditing}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md">
          {editing && <EditClubForm tenant={tenant} onDone={() => setEditing(false)} />}
        </SheetContent>
      </Sheet>
      <DeleteClubDialog tenant={tenant} open={deleting} onOpenChange={setDeleting} />
    </div>
  )
}

const FIELDS = [
  { key: 'name', label: 'Nombre', props: { required: true, maxLength: 255 } },
  { key: 'short_name', label: 'Sigla', props: { maxLength: 6, placeholder: 'CAVR' } },
  { key: 'city', label: 'Ciudad', props: { maxLength: 120 } },
  { key: 'founded_year', label: 'Año de fundación', props: { type: 'number', min: 1800, max: new Date().getFullYear() } },
] as const

function EditClubForm({ tenant, onDone }: { tenant: AdminTenant; onDone: () => void }) {
  const [values, setValues] = useState({
    name: tenant.name,
    short_name: tenant.short_name ?? '',
    city: tenant.city ?? '',
    founded_year: tenant.founded_year ? String(tenant.founded_year) : '',
    primary_color: tenant.primary_color ?? '#1d4ed8',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  return (
    <>
      <SheetHeader className="pr-12">
        <SheetTitle>Editar club</SheetTitle>
        <SheetDescription>El slug y la base de datos no se pueden cambiar.</SheetDescription>
      </SheetHeader>
      <form
        className="flex flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault()
          startTransition(async () => {
            const result = await updateTenantAction(tenant.id, {
              name: values.name.trim(),
              short_name: values.short_name.trim() || null,
              city: values.city.trim() || null,
              founded_year: values.founded_year ? Number(values.founded_year) : null,
              primary_color: values.primary_color || null,
            })
            if (result.ok) {
              toast.success(result.message)
              onDone()
              return
            }
            setErrors(result.fieldErrors ?? {})
            setError(result.error)
          })
        }}
      >
        <div className="flex flex-col gap-4 px-4 pb-4">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <Label htmlFor={`club-${f.key}`}>{f.label}</Label>
              <Input
                id={`club-${f.key}`}
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                aria-invalid={errors[f.key] ? true : undefined}
                aria-describedby={errors[f.key] ? `club-${f.key}-error` : undefined}
                {...f.props}
              />
              {errors[f.key] && <p id={`club-${f.key}-error`} className="text-xs text-destructive">{errors[f.key]}</p>}
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="club-primary_color">Color del club</Label>
            <div className="flex items-center gap-2">
              <input
                id="club-primary_color"
                type="color"
                value={values.primary_color}
                onChange={(e) => setValues((v) => ({ ...v, primary_color: e.target.value }))}
                className="h-9 w-14 cursor-pointer rounded-md border bg-transparent"
              />
              <code className="text-xs text-muted-foreground">{values.primary_color}</code>
            </div>
            {errors.primary_color && <p className="text-xs text-destructive">{errors.primary_color}</p>}
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
        <SheetFooter className="mt-auto border-t">
          <Button type="submit" className="w-full cursor-pointer gap-2" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Guardar cambios
          </Button>
        </SheetFooter>
      </form>
    </>
  )
}

function DeleteClubDialog({ tenant, open, onOpenChange }: { tenant: AdminTenant; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setTyped('')
          setError(undefined)
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dar de baja {tenant.name}</DialogTitle>
          <DialogDescription>
            El club deja de aparecer y nadie puede entrar. La base de datos no se borra: se puede recuperar desde la API. Para confirmar, escribí <code className="font-mono font-semibold text-foreground">{tenant.slug}</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-slug">Slug del club</Label>
          <Input id="confirm-slug" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" spellCheck={false} />
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="gap-2"
            disabled={pending || typed.trim() !== tenant.slug}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteTenantAction(tenant.id)
                if (!result.ok) {
                  setError(result.error)
                  return
                }
                toast.success(result.message)
                onOpenChange(false)
                router.push('/admin/clubes')
              })
            }
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Dar de baja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
