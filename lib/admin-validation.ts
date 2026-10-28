import type { AdminFieldErrors, SupportTicketStatus } from '@/lib/admin-types'

export interface CreateTicketFields {
  name: string
  email: string
  club_name?: string
  subject: string
  message: string
  website?: string
  hp?: string
}

export interface UpdateTicketFields {
  status?: string
  admin_notes?: string
}

export function validateTicketFields(fields: CreateTicketFields): AdminFieldErrors {
  const errors: AdminFieldErrors = {}

  if (!fields.name.trim()) {
    errors.name = ['El nombre es obligatorio.']
  }

  const emailTrimmed = fields.email.trim()
  if (!emailTrimmed) {
    errors.email = ['El email es obligatorio.']
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
    errors.email = ['Ingresá un email válido.']
  }

  if (!fields.subject.trim()) {
    errors.subject = ['El asunto es obligatorio.']
  }

  const messageTrimmed = fields.message.trim()
  if (!messageTrimmed) {
    errors.message = ['El mensaje es obligatorio.']
  } else if (messageTrimmed.length < 10) {
    errors.message = ['El mensaje debe tener al menos 10 caracteres.']
  } else if (messageTrimmed.length > 3000) {
    errors.message = ['El mensaje no puede superar los 3000 caracteres.']
  }

  return errors
}

export function validateUpdateTicketFields(fields: UpdateTicketFields): AdminFieldErrors {
  const errors: AdminFieldErrors = {}
  const validStatuses: SupportTicketStatus[] = ['new', 'in_review', 'resolved', 'discarded']

  if (fields.status && !validStatuses.includes(fields.status as SupportTicketStatus)) {
    errors.status = ['Estado no válido.']
  }

  if (fields.admin_notes && fields.admin_notes.length > 3000) {
    errors.admin_notes = ['Las notas internas no pueden superar los 3000 caracteres.']
  }

  return errors
}

/* Validaciones legacy para compatibilidad */
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

