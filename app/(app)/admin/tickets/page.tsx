import { AlertTriangle, MessageSquare } from 'lucide-react'
import { requirePlatformAdmin } from '@/lib/session'
import { getAdminTickets, type AdminTicketsSort, type TicketStatus } from '@/lib/api/admin'
import { TicketFilters } from '@/components/admin/ticket-filters'
import { TicketTable } from '@/components/admin/ticket-table'
import { Pagination } from '@/components/admin/pagination'

export const metadata = {
  title: 'Tickets de contacto | Admin Sportiva',
  description: 'Gestión de tickets y consultas de contacto de la plataforma.',
}

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    page?: string
    per_page?: string
    sort?: string
    q?: string
  }>
}) {
  await requirePlatformAdmin()

  const params = await searchParams
  const validStatuses: TicketStatus[] = ['new', 'in_review', 'resolved', 'discarded']
  const statusFilter =
    params.status && validStatuses.includes(params.status as TicketStatus)
      ? (params.status as TicketStatus)
      : undefined

  const page = params.page ? Math.max(1, parseInt(params.page, 10) || 1) : 1
  const perPage = params.per_page ? Math.max(1, parseInt(params.per_page, 10) || 15) : 15
  const sort = (params.sort as AdminTicketsSort) || '-created_at'

  let result
  let connectionError = false

  try {
    result = await getAdminTickets({
      status: statusFilter,
      page,
      per_page: perPage,
      sort,
    })
  } catch {
    connectionError = true
  }

  let tickets = result && result.ok ? result.data.data : []
  const query = params.q?.trim().toLowerCase()
  if (query && tickets.length > 0) {
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
    <div className="mx-auto flex max-w-[120rem] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
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

      {connectionError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
          <AlertTriangle className="size-8" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">No se pudo conectar con la API</h2>
            <p className="text-xs text-muted-foreground">
              Verificá que el backend esté corriendo en la URL configurada.
            </p>
          </div>
        </div>
      ) : !result || !result.ok ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
          <AlertTriangle className="size-8" aria-hidden="true" />
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">No se pudo cargar el listado</h2>
            <p className="text-xs text-muted-foreground">
              {result && 'message' in result ? result.message : 'Error inesperado del servidor.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <TicketTable tickets={tickets} />
          <Pagination meta={result.data.meta} label={{ one: 'ticket', many: 'tickets' }} />
        </>
      )}
    </div>
  )
}
