export type Sport = 'Básquet' | 'Fútbol' | 'Vóley'

export type Tenant = {
  slug: string
  name: string
  short: string
  city: string
  founded: number | null
  color: string
  /** URL del escudo, o null si el club no subió uno. */
  logoUrl?: string | null
  sports: Sport[]
  members: number
}

export const TENANTS: Tenant[] = [
  {
    slug: 'villa-real',
    name: 'Club Atlético Villa Real',
    short: 'CAVR',
    city: 'Villa Real, CABA',
    founded: 1931,
    color: 'oklch(0.5 0.2 262)',
    sports: ['Básquet', 'Fútbol', 'Vóley'],
    members: 1240,
  },
  {
    slug: 'los-aromos',
    name: 'Sportivo Los Aromos',
    short: 'SLA',
    city: 'Banfield, Buenos Aires',
    founded: 1948,
    color: 'oklch(0.5 0.13 158)',
    sports: ['Básquet', 'Fútbol'],
    members: 860,
  },
  {
    slug: 'belgrano-sur',
    name: 'Unión Deportiva Belgrano Sur',
    short: 'UDBS',
    city: 'Rosario, Santa Fe',
    founded: 1922,
    color: 'oklch(0.54 0.2 25)',
    sports: ['Fútbol', 'Vóley', 'Básquet'],
    members: 2105,
  },
]

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

/**
 * Lleva el club de la API al `Tenant` que usa la UI. El perfil (sigla, ciudad, fundación, color y
 * escudo) sale de la API; lo que falta se completa con valores genéricos. Los deportes y los
 * miembros todavía vienen de los mocks hasta que cada módulo use la API (FRO-15).
 */
export function normalizeTenant(t: ApiTenant | Tenant): Tenant {
  if ('short' in t) return t

  const normalizedSlug = t.slug.replace(/_/g, '-')
  const found = TENANTS.find((mock) => mock.slug === t.slug || mock.slug === normalizedSlug)

  const nameInitials = t.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 4)
    .toUpperCase()

  return {
    slug: t.slug,
    name: t.name,
    short: t.short_name || nameInitials || t.slug.slice(0, 4).toUpperCase(),
    city: t.city ?? '',
    founded: t.founded_year ?? null,
    color: t.primary_color || DEFAULT_COLOR,
    logoUrl: t.logo_url ?? null,
    sports: found?.sports ?? ['Básquet', 'Fútbol', 'Vóley'],
    members: found?.members ?? 0,
  }
}

