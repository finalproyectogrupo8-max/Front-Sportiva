'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ActionResult as ConfigResult } from '@/lib/action-result'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** Campo de formulario con su error de validación debajo. */
export function Field({
  id,
  label,
  hint,
  error,
  className,
  ...input
}: React.ComponentProps<typeof Input> & { id: string; label: string; hint?: string; error?: string }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...input} />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
      {message}
    </p>
  )
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" className="w-full gap-2" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {pending ? 'Guardando…' : children}
    </Button>
  )
}

/**
 * Ejecuta una server action de configuración: toast si sale bien, errores en el formulario si no.
 * `onDone` cierra el panel o el diálogo.
 */
export function useConfigAction() {
  const [pending, startTransition] = useTransition()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string>()

  const execute = (action: () => Promise<ConfigResult>, onDone?: (result: Extract<ConfigResult, { ok: true }>) => void) => {
    setError(undefined)
    setFieldErrors({})
    startTransition(async () => {
      let result: ConfigResult
      try {
        result = await action()
      } catch {
        result = { ok: false, error: 'No se pudo guardar. Probá de nuevo.' }
      }
      if (result.ok) {
        toast.success(result.message)
        onDone?.(result)
        return
      }
      setFieldErrors(result.fieldErrors ?? {})
      setError(result.error)
      // Sin formulario a la vista (acciones de la tabla), el error va en un toast.
      if (!onDone && result.error) toast.error(result.error)
    })
  }

  const reset = () => {
    setError(undefined)
    setFieldErrors({})
  }

  return { pending, fieldErrors, error, execute, reset }
}

/** Confirmación antes de una acción destructiva. Muestra el error de la API sin cerrarse. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  confirmLabel: string
  onConfirm: () => Promise<ConfigResult>
}) {
  const { pending, error, execute, reset } = useConfigAction()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <FormError message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="gap-2"
            disabled={pending}
            onClick={() => execute(onConfirm, () => onOpenChange(false))}
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Tabla simple de la configuración. */
export function ConfigTable({ caption, head, children }: { caption: string; head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">{head}</thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
      </div>
    </div>
  )
}

/** Panel lateral para el alta y la edición. */
export function ConfigSheet({
  open,
  onOpenChange,
  title,
  description,
  wide = false,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  /** Formularios largos (competencia con requisitos). */
  wide?: boolean
  children: React.ReactNode
}) {
  // Mientras se cierra, el panel conserva el título con el que se abrió ("Nuevo" no pasa a "Editar").
  const [shownTitle, setShownTitle] = useState(title)
  if (open && title !== shownTitle) setShownTitle(title)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'w-full gap-0 overflow-y-auto data-[side=right]:w-full',
          wide ? 'data-[side=right]:sm:max-w-2xl' : 'data-[side=right]:sm:max-w-md',
        )}
      >
        <SheetHeader>
          <SheetTitle>{shownTitle}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {open && children}
      </SheetContent>
    </Sheet>
  )
}

/** Celda de acciones de una fila. */
export function RowActions({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-1">{children}</div>
}
