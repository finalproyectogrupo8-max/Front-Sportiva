import 'server-only'

import type { AdminMembership, AdminTenant, AdminUser } from '@/lib/admin-types'
import {
  validateMembershipFields,
  validateTenantFields,
  validateUserFields,
  type CreateMembershipFields,
  type CreateTenantFields,
  type CreateUserFields,
} from '@/lib/admin-validation'

// Proposed API endpoints:
// GET/POST /api/admin/users -> listUsers, createUser
// GET/POST /api/admin/tenants -> listTenants, createTenant
// GET /api/admin/memberships -> listMemberships
// POST /api/admin/tenants/{slug}/memberships -> addMembership
// DELETE /api/admin/memberships/{id} -> removeMembership

export class ApiValidationError extends Error {
  readonly errors: Record<string, string[]>

  constructor(message: string, errors: Record<string, string[]>) {
    super(message)
    this.name = 'ApiValidationError'
    this.errors = errors
  }
}

interface MembershipRecord {
  id: string
  status: AdminMembership['status']
  created_at: string
  user_id: string
  tenant_id: string
}

interface AdminMockStore {
  users: AdminUser[]
  tenants: AdminTenant[]
  memberships: MembershipRecord[]
  nextUserId: number
  nextTenantId: number
  nextMembershipId: number
}

declare global {
  var __tribunaAdminMock: AdminMockStore | undefined
}

const store: AdminMockStore = (globalThis.__tribunaAdminMock ??= {
  users: [],
  tenants: [],
  memberships: [],
  nextUserId: 1,
  nextTenantId: 1,
  nextMembershipId: 1,
})

const VALIDATION_MESSAGE = 'Revisá los datos enviados.'

function validationError(errors: Record<string, string[]>): ApiValidationError {
  return new ApiValidationError(VALIDATION_MESSAGE, errors)
}

function getUserById(id: string): AdminUser | undefined {
  return store.users.find((user) => user.id === id)
}

function getTenantBySlug(slug: string): AdminTenant | undefined {
  return store.tenants.find((tenant) => tenant.slug === slug)
}

export async function listUsers(): Promise<AdminUser[]> {
  return store.users.map((user) => ({ ...user }))
}

export async function createUser(fields: CreateUserFields): Promise<AdminUser> {
  const errors = validateUserFields(fields)
  const email = fields.email.trim().toLowerCase()

  if (store.users.some((user) => user.email.toLowerCase() === email)) {
    errors.email = ['Ya existe un usuario con este email.']
  }
  if (Object.keys(errors).length > 0) throw validationError(errors)

  const user: AdminUser = {
    id: `user_${store.nextUserId++}`,
    name: fields.name.trim(),
    email,
    is_platform_admin: false,
    created_at: new Date().toISOString(),
  }
  store.users.push(user)

  return { ...user }
}

export async function listTenants(): Promise<AdminTenant[]> {
  return store.tenants.map((tenant) => ({ ...tenant }))
}

export async function createTenant(
  fields: CreateTenantFields & { admin_user_id?: string },
): Promise<AdminTenant> {
  const slug = fields.slug
  const errors = validateTenantFields(fields)

  if (store.tenants.some((tenant) => tenant.slug === slug)) {
    errors.slug = ['Ya existe un club con este slug.']
  }
  if (fields.admin_user_id && !getUserById(fields.admin_user_id)) {
    errors.admin_user_id = ['El usuario seleccionado no existe.']
  }
  if (Object.keys(errors).length > 0) throw validationError(errors)

  const tenant: AdminTenant = {
    id: `tenant_${store.nextTenantId++}`,
    slug,
    name: fields.name.trim(),
    status: 'active',
    created_at: new Date().toISOString(),
  }
  store.tenants.push(tenant)

  if (fields.admin_user_id) {
    store.memberships.push({
      id: `membership_${store.nextMembershipId++}`,
      status: 'active',
      created_at: new Date().toISOString(),
      user_id: fields.admin_user_id,
      tenant_id: tenant.id,
    })
  }

  return { ...tenant }
}

export async function listMemberships(): Promise<AdminMembership[]> {
  return store.memberships.flatMap((membership) => {
    const user = getUserById(membership.user_id)
    const tenant = store.tenants.find((item) => item.id === membership.tenant_id)

    if (!user || !tenant) return []

    return [{
      id: membership.id,
      status: membership.status,
      created_at: membership.created_at,
      user: { id: user.id, name: user.name, email: user.email },
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
    }]
  })
}

export async function addMembership(fields: CreateMembershipFields): Promise<AdminMembership> {
  const errors = validateMembershipFields(fields)
  const user = getUserById(fields.user_id)
  const tenant = getTenantBySlug(fields.tenant_slug)

  if (fields.user_id && !user) errors.user_id = ['El usuario seleccionado no existe.']
  if (fields.tenant_slug && !tenant) errors.tenant_slug = ['El club seleccionado no existe.']

  if (
    user &&
    tenant &&
    store.memberships.some(
      (membership) => membership.user_id === user.id && membership.tenant_id === tenant.id,
    )
  ) {
    errors.user_id = ['Este usuario ya está asociado a ese club.']
  }
  if (Object.keys(errors).length > 0) throw validationError(errors)
  if (!user || !tenant) {
    throw validationError({
      ...(user ? {} : { user_id: ['El usuario seleccionado no existe.'] }),
      ...(tenant ? {} : { tenant_slug: ['El club seleccionado no existe.'] }),
    })
  }

  const membership: MembershipRecord = {
    id: `membership_${store.nextMembershipId++}`,
    status: 'active',
    created_at: new Date().toISOString(),
    user_id: user.id,
    tenant_id: tenant.id,
  }
  store.memberships.push(membership)

  return {
    id: membership.id,
    status: membership.status,
    created_at: membership.created_at,
    user: { id: user.id, name: user.name, email: user.email },
    tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
  }
}

export async function removeMembership(id: string): Promise<void> {
  const index = store.memberships.findIndex((membership) => membership.id === id)
  if (index < 0) {
    throw validationError({ membership_id: ['La asociación ya no existe.'] })
  }
  store.memberships.splice(index, 1)
}
