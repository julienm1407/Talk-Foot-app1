import { describe, expect, it } from 'vitest'
import type { Match } from '../types/match'
import {
  nationFeaturedMatch,
  nationLiveMatch,
  nationUpcomingMatches,
} from './resolveMatchNation'

function wcMatch(partial: Partial<Match> & Pick<Match, 'id' | 'kickoffAt' | 'home' | 'away'>): Match {
  return {
    competition: { id: 'wc-2026', name: 'Coupe du Monde 2026' },
    status: 'upcoming',
    ...partial,
  }
}

describe('nationUpcomingMatches', () => {
  const now = Date.parse('2026-06-28T12:00:00.000Z')

  const franceSenegal = wcMatch({
    id: 'm-1',
    kickoffAt: '2026-06-21T19:00:00.000Z',
    status: 'finished',
    home: { id: 'fra', name: 'France', shortName: 'FRA' },
    away: { id: 'sen', name: 'Sénégal', shortName: 'SEN' },
  })
  const franceMorocco = wcMatch({
    id: 'm-2',
    kickoffAt: '2026-07-04T19:00:00.000Z',
    home: { id: 'fra', name: 'France', shortName: 'FRA' },
    away: { id: 'mar', name: 'Maroc', shortName: 'MAR' },
  })
  const staleUpcoming = wcMatch({
    id: 'm-3',
    kickoffAt: '2026-06-22T19:00:00.000Z',
    home: { id: 'fra', name: 'France', shortName: 'FRA' },
    away: { id: 'irq', name: 'Irak', shortName: 'IRQ' },
  })

  it('ne garde que les matchs réellement à venir pour la France', () => {
    const list = nationUpcomingMatches(
      [franceSenegal, franceMorocco, staleUpcoming],
      'FRA',
      now,
    )
    expect(list.map((m) => m.id)).toEqual(['m-2'])
  })

  it('met en avant le live puis le prochain match', () => {
    const live = { ...franceMorocco, status: 'live' as const }
    expect(nationLiveMatch([live, franceSenegal], 'MAR')).toBe(live)
    expect(nationFeaturedMatch([franceSenegal, franceMorocco], 'FRA', now)?.id).toBe('m-2')
    expect(nationFeaturedMatch([live, franceMorocco], 'FRA', now)?.id).toBe('m-2')
  })
})
