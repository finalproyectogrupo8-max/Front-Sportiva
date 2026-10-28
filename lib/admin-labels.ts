import type { AdminMembershipStatus, AdminTenantStatus, SupportTicketStatus } from '@/lib/admin-types'

/**
 * Mapa único de etiquetas en español para los estados de tickets de soporte.
 */
export const TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  new: 'Nuevo',
  in_review: 'En revisión',
  resolved: 'Resuelto',
  discarded: 'Descartado',
}

export const TENANT_STATUS_LABELS: Record<AdminTenantStatus, string> = {
  provisioning: 'En preparación',
  active: 'Activo',
  failed: 'Fallido',
  inactive: 'Inactivo',
}

export const MEMBERSHIP_STATUS_LABELS: Record<AdminMembershipStatus, string> = {
  active: 'Activa',
  inactive: 'Inactiva',
}

