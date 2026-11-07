import { describe, expect, it } from 'vitest'
import { OFFICIAL_LINEUP_LEAD_MS, resolveDisplayedLineupKind } from './lineupStatus'

describe('resolveDisplayedLineupKind', () => {
  const kickoff = '2026-11-07T18:00:00.000Z'
  const nowFar = Date.parse(kickoff) - 6 * 60 * 60 * 1000
  const nowClose = Date.parse(kickoff) - 40 * 60 * 1000

  it('sans onze → none', () => {
    expect(
      resolveDisplayedLineupKind({
        hasLineup: false,
        source: 'confirmed',
        status: 'upcoming',
        kickoffAt: kickoff,
        nowMs: nowFar,
      }),
    ).toBe('none')
  })

  it('live / terminé → officielle', () => {
    expect(
      resolveDisplayedLineupKind({
        hasLineup: true,
        source: 'probable',
        status: 'live',
        kickoffAt: kickoff,
        nowMs: Date.parse(kickoff) + 1000,
      }),
    ).toBe('official')
  })

  it('feed probable → composition probable', () => {
    expect(
      resolveDisplayedLineupKind({
        hasLineup: true,
        source: 'probable',
        status: 'upcoming',
        kickoffAt: kickoff,
        nowMs: nowClose,
      }),
    ).toBe('probable')
  })

  it('feed confirmed trop tôt → encore probable', () => {
    expect(OFFICIAL_LINEUP_LEAD_MS).toBe(75 * 60 * 1000)
    expect(
      resolveDisplayedLineupKind({
        hasLineup: true,
        source: 'confirmed',
        status: 'upcoming',
        kickoffAt: kickoff,
        nowMs: nowFar,
      }),
    ).toBe('probable')
  })

  it('feed confirmed proche du KO → officielle', () => {
    expect(
      resolveDisplayedLineupKind({
        hasLineup: true,
        source: 'confirmed',
        status: 'upcoming',
        kickoffAt: kickoff,
        nowMs: nowClose,
      }),
    ).toBe('official')
  })
})
