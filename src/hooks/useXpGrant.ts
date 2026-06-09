import { useCallback } from 'react'
import type { UserProfile } from '../types/profile'
import { XP_REWARDS } from '../data/xpRewards'
import {
  bumpChatXpUsage,
  bumpLiveXpUsage,
  chatXpGrantAllowed,
  isXpEventCredited,
  liveXpGrantAllowed,
  markXpEventCredited,
  xpDedupeKey,
} from '../utils/xpGrant'
import { useProfile } from './useProfile'
import { useSubscription } from './useSubscription'

function applyXp(
  profile: UserProfile,
  amount: number,
  dedupeKey?: string,
): UserProfile | null {
  if (amount <= 0) return null
  if (dedupeKey && isXpEventCredited(profile, dedupeKey)) return null
  const next = dedupeKey ? markXpEventCredited(profile, dedupeKey) : profile
  return { ...next, xp: next.xp + amount }
}

export function useXpGrant() {
  const { profile, setProfile } = useProfile()
  const { subscription, patchUsage } = useSubscription()

  const grantAmount = useCallback(
    (amount: number, dedupeKey?: string): number => {
      let granted = 0
      setProfile((p) => {
        const next = applyXp(p, amount, dedupeKey)
        if (!next) return p
        granted = amount
        return next
      })
      return granted
    },
    [setProfile],
  )

  const grantBetWon = useCallback(
    (betIds: string[]) => {
      for (const id of betIds) {
        grantAmount(XP_REWARDS.betWon, xpDedupeKey('bet', id))
      }
    },
    [grantAmount],
  )

  const grantBetPlaced = useCallback(
    (betId: string) => {
      grantAmount(XP_REWARDS.betPlaced, xpDedupeKey('bet-placed', betId))
    },
    [grantAmount],
  )

  const grantChatMessage = useCallback(() => {
    const gate = chatXpGrantAllowed(subscription.usage ?? {})
    if (!gate.ok) return 0
    const n = grantAmount(gate.amount)
    if (n > 0) patchUsage((u) => bumpChatXpUsage(u ?? {}, n))
    return n
  }, [grantAmount, patchUsage, subscription.usage])

  const grantLiveTick = useCallback(() => {
    const gate = liveXpGrantAllowed(subscription.usage ?? {})
    if (!gate.ok) return 0
    const n = grantAmount(gate.amount)
    if (n > 0) patchUsage((u) => bumpLiveXpUsage(u ?? {}, n))
    return n
  }, [grantAmount, patchUsage, subscription.usage])

  const grantDebateCreated = useCallback(
    (debateId: string) => {
      return grantAmount(XP_REWARDS.debateCreated, xpDedupeKey('debate', debateId))
    },
    [grantAmount],
  )

  const grantDailyBonus = useCallback(
    (claimDayKey: string) => {
      return grantAmount(XP_REWARDS.dailyBonus, xpDedupeKey('daily', claimDayKey))
    },
    [grantAmount],
  )

  const syncWonBetsXp = useCallback(
    (wonBetIds: string[]) => {
      grantBetWon(wonBetIds)
    },
    [grantBetWon],
  )

  return {
    profile,
    grantBetWon,
    grantBetPlaced,
    grantChatMessage,
    grantLiveTick,
    grantDebateCreated,
    grantDailyBonus,
    syncWonBetsXp,
  }
}
