export type Sport = 'Básquet' | 'Fútbol' | 'Vóley'

export type Tenant = {
  slug: string
  name: string
  short: string
  city: string
  founded: number
  color: string
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

type TenantSource = {
  slug: string
  name: string
  short?: string | null
  city?: string | null
  founded?: number | null
  color?: string | null
  sports?: Sport[] | null
  members?: number | null
  short_name?: string | null
  founded_year?: number | null
  primary_color?: string | null
}

/**
 * Normaliza un club proveniente de la API ({ slug, name }) asignando valores
 * genéricos por defecto (color, city, sports, etc.) para que la UI no se rompa
 * mientras la API no provea dichos atributos (FRO-8).
 */
export function normalizeTenant(t: TenantSource): Tenant {
  const normalizedSlug = t.slug.replace(/_/g, '-')
  const found = TENANTS.find((mock) => mock.slug === t.slug || mock.slug === normalizedSlug)

  const nameInitials = t.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 4)
    .toUpperCase()

  const short = t.short ?? t.short_name ?? found?.short ?? (nameInitials || t.slug.slice(0, 4).toUpperCase())

  return {
    slug: t.slug,
    name: t.name,
    short,
    city: t.city ?? found?.city ?? 'Sede central',
    founded: t.founded ?? t.founded_year ?? found?.founded ?? 2026,
    color: t.color ?? t.primary_color ?? found?.color ?? 'oklch(0.5 0.2 262)',
    sports: t.sports ?? found?.sports ?? ['Básquet', 'Fútbol', 'Vóley'],
    members: t.members ?? found?.members ?? 1200,
  }
}

export function getTenant(slug: string): Tenant | undefined {
  return normalizeTenant({ slug, name: slug })
}
