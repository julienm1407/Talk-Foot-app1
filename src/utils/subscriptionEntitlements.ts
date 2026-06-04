import type { AvatarSlotKey } from '../features/avatar2d/types'
import { getSubscriptionPlan } from '../data/subscriptionPlans'
import type { SubscriptionState, SubscriptionTierId, SubscriptionUsageCounters } from '../types/subscription'
import { DEFAULT_SUBSCRIPTION } from '../types/subscription'

export function normalizeSubscription(raw: unknown): SubscriptionState {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_SUBSCRIPTION, usage: {} }
  }
  const o = raw as Record<string, unknown>
  const tier =
    o.tier === 'supporter_plus' || o.tier === 'ambassador' || o.tier === 'freemium'
      ? o.tier
      : 'freemium'
  const usage =
    o.usage !== null && typeof o.usage === 'object' && !Array.isArray(o.usage)
      ? (o.usage as SubscriptionUsageCounters)
      : {}
  return {
    tier,
    activeUntil: typeof o.activeUntil === 'string' ? o.activeUntil : null,
    usage,
  }
}

export function effectiveTier(sub: SubscriptionState): SubscriptionTierId {
  if (sub.activeUntil) {
    const end = Date.parse(sub.activeUntil)
    if (!Number.isNaN(end) && end < Date.now()) return 'freemium'
  }
  return sub.tier
}

export function canCreateGroup(
  tier: SubscriptionTierId,
  createdCount: number,
): { ok: boolean; limit: number } {
  const plan = getSubscriptionPlan(tier)
  const limit = plan.limits.maxGroupsCreated
  if (!Number.isFinite(limit)) return { ok: true, limit }
  return { ok: createdCount < limit, limit }
}

export function canJoinGroup(
  tier: SubscriptionTierId,
  joinedCount: number,
): { ok: boolean; limit: number | null } {
  const plan = getSubscriptionPlan(tier)
  const limit = plan.limits.maxGroupsJoined
  if (limit === null) return { ok: true, limit: null }
  return { ok: joinedCount < limit, limit }
}

export function maxGroupMembersForTier(tier: SubscriptionTierId): number {
  const n = getSubscriptionPlan(tier).limits.maxGroupMembers
  return Number.isFinite(n) ? n : 10_000
}

export function canCreateDebate(
  tier: SubscriptionTierId,
  usage: SubscriptionUsageCounters,
  now = new Date(),
): { ok: boolean; reason?: string } {
  const plan = getSubscriptionPlan(tier)
  if (!plan.flags.canCreateDebates) {
    return { ok: false, reason: 'Les débats nécessitent Supporter+ ou Ambassadeur.' }
  }
  if (plan.limits.debatesPerDay != null) {
    const dayKey = toLocalDayKey(now)
    const count =
      usage.debatesDayKey === dayKey ? (usage.debatesCreatedToday ?? 0) : 0
    if (count >= plan.limits.debatesPerDay) {
      return { ok: false, reason: 'Quota journalier de débats atteint (1 / jour).' }
    }
  }
  if (plan.limits.debatesPerWeek != null) {
    const weekKey = toIsoWeekKey(now)
    const count =
      usage.debatesWeekKey === weekKey ? (usage.debatesCreatedThisWeek ?? 0) : 0
    if (count >= plan.limits.debatesPerWeek) {
      return { ok: false, reason: 'Quota hebdomadaire de débats atteint (1 / semaine).' }
    }
  }
  return { ok: true }
}

export function bumpDebateUsage(
  usage: SubscriptionUsageCounters,
  now = new Date(),
): SubscriptionUsageCounters {
  const dayKey = toLocalDayKey(now)
  const weekKey = toIsoWeekKey(now)
  const dayCount =
    usage.debatesDayKey === dayKey ? (usage.debatesCreatedToday ?? 0) + 1 : 1
  const weekCount =
    usage.debatesWeekKey === weekKey ? (usage.debatesCreatedThisWeek ?? 0) + 1 : 1
  return {
    ...usage,
    debatesDayKey: dayKey,
    debatesCreatedToday: dayCount,
    debatesWeekKey: weekKey,
    debatesCreatedThisWeek: weekCount,
  }
}

export function chatSendAllowed(
  tier: SubscriptionTierId,
  usage: SubscriptionUsageCounters,
  now = Date.now(),
): { ok: boolean; reason?: string; waitMs?: number } {
  const plan = getSubscriptionPlan(tier)
  if (plan.limits.chatCooldownSeconds > 0 && usage.lastChatSendAt) {
    const waitMs = plan.limits.chatCooldownSeconds * 1000 - (now - usage.lastChatSendAt)
    if (waitMs > 0) {
      return {
        ok: false,
        reason: `Patiente ${Math.ceil(waitMs / 1000)} s avant le prochain message.`,
        waitMs,
      }
    }
  }
  if (plan.limits.dailyChatMessages != null) {
    const dayKey = toLocalDayKey(new Date(now))
    const count =
      usage.messagesDayKey === dayKey ? (usage.messagesToday ?? 0) : 0
    if (count >= plan.limits.dailyChatMessages) {
      return {
        ok: false,
        reason: `Limite de ${plan.limits.dailyChatMessages} messages / jour atteinte.`,
      }
    }
  }
  return { ok: true }
}

export function bumpChatUsage(
  usage: SubscriptionUsageCounters,
  now = Date.now(),
): SubscriptionUsageCounters {
  const dayKey = toLocalDayKey(new Date(now))
  const count =
    usage.messagesDayKey === dayKey ? (usage.messagesToday ?? 0) + 1 : 1
  return {
    ...usage,
    messagesDayKey: dayKey,
    messagesToday: count,
    lastChatSendAt: now,
  }
}

/** Toutes les formules : même catalogue boutique ; équipement maillot/short selon achats. */
export function isModularSlotAllowed(_tier: SubscriptionTierId, _slot: AvatarSlotKey): boolean {
  return true
}

export function shouldShowAdsForTier(tier: SubscriptionTierId): boolean {
  return !getSubscriptionPlan(tier).flags.noAds
}

export function monthlyTokenAllowance(tier: SubscriptionTierId): number {
  return getSubscriptionPlan(tier).limits.monthlyTokens
}

export function betTokenMultiplier(tier: SubscriptionTierId): number {
  return getSubscriptionPlan(tier).limits.betTokenMultiplier
}

function toLocalDayKey(date: Date): string {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Semaine ISO (lundi) — ex. 2026-W23 */
function toIsoWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const week =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
    )
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export function toLocalMonthKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${y}-${m}`
}
