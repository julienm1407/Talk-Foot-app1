import { describe, expect, it } from 'vitest'
import { scorerLineupMatchesScoredGoal } from './liveFootballOdds'

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
