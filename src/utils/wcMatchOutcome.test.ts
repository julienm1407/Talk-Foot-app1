import { describe, expect, it } from 'vitest'
import type { WcMatch } from '../types/wc2026'
import { resolveWcMatchOutcome } from './wcMatchOutcome'

function finishedMatch(partial: Partial<WcMatch>): WcMatch {
  return {
    id: 'm-test',
    round: 'r32',
    kickoffAt: '2026-07-01T18:00:00.000Z',
    status: 'finished',
    home: { label: 'A', goals: 1 },
    away: { label: 'B', goals: 1 },
    ...partial,
  }
}

describe('resolveWcMatchOutcome', () => {
  it('départage Pays-Bas – Maroc 1-1 (2-3 TAB)', () => {
    const outcome = resolveWcMatchOutcome(
      finishedMatch({
        home: { label: 'Pays-Bas', goals: 1, penaltyGoals: 2 },
        away: { label: 'Maroc', goals: 1, penaltyGoals: 3 },
      }),
    )
    expect(outcome.winner).toBe('away')
    expect(outcome.decidedOnPenalties).toBe(true)
    expect(outcome.penaltyShootout).toEqual({ home: 2, away: 3 })
  })

  it('départage un 1-1 aux tirs au but', () => {
    const outcome = resolveWcMatchOutcome(
      finishedMatch({
        home: { label: 'Allemagne', goals: 1, penaltyGoals: 3 },
        away: { label: 'Paraguay', goals: 1, penaltyGoals: 4 },
      }),
    )
    expect(outcome.decidedOnPenalties).toBe(true)
    expect(outcome.winner).toBe('away')
    expect(outcome.penaltyShootout).toEqual({ home: 3, away: 4 })
  })

  it('garde le vainqueur au score réglementaire sans TAB', () => {
    const outcome = resolveWcMatchOutcome(
      finishedMatch({
        home: { label: 'Espagne', goals: 2 },
        away: { label: 'Autriche', goals: 1 },
      }),
    )
    expect(outcome.decidedOnPenalties).toBe(false)
    expect(outcome.winner).toBe('home')
  })
})
