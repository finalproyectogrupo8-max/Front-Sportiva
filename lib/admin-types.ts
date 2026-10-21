export interface AdminUser {
  id: string
  name: string
  email: string
  is_platform_admin: boolean
  created_at: string
}

export type AdminTenantStatus = 'provisioning' | 'active' | 'failed' | 'inactive'
export type AdminMembershipStatus = 'active' | 'inactive'

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

export type AdminFieldErrors = Record<string, string[]>

export interface AdminActionState {
  ok: boolean
  message?: string
  errors?: AdminFieldErrors
}

export const INITIAL_ADMIN_ACTION_STATE: AdminActionState = { ok: false }
