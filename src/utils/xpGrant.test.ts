import { describe, expect, it } from 'vitest'
import type { UserProfile } from '../types/profile'
import { XP_CAPS, XP_REWARDS } from '../data/xpRewards'
import {
  bumpChatXpUsage,
  bumpLiveXpUsage,
  chatXpGrantAllowed,
  isXpEventCredited,
  liveXpGrantAllowed,
  markXpEventCredited,
  newlyWonBetIds,
  xpDedupeKey,
} from './xpGrant'

const baseProfile = (): UserProfile => ({
  level: 1,
  xp: 0,
  ownedItemIds: [],
  equippedItems: { scarf: null, hat: null, jersey: null, accessory: null, pants: 'pants-kit', shoes: 'shoes-studs' },
})

describe('xpGrant', () => {
  it('déduplique via creditedXpKeys et legacy creditedBetIds', () => {
    const key = xpDedupeKey('bet', 'b1')
    const p = markXpEventCredited(baseProfile(), key)
    expect(isXpEventCredited(p, key)).toBe(true)
    const legacy = { ...baseProfile(), creditedBetIds: ['b2'] }
    expect(isXpEventCredited(legacy, xpDedupeKey('bet', 'b2'))).toBe(true)
  })

  it('plafonne XP chat journalier', () => {
    const usage = { xpChatDayKey: '2026-06-05', xpChatGrantedToday: XP_CAPS.chatPerDay - 2 }
    const gate = chatXpGrantAllowed(usage, Date.parse('2026-06-05T12:00:00'))
    expect(gate.ok).toBe(true)
    expect(gate.amount).toBe(2)
    const full = bumpChatXpUsage(usage, 2, Date.parse('2026-06-05T12:00:00'))
    expect(chatXpGrantAllowed(full, Date.parse('2026-06-05T12:00:00')).ok).toBe(false)
  })

  it('plafonne XP live horaire', () => {
    const usage = { xpLiveHourKey: '2026-06-05T14', xpLiveGrantedThisHour: XP_CAPS.livePerHour - XP_REWARDS.liveTick }
    const gate = liveXpGrantAllowed(usage, Date.parse('2026-06-05T14:30:00'))
    expect(gate.ok).toBe(true)
    expect(gate.amount).toBe(XP_REWARDS.liveTick)
    const full = bumpLiveXpUsage(usage, XP_REWARDS.liveTick, Date.parse('2026-06-05T14:30:00'))
    expect(liveXpGrantAllowed(full, Date.parse('2026-06-05T14:30:00')).ok).toBe(false)
  })

  it('détecte les paris nouvellement gagnés', () => {
    const before = [
      { id: 'a', status: 'open' },
      { id: 'b', status: 'won' },
      { id: 'c', status: 'open' },
    ]
    const after = [
      { id: 'a', status: 'won' },
      { id: 'b', status: 'won' },
      { id: 'c', status: 'lost' },
    ]
    expect(newlyWonBetIds(before, after)).toEqual(['a'])
  })
})
