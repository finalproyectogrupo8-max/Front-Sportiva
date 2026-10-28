import 'server-only'

import { apiFetch, type ApiResult, type Schemas } from './client'

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

