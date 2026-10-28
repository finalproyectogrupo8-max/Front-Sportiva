import { MessageSquare } from 'lucide-react'
import { requirePlatformAdmin } from '@/lib/session'
import { listTickets } from '@/lib/api/admin'
import { TicketFilters } from '@/components/admin/ticket-filters'
import { TicketTable } from '@/components/admin/ticket-table'
import type { SupportTicketStatus } from '@/lib/admin-types'

export const metadata = {
  title: 'Tickets de contacto | Admin Sportiva',
  description: 'Gestión de tickets y consultas de contacto de la plataforma.',
}

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    q?: string
  }>
}) {
  await requirePlatformAdmin()

  const params = await searchParams
  const validStatuses: SupportTicketStatus[] = ['new', 'in_review', 'resolved', 'discarded']
  const statusFilter =
    params.status && validStatuses.includes(params.status as SupportTicketStatus)
      ? (params.status as SupportTicketStatus)
      : undefined

  let tickets = await listTickets(statusFilter)

  const query = params.q?.trim().toLowerCase()
  if (query) {
    tickets = tickets.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.email.toLowerCase().includes(query) ||
        t.subject.toLowerCase().includes(query) ||
        (t.club_name && t.club_name.toLowerCase().includes(query)) ||
        t.message.toLowerCase().includes(query),
    )
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/* Header de la sección */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Administración central
        </p>
        <div className="flex items-center gap-2">
          <MessageSquare className="size-7 text-foreground" aria-hidden="true" />
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
            Tickets de contacto
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Revisá las consultas y mensajes de contacto recibidos desde los formularios públicos de la plataforma.
        </p>
      </div>

      {/* Filtros */}
      <TicketFilters />

      {/* Tabla de tickets con modal de detalle */}
      <TicketTable tickets={tickets} />
    </div>
  )
}
