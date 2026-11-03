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
  password?: string
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

/** `POST /admin/users/{user}/resend-invite` */
export async function resendAdminUserInvite(userId: number): Promise<ApiResult<{ message: string }>> {
  return apiFetch<{ message: string }>(`/admin/users/${userId}/resend-invite`, {
    method: 'POST',
    auth: 'platform',
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
  admin?: { name: string; email: string; password?: string }
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
   TICKETS DE CONTACTO / SOPORTE
   ========================================================================== */

export type SupportTicket = Schemas['SupportTicketResource']
export type TicketStatus = Schemas['TicketStatus']
export type SupportTicketStatus = TicketStatus

export type PaginatedAdminTickets = {
  data: SupportTicket[]
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

export type AdminTicketsSort = 'created_at' | '-created_at' | 'status' | '-status'

export type AdminTicketsQuery = {
  status?: TicketStatus
  per_page?: number
  page?: number
  sort?: AdminTicketsSort
}

export type UpdateAdminTicketData = Schemas['UpdateSupportTicketRequest']

/**
 * `GET /admin/tickets`
 * Listado paginado de tickets de soporte usando el token de plataforma.
 */
export async function getAdminTickets(
  query: AdminTicketsQuery = {},
): Promise<ApiResult<PaginatedAdminTickets>> {
  return apiFetch<PaginatedAdminTickets>('/admin/tickets', {
    method: 'GET',
    auth: 'platform',
    query: query as Record<string, string | number | boolean | undefined | null>,
  })
}

/**
 * `GET /admin/tickets/{ticket}`
 * Detalle de un ticket de soporte específico.
 */
export async function getAdminTicket(
  ticketId: number,
): Promise<ApiResult<{ data: SupportTicket }>> {
  return apiFetch<{ data: SupportTicket }>(`/admin/tickets/${ticketId}`, {
    method: 'GET',
    auth: 'platform',
  })
}

/**
 * `PATCH /admin/tickets/{ticket}`
 * Actualiza estado y notas internas de un ticket usando el token de plataforma.
 */
export async function updateAdminTicket(
  ticketId: number,
  data: UpdateAdminTicketData,
): Promise<ApiResult<{ data: SupportTicket }>> {
  return apiFetch<{ data: SupportTicket }>(`/admin/tickets/${ticketId}`, {
    method: 'PATCH',
    auth: 'platform',
    body: data,
  })
}

// Aliases para compatibilidad con código existente
export const listTickets = getAdminTickets
export const getTicket = getAdminTicket
export const updateTicket = updateAdminTicket

/* ==========================================================================
   MEMBRESÍAS (usuarios de un club)
   ========================================================================== */

export type AdminMembership = Schemas['TenantMembershipResource']
/** Rol del club (estándar o custom). Se asigna por `slug`. */
export type ClubRole = Schemas['ClubRoleResource']

/**
 * `GET /admin/tenants/{tenant}/roles`
 * Roles del club para asignar a sus miembros: primero los estándar. Vacío si el club no está activo.
 */
export async function getTenantRoles(tenantId: number): Promise<ApiResult<{ data: ClubRole[] }>> {
  return apiFetch<{ data: ClubRole[] }>(`/admin/tenants/${tenantId}/roles`, {
    method: 'GET',
    auth: 'platform',
  })
}

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

/** Módulo de la grilla de permisos, con sus recursos y acciones. */
export type PermissionModule = Schemas['PermissionModuleResource']
/** Permiso de un rol con su alcance: `all` (todo el club) u `own` (sus categorías). */
export type RolePermission = { name: string; scope: 'all' | 'own' }
export type RoleInput = { name: string; description?: string | null; permissions: RolePermission[] }

/**
 * `GET /admin/tenants/{tenant}/permissions`
 * Catálogo de permisos agrupado por módulo, para armar la grilla de checks.
 */
export async function getTenantPermissions(tenantId: number): Promise<ApiResult<{ data: PermissionModule[] }>> {
  return apiFetch<{ data: PermissionModule[] }>(`/admin/tenants/${tenantId}/permissions`, {
    method: 'GET',
    auth: 'platform',
  })
}

/**
 * `POST /admin/tenants/{tenant}/roles`
 * Crea un rol custom. 422 si el nombre se repite o un permiso no es válido.
 */
export async function createTenantRole(tenantId: number, data: RoleInput): Promise<ApiResult<{ data: ClubRole }>> {
  return apiFetch<{ data: ClubRole }>(`/admin/tenants/${tenantId}/roles`, {
    method: 'POST',
    auth: 'platform',
    body: data,
  })
}

/**
 * `PATCH /admin/tenants/{tenant}/roles/{role}`
 * Edita un rol custom (los permisos reemplazan la lista). 403 `role_is_system` si es estándar.
 */
export async function updateTenantRole(
  tenantId: number,
  slug: string,
  data: Partial<RoleInput>,
): Promise<ApiResult<{ data: ClubRole }>> {
  return apiFetch<{ data: ClubRole }>(`/admin/tenants/${tenantId}/roles/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    auth: 'platform',
    body: data,
  })
}

/**
 * `DELETE /admin/tenants/{tenant}/roles/{role}`
 * 403 `role_is_system` si es estándar; 409 `role_in_use` si alguien lo tiene.
 */
export async function deleteTenantRole(tenantId: number, slug: string): Promise<ApiResult<null>> {
  return apiFetch<null>(`/admin/tenants/${tenantId}/roles/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    auth: 'platform',
  })
}

/**
 * `POST /admin/tenants/{tenant}/roles/{role}/duplicate`
 * Copia un rol (estándar o custom) como rol custom nuevo ("Copia de …").
 */
export async function duplicateTenantRole(tenantId: number, slug: string): Promise<ApiResult<{ data: ClubRole }>> {
  return apiFetch<{ data: ClubRole }>(
    `/admin/tenants/${tenantId}/roles/${encodeURIComponent(slug)}/duplicate`,
    { method: 'POST', auth: 'platform' },
  )
}

/**
 * `POST /admin/tenants/{tenant}/memberships`
 * Asocia un usuario existente al club con uno o más roles del club (slugs). 422 si ya es miembro,
 * si un rol no existe o si el club no está activo.
 */
export async function createTenantMembership(
  tenantId: number,
  data: { user_id: number; roles: string[] },
): Promise<ApiResult<{ data: AdminMembership }>> {
  return apiFetch<{ data: AdminMembership }>(`/admin/tenants/${tenantId}/memberships`, {
    method: 'POST',
    auth: 'platform',
    body: data,
  })
}

/**
 * `PATCH /admin/tenants/{tenant}/memberships/{membership}`
 * Reemplaza los roles del miembro o activa/desactiva la membresía. Desactivar revoca los tokens del
 * usuario en ese club.
 */
export async function updateTenantMembership(
  tenantId: number,
  membershipId: number,
  data: { roles?: string[]; is_active?: boolean },
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
