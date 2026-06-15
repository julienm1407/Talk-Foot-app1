import { useMemo } from 'react'
import { useProfile } from './useProfile'
import { useSubscription } from './useSubscription'
import { usePronoStats } from './usePronoStats'
import { useLeaderboard } from './useLeaderboard'
import { useSupporterGroups } from './useSupporterGroups'
import { useWallet } from './useWallet'
import {
  buildProfileIdentityLines,
  effectiveDailyBonusStreak,
  type ProfileIdentityLine,
} from '../utils/profileIdentity'
import type { PronoHubStats } from '../utils/pronoStatsFromBets'
import type { SubscriptionTierId } from '../types/subscription'

export function useProfileIdentity() {
  const { profile, tier } = useProfile()
  const { subscription, tier: subscriptionTier } = useSubscription()
  const { stats } = usePronoStats()
  const { myRank, totalActive } = useLeaderboard()
  const { groups } = useSupporterGroups()
  const { wallet } = useWallet()

  return useMemo(() => {
    const foundedGroups = groups
      .filter((g) => g.createdBy === 'me')
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map((g) => ({ name: g.name }))

    const lines = buildProfileIdentityLines({
      level: profile.level,
      levelTierLabel: tier.label,
      subscriptionTier,
      subscriptionActiveUntil: subscription.activeUntil,
      subscribedSince: subscription.subscribedSince,
      betsWon: stats.won,
      betsDecided: stats.decided,
      accuracy: stats.accuracy,
      winStreak: stats.streak,
      leaderboardRank: stats.decided > 0 ? myRank : null,
      totalBettors: totalActive,
      foundedGroups,
      favCompetition: stats.fav?.name ?? null,
      dailyBonusStreak: effectiveDailyBonusStreak(
        wallet.lastDailyTokenGrant,
        wallet.dailyBonusStreak,
      ),
    })

    return { lines }
  }, [
    profile.level,
    tier.label,
    subscriptionTier,
    subscription.activeUntil,
    subscription.subscribedSince,
    stats,
    myRank,
    totalActive,
    groups,
    wallet.lastDailyTokenGrant,
    wallet.dailyBonusStreak,
  ])
}

/** Identité publique (profil tiers) — stats paris cloud uniquement. */
export function usePublicProfileIdentity(
  stats: PronoHubStats,
  opts?: {
    subscriptionTier?: SubscriptionTierId | null
    loading?: boolean
  },
) {
  return useMemo(() => {
    const lines = buildProfileIdentityLines({
      level: 1,
      levelTierLabel: '—',
      subscriptionTier: opts?.subscriptionTier ?? 'freemium',
      betsWon: stats.won,
      betsDecided: stats.decided,
      accuracy: stats.accuracy,
      winStreak: stats.streak,
      leaderboardRank: null,
      totalBettors: 0,
      foundedGroups: [],
      favCompetition: stats.fav?.name ?? null,
      dailyBonusStreak: 0,
    }).filter((l) => l.id !== 'level' && l.id !== 'subscription')

    return { lines: lines as ProfileIdentityLine[], loading: Boolean(opts?.loading) }
  }, [stats, opts?.subscriptionTier, opts?.loading])
}
