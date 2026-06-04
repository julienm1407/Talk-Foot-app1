import { useCallback, useEffect, useRef } from 'react'
import { useOptionalCloudUserState } from '../contexts/CloudUserStateContext'
import { useAuth } from '../contexts/AuthContext'
import { normalizeWallet } from '../utils/walletNormalize'
import {
  bumpLiveTokenUsage,
  liveMatchTokenGrantAllowed,
  liveTokensEarnedThisHour,
  liveMatchTokensPerHour,
  normalizeSubscription,
} from '../utils/subscriptionEntitlements'
import { useSubscription } from './useSubscription'
import { useWallet } from './useWallet'

/** 40 jetons / h → 1 jeton toutes les 90 s (page tribune live, match en cours). */
const LIVE_TOKEN_TICK_MS = 90_000

export function useLiveMatchTokenEarn(matchId: string | undefined, isLive: boolean) {
  const { user } = useAuth()
  const { tier, subscription, patchUsage } = useSubscription()
  const { patchWallet } = useWallet()
  const cloud = useOptionalCloudUserState()
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const limit = liveMatchTokensPerHour(tier)
  const earned = liveTokensEarnedThisHour(subscription.usage ?? {})
  const remaining = Math.max(0, limit - earned)

  const grantTick = useCallback(() => {
    if (!user?.id || !matchId || !isLive) return
    const usage = subscription.usage ?? {}
    const gate = liveMatchTokenGrantAllowed(tier, usage, 1)
    if (!gate.ok) return

    if (cloud) {
      cloud.patchApp((prev) => {
        const sub = normalizeSubscription(prev.subscription)
        const gateInner = liveMatchTokenGrantAllowed(tier, sub.usage ?? {}, 1)
        if (!gateInner.ok) return prev
        const w = normalizeWallet(prev.wallet)
        return {
          ...prev,
          subscription: {
            ...sub,
            usage: bumpLiveTokenUsage(sub.usage ?? {}, 1),
          },
          wallet: { ...w, tokens: w.tokens + 1 },
        }
      })
      return
    }

    patchUsage((u) => bumpLiveTokenUsage(u, 1))
    patchWallet((w) => ({ ...w, tokens: w.tokens + 1 }))
  }, [user?.id, matchId, isLive, tier, subscription.usage, cloud, patchUsage, patchWallet])

  useEffect(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    if (!matchId || !isLive || limit <= 0) return

    tickRef.current = setInterval(() => {
      grantTick()
    }, LIVE_TOKEN_TICK_MS)

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [matchId, isLive, limit, grantTick])

  return { limit, earned, remaining, tickMs: LIVE_TOKEN_TICK_MS }
}
