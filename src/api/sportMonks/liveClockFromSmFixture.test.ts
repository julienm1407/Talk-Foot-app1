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

  it('detecte mi-temps avec periods imbriques dans data', () => {
    const fx = {
      state: { id: 2, developer_name: 'INPLAY_1ST_HALF' },
      periods: { data: [{ ticking: false, counts_from: 0, minutes: 47 }] },
    } as unknown as SmFixture
    expect(extractLiveMinuteFromSmFixture(fx)).toBe(47)
    expect(liveClockPausedFromSmFixture(fx)).toBe(true)
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

  it('lit la minute cumulée en mi-temps sans fixture.minute (ex. Allemagne / Curaçao)', () => {
    const fx = {
      state: { id: 3, developer_name: 'HT', state: 'Half Time' },
      periods: [
        {
          ticking: false,
          counts_from: 0,
          minutes: 50,
          time_added: 4,
          has_timer: false,
        },
      ],
    } as SmFixture
    expect(extractLiveMinuteFromSmFixture(fx)).toBe(50)
    expect(liveClockPausedFromSmFixture(fx)).toBe(true)
  })

  it('calcule la minute depuis started quand has_timer est false et minutes reste à 0', () => {
    const started = Math.floor(Date.now() / 1000) - 28 * 60
    const fx = {
      state: { id: 2, developer_name: 'INPLAY_1ST_HALF' },
      periods: [
        {
          ticking: true,
          counts_from: 0,
          minutes: 0,
          started,
          has_timer: false,
        },
      ],
    } as SmFixture
    expect(extractLiveMinuteFromSmFixture(fx)).toBe(28)
  })

  it('ne double pas counts_from quand SM envoie une minute cumulée en 2e période', () => {
    const fx = {
      state: { id: 5, developer_name: 'FT' },
      periods: [{ ticking: false, counts_from: 45, minutes: 96 }],
    } as SmFixture
    expect(extractLiveMinuteFromSmFixture(fx)).toBe(96)
  })

  it('ne confond pas INPLAY_1ST_HALF avec la mi-temps', () => {
    const fx = {
      state: { id: 2, developer_name: 'INPLAY_1ST_HALF' },
      periods: [{ ticking: true, counts_from: 0, minutes: 18 }],
    } as SmFixture
    expect(liveClockPausedFromSmFixture(fx)).toBe(false)
  })
})
