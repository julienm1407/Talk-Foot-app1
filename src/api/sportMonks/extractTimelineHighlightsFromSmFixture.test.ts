import { describe, expect, it } from 'vitest'
import {
  goalEventIdentityKey,
  goalSemanticKey,
} from './extractTimelineHighlightsFromSmFixture'
import type { Highlight } from '../../types/match'

function goalHighlight(
  partial: Partial<Highlight> & Pick<Highlight, 'minute' | 'scorerName'>,
): Highlight {
  return {
    id: partial.id ?? `sm-event-${partial.minute}`,
    matchId: 'm1',
    minute: partial.minute,
    type: 'But',
    title: partial.scorerName,
    detail: `${partial.minute}' · ${partial.scorerName}`,
    side: partial.side ?? 'home',
    scorerName: partial.scorerName,
    ...partial,
  }
}

describe('goalEventIdentityKey', () => {
  it('distingue deux buts du même joueur à des minutes différentes', () => {
    const first = goalHighlight({ minute: 8, scorerName: 'Harry Kane' })
    const second = goalHighlight({ minute: 67, scorerName: 'Harry Kane', inSecondHalf: true })
    expect(goalEventIdentityKey(first)).toBe('home|kane|8')
    expect(goalEventIdentityKey(second)).toBe('home|kane|67')
    expect(goalEventIdentityKey(first)).not.toBe(goalEventIdentityKey(second))
  })

  it('garde une clé lâche pour rapprocher commentaire et événement', () => {
    const event = goalHighlight({ minute: 8, scorerName: 'Harry Kane' })
    const comment = goalHighlight({
      id: 'sm-comment-1',
      minute: 7,
      scorerName: 'Harry Kane',
    })
    expect(goalSemanticKey(event)).toBe('home|kane')
    expect(goalSemanticKey(comment)).toBe('home|kane')
    expect(goalEventIdentityKey(event)).not.toBe(goalEventIdentityKey(comment))
  })
})
