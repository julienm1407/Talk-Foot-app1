import { describe, expect, it } from 'vitest'
import { normalizeSmFixtureIncludes } from './normalizeSmFixtureIncludes'
import { extractLiveMinuteFromSmFixture } from './transformSportMonksToMatch'
import type { SmFixture } from './types'

describe('normalizeSmFixtureIncludes', () => {
  it('déplie periods/events imbriqués dans data', () => {
    const fx = normalizeSmFixtureIncludes({
      id: 1,
      periods: { data: [{ ticking: true, counts_from: 0, minutes: 18 }] },
      events: {
        data: [
          {
            id: 99,
            minute: 18,
            type: { developer_name: 'PENALTY' },
            player: { display_name: 'Embolo' },
          },
        ],
      },
    } as unknown as SmFixture)
    expect(fx?.periods?.length).toBe(1)
    expect(fx?.events?.length).toBe(1)
    expect(extractLiveMinuteFromSmFixture(fx!)).toBe(18)
  })
})
