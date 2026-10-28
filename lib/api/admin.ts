import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'

/* ==========================================================================
   USUARIOS
   ========================================================================== */

export type AdminUser = Schemas['App.Http.Resources.Admin.UserResource']

export type PaginatedAdminUsers = {
  data: AdminUser[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    links: {
      url: string | null
      label: string
      active: boolean
    }[]
    path: string | null
    per_page: number
    to: number | null
    total: number
  }
}

export type AdminUsersSort = 'name' | 'email' | 'created_at' | '-name' | '-email' | '-created_at'

export type AdminUsersQuery = {
  search?: string
  is_active?: boolean
  per_page?: number
  page?: number
  sort?: AdminUsersSort
}

export type CreateAdminUserData = {
  name: string
  email: string
  password: string
  is_platform_admin?: string
  is_active?: string
}

export type UpdateAdminUserData = {
  name?: string
  email?: string
  password?: string
  is_active?: boolean
  is_platform_admin?: string
}

/**
 * `GET /admin/users`
 * Obtiene el listado paginado de usuarios usando el token de plataforma.
 */
export async function getAdminUsers(query?: AdminUsersQuery): Promise<ApiResult<PaginatedAdminUsers>> {
  return apiFetch<PaginatedAdminUsers>('/admin/users', {
    method: 'GET',
    auth: 'platform',
    query: query as Record<string, string | number | boolean | undefined | null>,
  })
}

/**
 * `POST /admin/users`
 * Da de alta un nuevo usuario usando el token de plataforma.
 */
export async function createAdminUser(
  data: CreateAdminUserData,
): Promise<ApiResult<{ data: AdminUser }>> {
  return apiFetch<{ data: AdminUser }>('/admin/users', {
    method: 'POST',
    auth: 'platform',
    body: data,
  })
}

/**
 * `PATCH /admin/users/{user}`
 * Actualiza un usuario (por ej. activar/desactivar) usando el token de plataforma.
 */
export async function updateAdminUser(
  userId: number,
  data: UpdateAdminUserData,
): Promise<ApiResult<{ data: AdminUser }>> {
  return apiFetch<{ data: AdminUser }>(`/admin/users/${userId}`, {
    method: 'PATCH',
    auth: 'platform',
    body: data,
  })
}

/* ==========================================================================
   CLUBES (TENANTS)
   ========================================================================== */

export type AdminTenant = Schemas['TenantResource']
export type TenantStatus = Schemas['TenantStatus']

export type PaginatedAdminTenants = {
  data: AdminTenant[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    links: {
      url: string | null
      label: string
      active: boolean
    }[]
    path: string | null
    per_page: number
    to: number | null
    total: number
  }
}

export type AdminTenantsSort =
  | 'name'
  | 'slug'
  | 'status'
  | 'created_at'
  | '-name'
  | '-slug'
  | '-status'
  | '-created_at'

export type AdminTenantsQuery = {
  search?: string
  status?: TenantStatus
  per_page?: number
  page?: number
  sort?: AdminTenantsSort
}

export type CreateAdminTenantData = {
  name: string
  slug: string
  /** Opcional: se crea este usuario y se lo asocia al club como administrador. */
  admin?: { name: string; email: string; password: string }
}

export type UpdateAdminTenantData = {
  name?: string
  status?: 'active' | 'suspended'
}

/**
 * `GET /admin/tenants`
 * Obtiene el listado paginado de clubes usando el token de plataforma.
 */
export async function getAdminTenants(
  query?: AdminTenantsQuery,
): Promise<ApiResult<PaginatedAdminTenants>> {
  return apiFetch<PaginatedAdminTenants>('/admin/tenants', {
    method: 'GET',
    auth: 'platform',
    query: query as Record<string, string | number | boolean | undefined | null>,
  })
}

/**
 * `POST /admin/tenants`
 * Da de alta un nuevo club usando el token de plataforma.
 */
export async function createAdminTenant(
  data: CreateAdminTenantData,
): Promise<ApiResult<{ data: AdminTenant }>> {
  return apiFetch<{ data: AdminTenant }>('/admin/tenants', {
    method: 'POST',
    auth: 'platform',
    body: data,
  })
}

/**
 * `GET /admin/tenants/{tenant}`
 * Detalle de un club. Lo usa la pantalla del club y el polling del estado.
 */
export async function getAdminTenant(tenantId: number): Promise<ApiResult<{ data: AdminTenant }>> {
  return apiFetch<{ data: AdminTenant }>(`/admin/tenants/${tenantId}`, {
    method: 'GET',
    auth: 'platform',
  })
}

/**
 * `PATCH /admin/tenants/{tenant}`
 * Actualiza el club (nombre o cambio de estado active/suspended) usando el token de plataforma.
 */
export async function updateAdminTenant(
  tenantId: number,
  data: UpdateAdminTenantData,
): Promise<ApiResult<{ data: AdminTenant }>> {
  return apiFetch<{ data: AdminTenant }>(`/admin/tenants/${tenantId}`, {
    method: 'PATCH',
    auth: 'platform',
    body: data,
  })
}

/**
 * `POST /admin/tenants/{tenant}/retry`
 * Reintenta el aprovisionamiento de un club en estado fallido (failed).
 */
export async function retryAdminTenant(
  tenantId: number,
): Promise<ApiResult<{ data: AdminTenant }>> {
  return apiFetch<{ data: AdminTenant }>(`/admin/tenants/${tenantId}/retry`, {
    method: 'POST',
    auth: 'platform',
  })
}

/* ==========================================================================
   MEMBRESÍAS (usuarios de un club)
   ========================================================================== */

export type AdminMembership = Schemas['TenantMembershipResource']
export type MembershipRole = Schemas['MembershipRole']

export type PaginatedAdminMemberships = Omit<PaginatedAdminUsers, 'data'> & {
  data: AdminMembership[]
}

export type AdminMembershipsQuery = {
  is_active?: boolean
  per_page?: number
  page?: number
}

/**
 * `GET /admin/tenants/{tenant}/memberships`
 * Miembros del club, paginados, con el nombre y el email de cada usuario.
 */
export async function getTenantMemberships(
  tenantId: number,
  query?: AdminMembershipsQuery,
): Promise<ApiResult<PaginatedAdminMemberships>> {
  return apiFetch<PaginatedAdminMemberships>(`/admin/tenants/${tenantId}/memberships`, {
    method: 'GET',
    auth: 'platform',
    query,
  })
}

/**
 * `POST /admin/tenants/{tenant}/memberships`
 * Asocia un usuario existente al club. 422 si ya es miembro.
 */
export async function createTenantMembership(
  tenantId: number,
  data: { user_id: number; role: MembershipRole },
): Promise<ApiResult<{ data: AdminMembership }>> {
  return apiFetch<{ data: AdminMembership }>(`/admin/tenants/${tenantId}/memberships`, {
    method: 'POST',
    auth: 'platform',
    body: data,
  })
}

/**
 * `PATCH /admin/tenants/{tenant}/memberships/{membership}`
 * Cambia el rol o activa/desactiva la membresía. Desactivar revoca los tokens del usuario en ese club.
 */
export async function updateTenantMembership(
  tenantId: number,
  membershipId: number,
  data: { role?: MembershipRole; is_active?: boolean },
): Promise<ApiResult<{ data: AdminMembership }>> {
  return apiFetch<{ data: AdminMembership }>(
    `/admin/tenants/${tenantId}/memberships/${membershipId}`,
    {
      method: 'PATCH',
      auth: 'platform',
      body: data,
    },
  )
}

/**
 * `GET /admin/users/{user}/memberships`
 * Clubes de un usuario (sus membresías con el club en cada una), sin clubes dados de baja.
 */
export async function getUserMemberships(
  userId: number,
  query?: AdminMembershipsQuery,
): Promise<ApiResult<PaginatedAdminMemberships>> {
  return apiFetch<PaginatedAdminMemberships>(`/admin/users/${userId}/memberships`, {
    method: 'GET',
    auth: 'platform',
    query,
  })
}
