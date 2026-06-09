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
  isAdmin = false,
): { ok: boolean; limit: number } {
  if (isAdmin) return { ok: true, limit: Number.POSITIVE_INFINITY }
  const plan = getSubscriptionPlan(tier)
  const limit = plan.limits.maxGroupsCreated
  if (!Number.isFinite(limit)) return { ok: true, limit }
  return { ok: createdCount < limit, limit }
}

export function canJoinGroup(
  tier: SubscriptionTierId,
  joinedCount: number,
  isAdmin = false,
): { ok: boolean; limit: number | null } {
  if (isAdmin) return { ok: true, limit: null }
  const plan = getSubscriptionPlan(tier)
  const limit = plan.limits.maxGroupsJoined
  if (limit === null) return { ok: true, limit: null }
  return { ok: joinedCount < limit, limit }
}

/** Message quand le plafond de tribunes (total adhésions) est atteint. */
export function joinGroupLimitMessage(
  tier: SubscriptionTierId,
  limit: number,
  currentCount?: number,
): string {
  const planName = getSubscriptionPlan(tier).name
  const count = currentCount ?? limit
  if (tier === 'freemium') {
    return `Tu utilises ${count}/${limit} tribunes avec ${planName} (celles que tu crées comptent). Libère une place ou passe à Ultra.`
  }
  return `Vous avez atteint la limite de tribunes (${count}/${limit} avec ${planName}).`
}

/** Message affiché quand l’utilisateur tente de créer une tribune au-delà du plafond de sa formule. */
export function createGroupLimitMessage(
  tier: SubscriptionTierId,
  limit: number,
): string {
  const planName = getSubscriptionPlan(tier).name
  return `Vous avez atteint la limite de tribunes créées (${limit} max avec ${planName}).`
}

export function maxGroupMembersForTier(tier: SubscriptionTierId): number {
  const n = getSubscriptionPlan(tier).limits.maxGroupMembers
  return Number.isFinite(n) ? n : 10_000
}

export function canCreateDebate(
  tier: SubscriptionTierId,
  usage: SubscriptionUsageCounters,
  now = new Date(),
  isAdmin = false,
): { ok: boolean; reason?: string } {
  if (isAdmin) return { ok: true }
  const plan = getSubscriptionPlan(tier)
  if (!plan.flags.canCreateDebates) {
    return { ok: false, reason: 'Les débats nécessitent Ultra ou Ambassadeur.' }
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

/** Jetons crédités au wallet après un pari gagné (payout = mise × cote, bonus sur le profit si ×2). */
export function betWinTokenCredit(
  payout: number,
  stake: number,
  multiplier: number,
): number {
  const m = Number.isFinite(multiplier) && multiplier > 1 ? multiplier : 1
  if (m <= 1) return payout
  const profit = Math.max(0, payout - stake)
  return payout + Math.round(profit * (m - 1))
}

export function monthlyTokenGrantEligible(
  tier: SubscriptionTierId,
  usage: SubscriptionUsageCounters,
  now = new Date(),
): boolean {
  const plan = getSubscriptionPlan(tier)
  if (!plan.flags.monthlyTokenGrant || plan.limits.monthlyTokens <= 0) return false
  const monthKey = toLocalMonthKey(now)
  return usage.monthlyTokensMonthKey !== monthKey
}

export function groupMemberCapForTier(tier: SubscriptionTierId, isAdmin = false): number {
  if (isAdmin) return 10_000
  return maxGroupMembersForTier(tier)
}

export function canJoinGroupByMemberCap(
  currentMembers: number,
  maxMembers: number | undefined,
): { ok: boolean; limit: number } {
  const limit = maxMembers ?? Number.POSITIVE_INFINITY
  if (!Number.isFinite(limit)) return { ok: true, limit }
  return { ok: currentMembers < limit, limit }
}

export function toLocalHourKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  const h = `${date.getHours()}`.padStart(2, '0')
  return `${y}-${m}-${d}T${h}`
}

export function liveMatchTokensPerHour(tier: SubscriptionTierId): number {
  return getSubscriptionPlan(tier).limits.liveMatchTokensPerHour
}

export function liveTokensEarnedThisHour(
  usage: SubscriptionUsageCounters,
  now = Date.now(),
): number {
  const hourKey = toLocalHourKey(new Date(now))
  return usage.liveTokensHourKey === hourKey ? (usage.liveTokensThisHour ?? 0) : 0
}

export function liveMatchTokenGrantAllowed(
  tier: SubscriptionTierId,
  usage: SubscriptionUsageCounters,
  amount: number,
  now = Date.now(),
): { ok: boolean; remaining: number; limit: number; reason?: string } {
  const limit = liveMatchTokensPerHour(tier)
  if (limit <= 0) {
    return { ok: false, remaining: 0, limit: 0, reason: 'none' }
  }
  const used = liveTokensEarnedThisHour(usage, now)
  const remaining = Math.max(0, limit - used)
  if (amount > remaining) {
    return { ok: false, remaining, limit, reason: 'hour_cap' }
  }
  return { ok: true, remaining: remaining - amount, limit }
}

export function bumpLiveTokenUsage(
  usage: SubscriptionUsageCounters,
  amount: number,
  now = Date.now(),
): SubscriptionUsageCounters {
  const hourKey = toLocalHourKey(new Date(now))
  const used =
    usage.liveTokensHourKey === hourKey ? (usage.liveTokensThisHour ?? 0) : 0
  return {
    ...usage,
    liveTokensHourKey: hourKey,
    liveTokensThisHour: used + amount,
  }
}

export function hasPlanFlag(
  tier: SubscriptionTierId,
  flag: keyof ReturnType<typeof getSubscriptionPlan>['flags'],
): boolean {
  return Boolean(getSubscriptionPlan(tier).flags[flag])
}

export function toLocalDayKey(date: Date): string {
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
