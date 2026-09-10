import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSubscriptionPlan, SUBSCRIPTION_TIER_ORDER } from '../data/subscriptionPlans'
import { useOptionalCloudUserState } from '../contexts/CloudUserStateContext'
import { useAuth } from '../contexts/AuthContext'
import { isGooglePlayReviewEmail } from '../config/adminAccess'
import type { SubscriptionState, SubscriptionTierId } from '../types/subscription'
import { DEFAULT_SUBSCRIPTION } from '../types/subscription'
import {
  effectiveTier,
  normalizeSubscription,
  monthlyTokenAllowance,
  betTokenMultiplier,
  shouldShowAdsForTier,
} from '../utils/subscriptionEntitlements'

const LOCAL_SUB_KEY = 'talkfoot.subscription.v1'
const GOOGLE_REVIEW_TIER: SubscriptionTierId = 'ambassador'
const GOOGLE_REVIEW_ACTIVE_UNTIL = '2099-12-31T23:59:59.000Z'

function readLocalSubscription(userId: string | undefined): SubscriptionState {
  if (!userId) return { ...DEFAULT_SUBSCRIPTION, usage: {} }
  try {
    const raw = localStorage.getItem(`${LOCAL_SUB_KEY}.${userId}`)
    if (!raw) return { ...DEFAULT_SUBSCRIPTION, usage: {} }
    return normalizeSubscription(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_SUBSCRIPTION, usage: {} }
  }
}

function writeLocalSubscription(userId: string, sub: SubscriptionState) {
  try {
    localStorage.setItem(`${LOCAL_SUB_KEY}.${userId}`, JSON.stringify(sub))
  } catch {
    /* quota */
  }
}

function withGoogleReviewEntitlements(
  sub: SubscriptionState,
  email: string | undefined | null,
): SubscriptionState {
  if (!isGooglePlayReviewEmail(email)) return sub
  return {
    ...sub,
    tier: GOOGLE_REVIEW_TIER,
    activeUntil: GOOGLE_REVIEW_ACTIVE_UNTIL,
    subscribedSince: sub.subscribedSince ?? new Date().toISOString(),
  }
}

export function useSubscription() {
  const { user } = useAuth()
  const cloud = useOptionalCloudUserState()
  const [localSub, setLocalSub] = useState<SubscriptionState>(() =>
    readLocalSubscription(user?.id),
  )

  useEffect(() => {
    setLocalSub(readLocalSubscription(user?.id))
  }, [user?.id])

  const subscription = useMemo((): SubscriptionState => {
    const base = cloud?.app.subscription
      ? normalizeSubscription(cloud.app.subscription)
      : localSub
    return withGoogleReviewEntitlements(base, user?.email)
  }, [cloud?.app.subscription, localSub, user?.email])

  const tier = useMemo(() => effectiveTier(subscription), [subscription])
  const plan = useMemo(() => getSubscriptionPlan(tier), [tier])
  const unlockAll = Boolean(user?.isAdmin) || isGooglePlayReviewEmail(user?.email)

  const patchSubscription = useCallback(
    (fn: (prev: SubscriptionState) => SubscriptionState) => {
      const apply = (prev: SubscriptionState) =>
        withGoogleReviewEntitlements(fn(normalizeSubscription(prev)), user?.email)
      if (cloud) {
        if (!cloud.syncReady) {
          setLocalSub((prev) => {
            const next = apply(prev)
            if (user?.id) writeLocalSubscription(user.id, next)
            return next
          })
          return
        }
        cloud.patchApp((prev) => {
          const next = apply(normalizeSubscription(prev.subscription))
          if (user?.id) writeLocalSubscription(user.id, next)
          setLocalSub(next)
          return { ...prev, subscription: next }
        })
        return
      }
      setLocalSub((prev) => {
        const next = apply(prev)
        if (user?.id) writeLocalSubscription(user.id, next)
        return next
      })
    },
    [cloud, cloud?.syncReady, user?.id, user?.email],
  )

  useEffect(() => {
    if (!cloud?.app.subscription || !user?.id) return
    const synced = withGoogleReviewEntitlements(
      normalizeSubscription(cloud.app.subscription),
      user.email,
    )
    writeLocalSubscription(user.id, synced)
    setLocalSub(synced)
  }, [cloud?.app.subscription, user?.id, user?.email])

  /** Persiste Ambassadeur pour le compte Google Review dès la connexion. */
  useEffect(() => {
    if (!isGooglePlayReviewEmail(user?.email)) return
    if (
      subscription.tier === GOOGLE_REVIEW_TIER &&
      subscription.activeUntil === GOOGLE_REVIEW_ACTIVE_UNTIL
    ) {
      return
    }
    patchSubscription((prev) => ({
      ...prev,
      tier: GOOGLE_REVIEW_TIER,
      activeUntil: GOOGLE_REVIEW_ACTIVE_UNTIL,
      subscribedSince: prev.subscribedSince ?? new Date().toISOString(),
    }))
    void cloud?.flushAppSave?.()
  }, [user?.email, subscription.tier, subscription.activeUntil, patchSubscription, cloud])

  const setTier = useCallback(
    (nextTier: SubscriptionTierId) => {
      patchSubscription((prev) => ({
        ...prev,
        tier: nextTier,
        activeUntil:
          nextTier === 'freemium'
            ? null
            : new Date(Date.now() + 30 * 86400000).toISOString(),
        subscribedSince:
          nextTier === 'freemium'
            ? null
            : prev.subscribedSince ?? new Date().toISOString(),
      }))
      void cloud?.flushAppSave?.()
    },
    [patchSubscription, cloud],
  )

  /** Après achat store / fulfill Stripe vérifié — disponible pour tous les comptes connectés. */
  const grantPurchasedTier = useCallback(
    (nextTier: SubscriptionTierId) => {
      setTier(nextTier)
    },
    [setTier],
  )

  const patchUsage = useCallback(
    (fn: (u: NonNullable<SubscriptionState['usage']>) => SubscriptionState['usage']) => {
      patchSubscription((prev) => ({
        ...prev,
        usage: fn({ ...(prev.usage ?? {}) }),
      }))
    },
    [patchSubscription],
  )

  return {
    subscription,
    tier,
    plan,
    tiers: SUBSCRIPTION_TIER_ORDER,
    monthlyTokens: monthlyTokenAllowance(tier),
    betTokenMultiplier: betTokenMultiplier(tier),
    showAds: unlockAll ? false : shouldShowAdsForTier(tier),
    hasVerifiedBadge: unlockAll || plan.flags.verifiedBadge,
    hasAmbassadorStatus: unlockAll || plan.flags.ambassadorStatus,
    canStreamSalon: unlockAll || plan.flags.canStreamSalon,
    canJoinVoiceSalons: unlockAll || plan.flags.canJoinVoiceSalons,
    canWriteArticles: unlockAll || plan.flags.canWriteArticles,
    canCreatePrivateLiveMatches: unlockAll || plan.flags.canCreatePrivateLiveMatches,
    liveMatchTokensPerHour: plan.limits.liveMatchTokensPerHour,
    patchSubscription,
    patchUsage,
    grantPurchasedTier,
    /** Dev / admin : bascule manuelle de formule. */
    setTier: unlockAll ? setTier : undefined,
  }
}
