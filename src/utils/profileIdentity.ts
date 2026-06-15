import type { SubscriptionTierId } from '../types/subscription'
import { getSubscriptionPlan } from '../data/subscriptionPlans'
import { effectiveTier } from './subscriptionEntitlements'

export type ProfileIdentityLine = {
  id: string
  emoji: string
  label: string
  /** Ligne mise en avant (palier, exploit). */
  featured?: boolean
}

export type ProfileIdentityInput = {
  level: number
  levelTierLabel: string
  subscriptionTier: SubscriptionTierId
  subscriptionActiveUntil?: string | null
  subscribedSince?: string | null
  betsWon: number
  betsDecided: number
  accuracy: number
  winStreak: number
  leaderboardRank: number | null
  totalBettors: number
  foundedGroups: { name: string }[]
  favCompetition: string | null
  dailyBonusStreak: number
  displayName?: string
}

function monthsSince(iso: string): number {
  const start = new Date(iso)
  if (Number.isNaN(start.getTime())) return 1
  const now = new Date()
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  return Math.max(1, months || 1)
}

function subscriptionLine(
  tier: SubscriptionTierId,
  activeUntil: string | null | undefined,
  subscribedSince: string | null | undefined,
): ProfileIdentityLine | null {
  const effective = effectiveTier({ tier, activeUntil: activeUntil ?? null, usage: {} })
  if (effective === 'freemium') return null
  const plan = getSubscriptionPlan(effective)
  const since = subscribedSince?.trim()
  const label = since
    ? `${plan.name} depuis ${monthsSince(since)} mois`
    : plan.name
  return {
    id: 'subscription',
    emoji: effective === 'ambassador' ? '👑' : '⭐',
    label,
    featured: true,
  }
}

/** Faits marquants — construit l'histoire personnelle à partir de données réelles. */
export function buildProfileIdentityLines(input: ProfileIdentityInput): ProfileIdentityLine[] {
  const lines: ProfileIdentityLine[] = []

  lines.push({
    id: 'level',
    emoji: '🏆',
    label: `Niveau ${input.level} · ${input.levelTierLabel}`,
    featured: true,
  })

  const sub = subscriptionLine(
    input.subscriptionTier,
    input.subscriptionActiveUntil,
    input.subscribedSince,
  )
  if (sub) lines.push(sub)

  if (input.betsWon > 0) {
    const acc =
      input.betsDecided >= 3 ? ` · ${input.accuracy}% de réussite` : ''
    lines.push({
      id: 'bets-won',
      emoji: '🎯',
      label: `${input.betsWon.toLocaleString('fr-FR')} pari${input.betsWon > 1 ? 's' : ''} gagné${input.betsWon > 1 ? 's' : ''}${acc}`,
    })
  }

  for (const [i, g] of input.foundedGroups.slice(0, 2).entries()) {
    lines.push({
      id: `founder-${i}`,
      emoji: '👥',
      label: `Fondateur de ${g.name}`,
      featured: i === 0,
    })
  }

  if (input.leaderboardRank != null && input.leaderboardRank > 0 && input.betsDecided > 0) {
    if (input.leaderboardRank <= 50) {
      lines.push({
        id: 'rank-top50',
        emoji: '🇫🇷',
        label: `Top ${input.leaderboardRank} des parieurs Talk Foot`,
        featured: input.leaderboardRank <= 10,
      })
    } else if (input.totalBettors > 1) {
      const topPct = Math.min(99, Math.round((input.leaderboardRank / input.totalBettors) * 100))
      lines.push({
        id: 'rank',
        emoji: '📊',
        label: `${input.leaderboardRank}e au classement · top ${topPct}%`,
      })
    }
  }

  if (input.winStreak >= 5) {
    lines.push({
      id: 'invincible',
      emoji: '🛡️',
      label: `Invaincu · série de ${input.winStreak} victoires`,
      featured: true,
    })
  } else if (input.winStreak >= 2) {
    lines.push({
      id: 'win-streak',
      emoji: '🔥',
      label: `Série de ${input.winStreak} victoires d'affilée`,
    })
  }

  if (input.dailyBonusStreak >= 2) {
    lines.push({
      id: 'daily-streak',
      emoji: '📅',
      label: `Série de ${input.dailyBonusStreak} jours sur Talk Foot`,
    })
  }

  if (input.favCompetition) {
    lines.push({
      id: 'fav-league',
      emoji: '⚽',
      label: `Fan de ${input.favCompetition}`,
    })
  }

  return lines
}

export function prevDayKey(dayKey: string): string {
  const d = new Date(`${dayKey}T12:00:00`)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** Série bonus quotidien encore active (aujourd'hui ou hier réclamé). */
export function effectiveDailyBonusStreak(
  lastDailyTokenGrant: string | undefined,
  dailyBonusStreak: number | undefined,
): number {
  if (!lastDailyTokenGrant || !dailyBonusStreak || dailyBonusStreak < 1) return 0
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = prevDayKey(today)
  if (lastDailyTokenGrant === today || lastDailyTokenGrant === yesterday) return dailyBonusStreak
  return 0
}
