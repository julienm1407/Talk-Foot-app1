import { describe, expect, it } from 'vitest'
import type { Highlight } from '../data/highlights'
import { resolveLiveScoreForBetting } from './liveBettingScore'

function goal(id: string, side: 'home' | 'away', minute: number): Highlight {
  return {
    id,
    type: 'But',
    side,
    minute,
    title: 'Goal',
    detail: '',
  }
}

describe('resolveLiveScoreForBetting', () => {
  it('prend le score officiel par défaut', () => {
    expect(
      resolveLiveScoreForBetting({
        officialHome: 1,
        officialAway: 0,
        fixture: null,
        highlights: [],
      }),
    ).toEqual({ home: 1, away: 0 })
  })

  it('monte le score dès que la timeline a plus de buts que le score officiel', () => {
    expect(
      resolveLiveScoreForBetting({
        officialHome: 1,
        officialAway: 1,
        fixture: null,
        highlights: [
          goal('sm-event-1', 'home', 45),
          goal('sm-event-2', 'home', 88),
        ],
      }),
    ).toEqual({ home: 2, away: 1 })
  })

  it('ignore les buts commentaire non structurés', () => {
    expect(
      resolveLiveScoreForBetting({
        officialHome: 0,
        officialAway: 0,
        fixture: null,
        highlights: [goal('sm-comment-1', 'home', 10)],
      }),
    ).toEqual({ home: 0, away: 0 })
  })
})
