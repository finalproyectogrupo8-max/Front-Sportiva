import type { AdminFieldErrors } from '@/lib/admin-types'

export interface CreateUserFields {
  name: string
  email: string
  password: string
}

export interface CreateTenantFields {
  name: string
  slug: string
}

export interface CreateMembershipFields {
  user_id: string
  tenant_slug: string
}

export function validateUserFields(fields: CreateUserFields): AdminFieldErrors {
  const errors: AdminFieldErrors = {}

  if (!fields.name.trim()) errors.name = ['El nombre es obligatorio.']
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = ['Ingresá un email válido.']
  }
  if (fields.password.length < 8) {
    errors.password = ['La contraseña debe tener al menos 8 caracteres.']
  }

  return errors
}

export function validateTenantFields(fields: CreateTenantFields): AdminFieldErrors {
  const errors: AdminFieldErrors = {}

  if (!fields.name.trim()) errors.name = ['El nombre es obligatorio.']
  if (!fields.slug.trim()) {
    errors.slug = ['El slug es obligatorio.']
  } else if (fields.slug.length > 40) {
    errors.slug = ['El slug no puede superar los 40 caracteres.']
  } else if (!/^[a-z0-9_]+$/.test(fields.slug)) {
    errors.slug = ['Usá solo minúsculas, números y guion bajo.']
  }

  return errors
}

export function validateMembershipFields(fields: CreateMembershipFields): AdminFieldErrors {
  const errors: AdminFieldErrors = {}

  if (!fields.user_id) errors.user_id = ['Elegí un usuario.']
  if (!fields.tenant_slug) errors.tenant_slug = ['Elegí un club.']

  return errors
}
