'use client'

import { useState, useTransition } from 'react'
import { Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type ResendInviteResult = { ok: true } | { ok: false; error: string }

export function ResendInviteButton({
  name,
  onResend,
}: {
  name: string
  onResend: () => Promise<ResendInviteResult>
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const handleResend = () => {
    setError('')
    startTransition(async () => {
      const result = await onResend()
      if (!result.ok) {
        setError(result.error)
        return
      }

      toast.success(`Enviamos una nueva invitación a ${name}.`)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 cursor-pointer gap-1 px-2 text-xs"
        onClick={() => {
          setError('')
          setOpen(true)
        }}
      >
        <Mail className="size-3" aria-hidden="true" />
        Reenviar invitación
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reenviar invitación</DialogTitle>
            <DialogDescription>
              Se va a generar un enlace nuevo para {name}. El enlace anterior dejará de ser válido.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" aria-live="polite" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleResend} disabled={pending} className="gap-2">
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Confirmar reenvío
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
