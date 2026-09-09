import { describe, expect, it } from 'vitest'
import type { Bet } from '../types/bet'
import { settleOpenBetsForMatch, settleWinningAnytimeScorersOnly } from './betSettlement'

function openScorer(partial: Partial<Bet> & Pick<Bet, 'id' | 'selection'>): Bet {
  return {
    matchId: 'm1',
    market: 'anytime_scorer',
    stake: 10,
    odds: 3,
    status: 'open',
    placedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('settleWinningAnytimeScorersOnly', () => {
  it('valide le buteur gagnant sans perdre les autres', () => {
    const bets = [
      openScorer({ id: 'a', selection: 'scor:home:ferran-torres' }),
      openScorer({ id: 'b', selection: 'scor:away:mbappe' }),
      openScorer({
        id: 'c',
        matchId: 'm2',
        selection: 'scor:home:ferran-torres',
      }),
    ]
    const { bets: next, tokenDelta, newlyWonBetIds } = settleWinningAnytimeScorersOnly(
      bets,
      'm1',
      [{ side: 'home', slug: 'ferran-torres', name: 'Ferran Torres' }],
      1,
      { now: '2026-01-01T01:00:00.000Z' },
    )
    expect(next.find((b) => b.id === 'a')?.status).toBe('won')
    expect(next.find((b) => b.id === 'b')?.status).toBe('open')
    expect(next.find((b) => b.id === 'c')?.status).toBe('open')
    expect(newlyWonBetIds).toEqual(['a'])
    expect(tokenDelta).toBeGreaterThan(0)
  })

  it('ne change rien sans événements buteur', () => {
    const bets = [openScorer({ id: 'a', selection: 'scor:home:ferran-torres' })]
    const res = settleWinningAnytimeScorersOnly(bets, 'm1', [], 1)
    expect(res.bets).toBe(bets)
    expect(res.tokenDelta).toBe(0)
  })
})

describe('settleOpenBetsForMatch anytime_scorer', () => {
  it('perd les buteurs non marqueurs en fin de match', () => {
    const bets = [
      openScorer({ id: 'a', selection: 'scor:home:ferran-torres' }),
      openScorer({ id: 'b', selection: 'scor:away:mbappe' }),
    ]
    const { bets: next } = settleOpenBetsForMatch(
      bets,
      'm1',
      { home: 1, away: 0 },
      1,
      {
        scorerEvents: [{ side: 'home', slug: 'ferran-torres' }],
        now: '2026-01-01T02:00:00.000Z',
      },
    )
    expect(next.find((b) => b.id === 'a')?.status).toBe('won')
    expect(next.find((b) => b.id === 'b')?.status).toBe('lost')
  })
})
