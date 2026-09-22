import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Match } from '../types/match'
import { favoriteClubKickoffWatches } from './favoriteKickoffWatches'

function m(partial: Partial<Match> & Pick<Match, 'id' | 'kickoffAt'>): Match {
  return {
    competition: { id: 'l1', name: 'Ligue 1', shortName: 'L1' },
    home: {
      id: 'psg',
      name: 'Paris SG',
      shortName: 'PSG',
      colors: { primary: '#004', secondary: '#fff' },
    },
    away: {
      id: 'om',
      name: 'Marseille',
      shortName: 'OM',
      colors: { primary: '#00a', secondary: '#fff' },
    },
    status: 'upcoming',
    ...partial,
  }
}

describe('favoriteClubKickoffWatches', () => {
  it('ne retient que les matchs des clubs favoris encore à venir', () => {
    const now = Date.parse('2026-09-22T12:00:00.000Z')
    const watches = favoriteClubKickoffWatches(
      [
        m({ id: 'a', kickoffAt: '2026-09-22T20:00:00.000Z' }),
        m({
          id: 'b',
          kickoffAt: '2026-09-22T21:00:00.000Z',
          home: {
            id: 'ol',
            name: 'Lyon',
            shortName: 'OL',
            colors: { primary: '#a00', secondary: '#fff' },
          },
        }),
        m({ id: 'c', kickoffAt: '2026-09-22T11:00:00.000Z', status: 'finished' }),
      ],
      ['psg'],
      now,
    )
    assert.equal(watches.length, 1)
    assert.equal(watches[0]?.matchId, 'a')
    assert.equal(watches[0]?.href, '/channel/a')
    assert.equal(watches[0]?.fireAtMs, Date.parse('2026-09-22T19:45:00.000Z'))
  })
})
