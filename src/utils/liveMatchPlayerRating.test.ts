import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { computeLiveMatchPlayerRating, isOfficialSmRating } from './liveMatchPlayerRating'

describe('computeLiveMatchPlayerRating', () => {
  it('garde la note SportMonks si elle est là', () => {
    assert.equal(computeLiveMatchPlayerRating({ smRating: 7.4, goals: 2 }), 7.4)
    assert.equal(isOfficialSmRating(0), false)
  })

  it('part de 6.0 et monte sur un but', () => {
    assert.equal(computeLiveMatchPlayerRating({}), 6)
    assert.equal(computeLiveMatchPlayerRating({ goals: 1 }), 6.9)
  })

  it('baisse sur carton rouge / CSC', () => {
    assert.equal(computeLiveMatchPlayerRating({ redCards: 1 }), 4.6)
    assert.equal(computeLiveMatchPlayerRating({ ownGoals: 1 }), 5.2)
  })
})
