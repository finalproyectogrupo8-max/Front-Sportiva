import { describe, expect, it } from 'vitest'
import { pickSeason, seasonsForSport } from '@/lib/seasons'

const seasons = [
  { id: 1, sport_id: null, status: 'closed' },
  { id: 2, sport_id: 10, status: 'active' },
  { id: 3, sport_id: 20, status: 'active' },
]

describe('seasonsForSport', () => {
  it('ofrece las temporadas del deporte y las de todo el club, nunca las de otro deporte', () => {
    expect(seasonsForSport(seasons, 10).map((s) => s.id)).toEqual([1, 2])
    expect(seasonsForSport(seasons, null).map((s) => s.id)).toEqual([1])
  })
})

describe('pickSeason', () => {
  it('mantiene la elegida si sirve y si no, elige la en curso', () => {
    const football = seasonsForSport(seasons, 10)
    expect(pickSeason(football, '1')).toBe('1')
    expect(pickSeason(football, '3')).toBe('2')
    expect(pickSeason([], '3')).toBe('')
  })
})
