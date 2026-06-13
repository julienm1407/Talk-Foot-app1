import { describe, expect, it } from 'vitest'
import {
  extractLiveMinuteFromSmFixture,
  liveClockPausedFromSmFixture,
  liveSecondHalfFromSmFixture,
} from './transformSportMonksToMatch'
import type { SmFixture } from './types'

describe('live clock from SportMonks fixture', () => {
  it('lit la minute depuis la période en cours', () => {
    const fx = {
      state: { id: 2, developer_name: 'INPLAY_1ST_HALF' },
      periods: [{ ticking: true, counts_from: 0, minutes: 23 }],
    } as SmFixture
    expect(extractLiveMinuteFromSmFixture(fx)).toBe(23)
    expect(liveClockPausedFromSmFixture(fx)).toBe(false)
    expect(liveSecondHalfFromSmFixture(fx)).toBe(false)
  })

  it('affiche mi-temps quand state HT et aucune période ticking', () => {
    const fx = {
      state: { id: 3, developer_name: 'HT', state: 'Half Time' },
      periods: [{ ticking: false, counts_from: 0, minutes: 47 }],
      minute: 45,
    } as SmFixture
    expect(liveClockPausedFromSmFixture(fx)).toBe(true)
    expect(liveSecondHalfFromSmFixture(fx)).toBe(false)
  })

  it('reprend en 2e période quand la période ticking repart à 45', () => {
    const fx = {
      state: { id: 22, developer_name: 'INPLAY_2ND_HALF' },
      periods: [{ ticking: true, counts_from: 45, minutes: 1 }],
    } as SmFixture
    expect(extractLiveMinuteFromSmFixture(fx)).toBe(46)
    expect(liveClockPausedFromSmFixture(fx)).toBe(false)
    expect(liveSecondHalfFromSmFixture(fx)).toBe(true)
  })

  it('ne devine pas la minute depuis starting_at sans données SM', () => {
    const fx = {
      starting_at_timestamp: Math.floor(Date.now() / 1000) - 3600,
      state: { id: 2, developer_name: 'INPLAY_1ST_HALF' },
    } as SmFixture
    expect(extractLiveMinuteFromSmFixture(fx)).toBe(0)
  })
})
