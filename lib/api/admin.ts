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
 * `PUT /admin/tenants/{tenant}`
 * Actualiza el club (nombre o cambio de estado active/suspended) usando el token de plataforma.
 */
export async function updateAdminTenant(
  tenantId: number,
  data: UpdateAdminTenantData,
): Promise<ApiResult<{ data: AdminTenant }>> {
  return apiFetch<{ data: AdminTenant }>(`/admin/tenants/${tenantId}`, {
    method: 'PUT',
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
