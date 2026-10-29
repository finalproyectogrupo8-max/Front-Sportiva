'use client'

import { useState } from 'react'
import { Eye, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TicketStatusBadge } from '@/components/admin/ticket-status-badge'
import { TicketDetailDialog } from '@/components/admin/ticket-detail-dialog'
import type { SupportTicket, SupportTicketStatus } from '@/lib/admin-types'
import { formatDateTime } from '@/lib/format-date'

interface TicketTableProps {
  tickets: SupportTicket[]
}

export function TicketTable({ tickets }: TicketTableProps) {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleOpenDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setDialogOpen(true)
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card/50 p-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox className="size-6" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <h3 className="text-base font-semibold text-foreground">No hay tickets de contacto</h3>
          <p className="text-sm text-muted-foreground">
            No se encontraron tickets con los filtros actuales o todavía no se registraron mensajes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Listado de tickets de contacto</caption>
            <thead className="border-b bg-muted/50 text-xs font-medium text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Fecha
                </th>
                <th scope="col" className="px-4 py-3">
                  Remitente
                </th>
                <th scope="col" className="px-4 py-3">
                  Asunto
                </th>
                <th scope="col" className="hidden px-4 py-3 sm:table-cell">
                  Club
                </th>
                <th scope="col" className="px-4 py-3">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => handleOpenDetail(ticket)}
                  className="group cursor-pointer transition-colors hover:bg-muted/40"
                >
                  {/* Fecha */}
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(ticket.created_at)}
                  </td>

                  {/* Remitente */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-display text-[10px] font-semibold text-muted-foreground">
                        {ticket.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0 max-w-[180px] sm:max-w-[220px]">
                        <span className="truncate font-medium text-foreground">{ticket.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{ticket.email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Asunto */}
                  <td className="px-4 py-3 max-w-[220px] sm:max-w-xs">
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                        {ticket.subject}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {ticket.message}
                      </span>
                    </div>
                  </td>

                  {/* Club */}
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                    {ticket.club_name || <span className="text-muted-foreground/50">—</span>}
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <TicketStatusBadge status={ticket.status as SupportTicketStatus} />
                  </td>

                  {/* Acción */}
                  <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDetail(ticket)}
                      className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Eye className="size-3.5" aria-hidden="true" />
                      <span>Ver detalle</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TicketDetailDialog
        ticket={selectedTicket}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setSelectedTicket(null)
          }
        }}
      />
    </>
  )
}
