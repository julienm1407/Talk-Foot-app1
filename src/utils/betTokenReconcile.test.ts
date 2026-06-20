import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { UserAppStateV1 } from '../data/userAppStateDefaults'
import type { Bet } from '../types/bet'
import { reconcileBetTokenCredits } from './betTokenReconcile'

function baseApp(overrides: Partial<UserAppStateV1> = {}): UserAppStateV1 {
  return {
    fanPreferences: {},
    profile: { level: 1, xp: 0, ownedItemIds: [], equippedItems: { scarf: null, hat: null, jersey: null, accessory: null, pants: 'pants-kit', shoes: 'shoes-studs' } },
    wallet: { tokens: 100, medals: 0 },
    bets: [],
    ...overrides,
  }
}

function wonBet(overrides: Partial<Bet> = {}): Bet {
  return {
    id: 'bet-1',
    matchId: 'm1',
    market: 'result_1x2',
    selection: 'home',
    stake: 100,
    odds: 2.5,
    status: 'won',
    placedAt: '2026-06-19T08:00:00.000Z',
    settledAt: '2026-06-19T10:00:00.000Z',
    payout: 250,
    ...overrides,
  }
}

describe('reconcileBetTokenCredits', () => {
  it('crédite les jetons manquants pour un pari gagné récent', () => {
    const app = baseApp({
      wallet: { tokens: 70, medals: 0 },
      bets: [wonBet()],
    })
    const { app: next, tokenDelta, reconciledBetIds } = reconcileBetTokenCredits(
      app,
      1,
      { now: new Date('2026-06-20T12:00:00.000Z') },
    )
    assert.equal(tokenDelta, 250)
    assert.deepEqual(reconciledBetIds, ['bet-1'])
    assert.equal(next.wallet.tokens, 320)
    assert.equal(next.bets[0]?.tokenCreditApplied, true)
  })

  it('ne recrédite pas si le wallet couvre déjà le gain', () => {
    const app = baseApp({
      wallet: { tokens: 900, medals: 0 },
      bets: [wonBet()],
    })
    const { app: next, tokenDelta } = reconcileBetTokenCredits(app, 1, {
      now: new Date('2026-06-20T12:00:00.000Z'),
    })
    assert.equal(tokenDelta, 0)
    assert.equal(next.wallet.tokens, 900)
    assert.equal(next.bets[0]?.tokenCreditApplied, true)
  })

  it('ignore les paris déjà marqués tokenCreditApplied', () => {
    const app = baseApp({
      wallet: { tokens: 70, medals: 0 },
      bets: [wonBet({ tokenCreditApplied: true })],
    })
    const { tokenDelta } = reconcileBetTokenCredits(app, 1, {
      now: new Date('2026-06-20T12:00:00.000Z'),
    })
    assert.equal(tokenDelta, 0)
  })
})
