import type { Schemas } from '@/lib/api/client'

export type SupportTicketStatus = Schemas['TicketStatus']
export type SupportTicket = Schemas['SupportTicketResource']

export type AdminFieldErrors = Record<string, string[]>

export interface AdminActionState {
  ok: boolean
  message?: string
  errors?: AdminFieldErrors
  error?: string
}

export const INITIAL_ADMIN_ACTION_STATE: AdminActionState = { ok: false }

/* Tipos legacy para compatibilidad */
export type AdminTenantStatus = Schemas['TenantStatus']
export type AdminMembershipStatus = 'active' | 'inactive'

export type AdminUser = Schemas['App.Http.Resources.Admin.UserResource']
export type AdminTenant = Schemas['TenantResource']
export type AdminMembership = Schemas['TenantMembershipResource']
