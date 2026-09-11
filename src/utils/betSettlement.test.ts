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

  it('reprend un buteur perdu à tort (matching corrigé)', () => {
    const bets: Bet[] = [
      {
        id: 'a',
        matchId: 'm1',
        market: 'anytime_scorer',
        selection: 'scor:home:ousmane-dembele',
        stake: 10,
        odds: 3,
        status: 'lost',
        placedAt: '2026-01-01T00:00:00.000Z',
        settledAt: '2026-01-01T02:00:00.000Z',
        payout: 0,
      },
    ]
    const { bets: next, tokenDelta, newlyWonBetIds } = settleWinningAnytimeScorersOnly(
      bets,
      'm1',
      [{ side: 'home', slug: 'ousmane-dembele', name: 'Ousmane Dembélé' }],
      1,
      { now: '2026-01-01T03:00:00.000Z' },
    )
    expect(next[0]?.status).toBe('won')
    expect(next[0]?.payout).toBe(30)
    expect(tokenDelta).toBeGreaterThan(0)
    expect(newlyWonBetIds).toEqual(['a'])
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

  it('gagne Dembélé même si l’événement but était au nom de famille seul (résolu)', () => {
    const bets = [openScorer({ id: 'a', selection: 'scor:home:ousmane-dembele' })]
    const { bets: next } = settleOpenBetsForMatch(
      bets,
      'm1',
      { home: 1, away: 0 },
      1,
      {
        scorerEvents: [{ side: 'home', slug: 'ousmane-dembele', name: 'Ousmane Dembélé' }],
        now: '2026-01-01T02:00:00.000Z',
      },
    )
    expect(next.find((b) => b.id === 'a')?.status).toBe('won')
  })
})
