import type { components } from '@/lib/api/schema'

type MembershipRole = components['schemas']['MembershipRole']

/** Roles de membresía de la API (`MembershipRole`) con su nombre en la UI. Hoy el único es `admin`. */
export const MEMBERSHIP_ROLES: { value: MembershipRole; label: string }[] = [
  { value: 'admin', label: 'Administrador del club' },
]

export function membershipRoleLabel(role: string): string {
  return MEMBERSHIP_ROLES.find((option) => option.value === role)?.label ?? role
}
