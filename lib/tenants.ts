/** Club tal como lo usa la UI: el perfil de `TenantSummaryResource` con valores por defecto. */
export type Tenant = {
  slug: string
  name: string
  short: string
  city: string
  founded: number | null
  color: string
  /** URL del escudo, o null si el club no subió uno. */
  logoUrl?: string | null
}

/** Club tal como llega de la API (`TenantSummaryResource`): el perfil puede estar incompleto. */
export type ApiTenant = {
  slug: string
  name: string
  short_name?: string | null
  city?: string | null
  founded_year?: number | null
  primary_color?: string | null
  logo_url?: string | null
}

const DEFAULT_COLOR = 'oklch(0.5 0.2 262)'

/** Lleva el club de la API al `Tenant` de la UI. Lo que falta del perfil se completa con valores genéricos. */
export function tenantFromApi(t: ApiTenant): Tenant {
  const initials = t.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 4)
    .toUpperCase()

  return {
    slug: t.slug,
    name: t.name,
    short: t.short_name || initials || t.slug.slice(0, 4).toUpperCase(),
    city: t.city ?? '',
    founded: t.founded_year ?? null,
    color: t.primary_color || DEFAULT_COLOR,
    logoUrl: t.logo_url ?? null,
  }
}
