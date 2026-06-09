import type { UserProfile } from '../types/profile'
import type { SubscriptionUsageCounters } from '../types/subscription'
import { XP_CAPS, XP_REWARDS } from '../data/xpRewards'
import { toLocalDayKey, toLocalHourKey } from './subscriptionEntitlements'

export function xpDedupeKey(kind: string, id: string): string {
  return `${kind}:${id}`
}

export function isXpEventCredited(profile: UserProfile, key: string): boolean {
  if (profile.creditedXpKeys?.includes(key)) return true
  if (key.startsWith('bet:')) {
    const betId = key.slice(4)
    if (profile.creditedBetIds?.includes(betId)) return true
  }
  return false
}

export function markXpEventCredited(profile: UserProfile, key: string): UserProfile {
  const creditedXpKeys = [...(profile.creditedXpKeys ?? []), key].slice(-800)
  const betId = key.startsWith('bet:') ? key.slice(4) : null
  const creditedBetIds =
    betId != null
      ? [...(profile.creditedBetIds ?? []), betId].slice(-400)
      : profile.creditedBetIds
  return { ...profile, creditedXpKeys, creditedBetIds }
}

export function chatXpGrantAllowed(
  usage: SubscriptionUsageCounters,
  now = Date.now(),
): { ok: boolean; amount: number } {
  const dayKey = toLocalDayKey(new Date(now))
  const granted =
    usage.xpChatDayKey === dayKey ? (usage.xpChatGrantedToday ?? 0) : 0
  if (granted >= XP_CAPS.chatPerDay) return { ok: false, amount: 0 }
  const amount = Math.min(XP_REWARDS.chatMessage, XP_CAPS.chatPerDay - granted)
  return { ok: amount > 0, amount }
}

export function bumpChatXpUsage(
  usage: SubscriptionUsageCounters,
  amount: number,
  now = Date.now(),
): SubscriptionUsageCounters {
  const dayKey = toLocalDayKey(new Date(now))
  const granted =
    usage.xpChatDayKey === dayKey ? (usage.xpChatGrantedToday ?? 0) + amount : amount
  return { ...usage, xpChatDayKey: dayKey, xpChatGrantedToday: granted }
}

export function liveXpGrantAllowed(
  usage: SubscriptionUsageCounters,
  now = Date.now(),
): { ok: boolean; amount: number } {
  const hourKey = toLocalHourKey(new Date(now))
  const granted =
    usage.xpLiveHourKey === hourKey ? (usage.xpLiveGrantedThisHour ?? 0) : 0
  if (granted >= XP_CAPS.livePerHour) return { ok: false, amount: 0 }
  const amount = Math.min(XP_REWARDS.liveTick, XP_CAPS.livePerHour - granted)
  return { ok: amount > 0, amount }
}

export function bumpLiveXpUsage(
  usage: SubscriptionUsageCounters,
  amount: number,
  now = Date.now(),
): SubscriptionUsageCounters {
  const hourKey = toLocalHourKey(new Date(now))
  const granted =
    usage.xpLiveHourKey === hourKey ? (usage.xpLiveGrantedThisHour ?? 0) + amount : amount
  return { ...usage, xpLiveHourKey: hourKey, xpLiveGrantedThisHour: granted }
}

/** Paris passés de `open` à `won` lors d’un règlement. */
export function newlyWonBetIds(before: { id: string; status: string }[], after: { id: string; status: string }[]): string[] {
  const wasOpen = new Set(before.filter((b) => b.status === 'open').map((b) => b.id))
  return after
    .filter((b) => b.status === 'won' && wasOpen.has(b.id))
    .map((b) => b.id)
}
