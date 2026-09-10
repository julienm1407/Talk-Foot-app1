import { describe, expect, it } from 'vitest'
import type { Match } from '../types/match'
import { sortUpcomingMatchesFavoriteFirst } from './sortMatchesFavoriteFirst'

function team(id: string) {
  return {
    id,
    name: id,
    shortName: id.slice(0, 3).toUpperCase(),
    colors: { primary: '#000', secondary: '#fff' },
  }
}

function upcoming(partial: {
  id: string
  kickoffAt: string
  home: string
  away: string
}): Match {
  return {
    id: partial.id,
    status: 'upcoming',
    kickoffAt: partial.kickoffAt,
    home: team(partial.home),
    away: team(partial.away),
    competition: { id: 'ligue1', name: 'Ligue 1', shortName: 'L1' },
    minute: 0,
    score: { home: 0, away: 0 },
  }
}

describe('sortUpcomingMatchesFavoriteFirst', () => {
  it('priorise le club de cœur seulement dans le prochain jour de matchs', () => {
    const matches = [
      upcoming({
        id: 'wed-om',
        kickoffAt: '2026-09-09T19:00:00.000Z', // mercredi soir
        home: 'om',
        away: 'ol',
      }),
      upcoming({
        id: 'wed-lille',
        kickoffAt: '2026-09-09T17:00:00.000Z',
        home: 'lille',
        away: 'rennes',
      }),
      upcoming({
        id: 'sun-psg',
        kickoffAt: '2026-09-13T19:00:00.000Z', // dimanche
        home: 'psg',
        away: 'monaco',
      }),
      upcoming({
        id: 'wed-psg',
        kickoffAt: '2026-09-09T20:00:00.000Z',
        home: 'psg',
        away: 'nice',
      }),
    ]

    const sorted = sortUpcomingMatchesFavoriteFirst(matches, ['psg'])
    expect(sorted.map((m) => m.id)).toEqual(['wed-psg', 'wed-lille', 'wed-om', 'sun-psg'])
  })

  it('ne remonte pas un favori lointain s’il ne joue pas le prochain créneau', () => {
    const matches = [
      upcoming({
        id: 'wed-a',
        kickoffAt: '2026-09-09T18:00:00.000Z',
        home: 'om',
        away: 'ol',
      }),
      upcoming({
        id: 'wed-b',
        kickoffAt: '2026-09-09T20:00:00.000Z',
        home: 'lille',
        away: 'rennes',
      }),
      upcoming({
        id: 'sun-psg',
        kickoffAt: '2026-09-13T19:00:00.000Z',
        home: 'psg',
        away: 'monaco',
      }),
    ]

    const sorted = sortUpcomingMatchesFavoriteFirst(matches, ['psg'])
    expect(sorted.map((m) => m.id)).toEqual(['wed-a', 'wed-b', 'sun-psg'])
  })

  it('reste chronologique sans favori', () => {
    const matches = [
      upcoming({
        id: 'b',
        kickoffAt: '2026-09-10T20:00:00.000Z',
        home: 'om',
        away: 'ol',
      }),
      upcoming({
        id: 'a',
        kickoffAt: '2026-09-09T18:00:00.000Z',
        home: 'psg',
        away: 'nice',
      }),
    ]
    expect(sortUpcomingMatchesFavoriteFirst(matches, []).map((m) => m.id)).toEqual(['a', 'b'])
  })
})
