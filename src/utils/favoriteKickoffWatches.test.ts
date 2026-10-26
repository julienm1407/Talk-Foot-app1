import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Match } from '../types/match'
import { buildKickoffWatches, favoriteClubKickoffWatches } from './favoriteKickoffWatches'

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
  it('ne retient que les matchs des clubs favoris encore à venir (1 h + coup d’envoi)', () => {
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
    assert.equal(watches.length, 2)
    assert.equal(watches[0]?.matchId, 'a')
    assert.equal(watches[0]?.kind, 't60')
    assert.equal(watches[0]?.href, '/channel/a')
    assert.equal(watches[0]?.fireAtMs, Date.parse('2026-09-22T19:00:00.000Z'))
    assert.equal(watches[1]?.kind, 'kickoff')
    assert.equal(watches[1]?.fireAtMs, Date.parse('2026-09-22T20:00:00.000Z'))
  })

  it('n’envoie plus le rappel 1 h si le coup d’envoi est trop proche', () => {
    const now = Date.parse('2026-09-22T19:30:00.000Z')
    const watches = favoriteClubKickoffWatches(
      [m({ id: 'a', kickoffAt: '2026-09-22T20:00:00.000Z' })],
      ['psg'],
      now,
    )
    assert.equal(watches.length, 1)
    assert.equal(watches[0]?.kind, 'kickoff')
  })

  it('inclut un match étoilé même sans club favori', () => {
    const now = Date.parse('2026-09-22T12:00:00.000Z')
    const watches = buildKickoffWatches(
      [
        m({
          id: 'ol-om',
          kickoffAt: '2026-09-22T21:00:00.000Z',
          home: {
            id: 'ol',
            name: 'Lyon',
            shortName: 'OL',
            colors: { primary: '#a00', secondary: '#fff' },
          },
        }),
      ],
      { favoriteMatchIds: ['ol-om'] },
      now,
    )
    assert.equal(watches.filter((w) => w.kind === 't60').length, 1)
    assert.match(watches.find((w) => w.kind === 't60')?.body ?? '', /suivi/)
  })

  it('inclut les matchs du club d’un joueur suivi', () => {
    const now = Date.parse('2026-09-22T12:00:00.000Z')
    const watches = buildKickoffWatches(
      [m({ id: 'a', kickoffAt: '2026-09-22T20:00:00.000Z' })],
      { favoritePlayerTeamIds: ['psg'] },
      now,
    )
    assert.equal(watches.length, 2)
    assert.equal(watches[0]?.matchId, 'a')
  })
})
