'use client'

import { useActionState, useEffect } from 'react'
import { Building2, Loader2, Mail, User } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TicketStatusBadge } from '@/components/admin/ticket-status-badge'
import { updateTicketAction } from '@/app/(app)/admin/tickets/actions'
import { INITIAL_ADMIN_ACTION_STATE, type SupportTicket, type SupportTicketStatus } from '@/lib/admin-types'
import { TICKET_STATUS_LABELS } from '@/lib/admin-labels'

interface TicketDetailDialogProps {
  ticket: SupportTicket | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDate(dateString: string | null) {
  if (!dateString) return '—'
  try {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  } catch {
    return dateString
  }
}

export function TicketDetailDialog({ ticket, open, onOpenChange }: TicketDetailDialogProps) {
  const [state, action, pending] = useActionState(updateTicketAction, INITIAL_ADMIN_ACTION_STATE)

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message || 'Ticket actualizado correctamente.')
      onOpenChange(false)
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state, onOpenChange])

  if (!ticket) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="gap-1.5 pb-2 border-b">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ticket #{ticket.id}
            </span>
            <TicketStatusBadge status={ticket.status as SupportTicketStatus} />
          </div>
          <DialogTitle className="text-xl font-bold leading-snug">
            {ticket.subject}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Enviado el {formatDate(ticket.created_at)}
          </DialogDescription>
        </DialogHeader>

        {/* Datos del remitente */}
        <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3.5 text-xs sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <User className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Remitente</p>
              <p className="truncate font-medium text-foreground">{ticket.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Email</p>
              <a
                href={`mailto:${ticket.email}`}
                className="truncate font-medium text-primary hover:underline"
              >
                {ticket.email}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Club</p>
              <p className="truncate font-medium text-foreground">
                {ticket.club_name || 'Sin club'}
              </p>
            </div>
          </div>
        </div>

        {/* Mensaje original */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mensaje
          </Label>
          <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {ticket.message}
          </div>
        </div>

        {/* Formulario de actualización de estado y notas */}
        <form key={ticket.id} action={action} className="flex flex-col gap-4 border-t pt-4">
          <input type="hidden" name="id" value={ticket.id} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Estado */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ticket-status-select" className="text-xs font-semibold">
                Estado del ticket
              </Label>
              <select
                id="ticket-status-select"
                name="status"
                defaultValue={ticket.status}
                aria-invalid={Boolean(state.errors?.status)}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="new">{TICKET_STATUS_LABELS.new}</option>
                <option value="in_review">{TICKET_STATUS_LABELS.in_review}</option>
                <option value="resolved">{TICKET_STATUS_LABELS.resolved}</option>
                <option value="discarded">{TICKET_STATUS_LABELS.discarded}</option>
              </select>
              {state.errors?.status?.[0] && (
                <p className="text-xs text-destructive">{state.errors.status[0]}</p>
              )}
            </div>

            {/* Fecha resolución si aplica */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Resolución
              </Label>
              <div className="flex h-9 items-center rounded-lg border border-input/40 bg-muted/20 px-3 text-xs text-muted-foreground">
                {ticket.resolved_at ? formatDate(ticket.resolved_at) : 'Pendiente'}
              </div>
            </div>
          </div>

          {/* Notas internas */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="ticket-admin-notes" className="text-xs font-semibold">
                Notas internas de administración
              </Label>
              <span className="text-[10px] text-muted-foreground">Solo visible para admins</span>
            </div>
            <Textarea
              id="ticket-admin-notes"
              name="admin_notes"
              defaultValue={ticket.admin_notes ?? ''}
              rows={3}
              placeholder="Detalles sobre el contacto, resolución acordada o notas internas..."
              aria-invalid={Boolean(state.errors?.admin_notes)}
            />
            {state.errors?.admin_notes?.[0] && (
              <p className="text-xs text-destructive">{state.errors.admin_notes[0]}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cerrar
            </Button>
            <Button type="submit" disabled={pending} className="gap-2">
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
