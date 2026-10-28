export type SupportTicketStatus = 'new' | 'in_review' | 'resolved' | 'discarded'

export interface SupportTicket {
  id: string
  name: string
  email: string
  club_name: string | null
  subject: string
  message: string
  status: SupportTicketStatus
  admin_notes: string | null
  resolved_at: string | null
  created_at: string
}

export type AdminFieldErrors = Record<string, string[]>

export interface AdminActionState {
  ok: boolean
  message?: string
  errors?: AdminFieldErrors
  error?: string
}

export const INITIAL_ADMIN_ACTION_STATE: AdminActionState = { ok: false }

/* Tipos legacy para compatibilidad */
export type AdminTenantStatus = 'provisioning' | 'active' | 'failed' | 'inactive'
export type AdminMembershipStatus = 'active' | 'inactive'

export interface AdminUser {
  id: string
  name: string
  email: string
  is_platform_admin: boolean
  created_at: string
}

export interface AdminTenant {
  id: string
  slug: string
  name: string
  status: AdminTenantStatus
  created_at: string
}

export interface AdminMembership {
  id: string
  status: AdminMembershipStatus
  created_at: string
  user: Pick<AdminUser, 'id' | 'name' | 'email'>
  tenant: Pick<AdminTenant, 'id' | 'slug' | 'name'>
}

