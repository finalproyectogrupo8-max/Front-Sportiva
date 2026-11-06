import type { Season } from '@/lib/api/club'

/** Las temporadas que puede usar un deporte: las suyas y las de todo el club (sin deporte). */
export function seasonsForSport<T extends Pick<Season, 'sport_id'>>(seasons: T[], sportId: number | null): T[] {
  return seasons.filter((season) => season.sport_id == null || season.sport_id === sportId)
}

/** Mantiene la temporada elegida si sirve para el deporte; si no, la en curso o la primera. */
export function pickSeason(seasons: Pick<Season, 'id' | 'status'>[], current: string): string {
  if (seasons.some((season) => String(season.id) === current)) return current
  const season = seasons.find((s) => s.status === 'active') ?? seasons[0]
  return season ? String(season.id) : ''
}
