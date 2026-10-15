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

export function getTenant(slug: string) {
  return TENANTS.find((t) => t.slug === slug)
}
