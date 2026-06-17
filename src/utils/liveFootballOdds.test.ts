import { describe, expect, it } from 'vitest'
import { groupGoalRowsForHeader, scorerLineupMatchesScoredGoal } from './liveFootballOdds'

describe('scorerLineupMatchesScoredGoal', () => {
  it('matche le bon Neves après un but de João', () => {
    const goal = { slug: 'neves', name: 'Joao Neves' }
    expect(scorerLineupMatchesScoredGoal('joao-neves', goal)).toBe(true)
    expect(scorerLineupMatchesScoredGoal('ruben-neves', goal)).toBe(false)
  })

  it('matche avec slug complet du buteur', () => {
    const goal = { slug: 'joao-neves', name: 'Joao Neves' }
    expect(scorerLineupMatchesScoredGoal('joao-neves', goal)).toBe(true)
    expect(scorerLineupMatchesScoredGoal('ruben-neves', goal)).toBe(false)
  })

  it('ne confond pas deux homonymes sans prénom côté but', () => {
    const goal = { slug: 'neves', name: 'Neves' }
    expect(scorerLineupMatchesScoredGoal('joao-neves', goal)).toBe(false)
    expect(scorerLineupMatchesScoredGoal('ruben-neves', goal)).toBe(false)
    expect(scorerLineupMatchesScoredGoal('neves', goal)).toBe(true)
  })
})

describe('groupGoalRowsForHeader', () => {
  it('regroupe les buts du même joueur avec minutes triées', () => {
    const grouped = groupGoalRowsForHeader([
      { name: 'Neves', minute: 67, inSecondHalf: true },
      { name: 'Neves', minute: 23 },
      { name: 'Mbappé', minute: 45, inSecondHalf: true },
    ])
    expect(grouped).toEqual([
      { name: 'Neves', minutes: [{ minute: 23, inSecondHalf: undefined }, { minute: 67, inSecondHalf: true }], ownGoal: undefined },
      { name: 'Mbappé', minutes: [{ minute: 45, inSecondHalf: true }], ownGoal: undefined },
    ])
  })

  it('sépare CSC et but normal du même joueur', () => {
    const grouped = groupGoalRowsForHeader([
      { name: 'Silva', minute: 12, ownGoal: true },
      { name: 'Silva', minute: 55 },
    ])
    expect(grouped).toHaveLength(2)
    expect(grouped[0]).toMatchObject({ name: 'Silva', ownGoal: true, minutes: [{ minute: 12 }] })
    expect(grouped[1]).toMatchObject({ name: 'Silva', ownGoal: undefined, minutes: [{ minute: 55 }] })
  })
})
