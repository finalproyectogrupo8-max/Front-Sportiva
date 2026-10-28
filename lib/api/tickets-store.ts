import 'server-only'

import type { SupportTicket } from '@/lib/admin-types'

// Store compartido en memoria para desarrollo y pruebas.
// Usamos globalThis para evitar que el hot-reload de Next.js reinicie los tickets creados.
const globalForTickets = globalThis as unknown as {
  __supportTicketsMockStore?: SupportTicket[]
}

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-1',
    name: 'Carlos Benítez',
    email: 'carlos@villareal.com.ar',
    club_name: 'Club Atlético Villa Real',
    subject: 'Consulta sobre integración de canchas',
    message: 'Hola, queríamos consultar si es posible sincronizar las reservas de las canchas con nuestro sistema externo.',
    status: 'new',
    admin_notes: null,
    resolved_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // hace 2 horas
  },
  {
    id: 'tkt-2',
    name: 'Lucía Fernández',
    email: 'lucia.f@sportivoaromos.com',
    club_name: 'Sportivo Los Aromos',
    subject: 'Problema al cargar indumentaria',
    message: 'Buenas tardes. No estamos pudiendo registrar los talles especiales de camisetas para la categoría Sub-15. ¿Nos podrían asistir?',
    status: 'in_review',
    admin_notes: 'En revisión con el equipo de soporte técnico.',
    resolved_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // hace 1 día
  },
  {
    id: 'tkt-3',
    name: 'Martín Palermo',
    email: 'martin@belgrano.org',
    club_name: 'Unión Deportiva Belgrano Sur',
    subject: 'Alta de nuevo usuario admin',
    message: 'Necesitamos habilitar un nuevo usuario administrador para la secretaría del club.',
    status: 'resolved',
    admin_notes: 'Usuario creado y credenciales enviadas por email.',
    resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // hace 2 días
  },
]

export const ticketsStore: SupportTicket[] =
  globalForTickets.__supportTicketsMockStore ?? [...INITIAL_TICKETS]

if (process.env.NODE_ENV !== 'production') {
  globalForTickets.__supportTicketsMockStore = ticketsStore
}
