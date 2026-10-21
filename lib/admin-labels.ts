import type { AdminMembershipStatus, AdminTenantStatus } from '@/lib/admin-types'

export const TENANT_STATUS_LABELS = {
  provisioning: 'En preparación',
  active: 'Activo',
  failed: 'Fallido',
  inactive: 'Inactivo',
} satisfies Record<AdminTenantStatus, string>

export const MEMBERSHIP_STATUS_LABELS = {
  active: 'Activa',
  inactive: 'Inactiva',
} satisfies Record<AdminMembershipStatus, string>
