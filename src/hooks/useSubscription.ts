import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSubscriptionPlan, SUBSCRIPTION_TIER_ORDER } from '../data/subscriptionPlans'
import { useOptionalCloudUserState } from '../contexts/CloudUserStateContext'
import { useAuth } from '../contexts/AuthContext'
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
    if (cloud?.app.subscription) {
      return normalizeSubscription(cloud.app.subscription)
    }
    return localSub
  }, [cloud?.app.subscription, localSub])

  const tier = useMemo(() => effectiveTier(subscription), [subscription])
  const plan = useMemo(() => getSubscriptionPlan(tier), [tier])

  const patchSubscription = useCallback(
    (fn: (prev: SubscriptionState) => SubscriptionState) => {
      if (cloud) {
        cloud.patchApp((prev) => ({
          ...prev,
          subscription: fn(normalizeSubscription(prev.subscription)),
        }))
        return
      }
      setLocalSub((prev) => {
        const next = fn(normalizeSubscription(prev))
        if (user?.id) writeLocalSubscription(user.id, next)
        return next
      })
    },
    [cloud, user?.id],
  )

  const setTier = useCallback(
    (nextTier: SubscriptionTierId) => {
      patchSubscription((prev) => ({
        ...prev,
        tier: nextTier,
        activeUntil:
          nextTier === 'freemium'
            ? null
            : new Date(Date.now() + 30 * 86400000).toISOString(),
      }))
    },
    [patchSubscription],
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
    showAds: shouldShowAdsForTier(tier),
    patchSubscription,
    patchUsage,
    /** Dev / admin : bascule de formule (Stripe à brancher). */
    setTier: user?.isAdmin ? setTier : undefined,
  }
}
