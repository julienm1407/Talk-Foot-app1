import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import type { Wallet } from '../types/bet'
import { useOptionalCloudUserState } from '../contexts/CloudUserStateContext'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import { getSupabaseBrowserClient } from '../lib/supabase/client'
import { claimDailyTokenBonusCloud, isDailyClaimRpcUnavailable } from '../lib/supabase/claimDailyTokenBonus'
import {
  configureWalletStore,
  getWalletSnapshot,
  patchWalletStore,
  subscribeWallet,
} from '../store/walletStore'
import { DEFAULT_WALLET, normalizeWallet } from '../utils/walletNormalize'
import {
  isWalletStandardizeExempt,
  isWalletTestAdmin,
  readLocalWalletStandardizedFlag,
  writeLocalWalletStandardizedFlag,
} from '../utils/walletStandardize'
import { useSubscription } from './useSubscription'
import {
  monthlyTokenGrantEligible,
  normalizeSubscription,
  toLocalMonthKey,
} from '../utils/subscriptionEntitlements'
import {
  DAILY_TOKEN_BONUS_AMOUNT,
  isDailyBonusOpenNow,
  nextDailyBonusWindow,
  type DailyTokenBonusStatus,
} from '../utils/dailyTokenBonus'
import {
  mergeDailyTokenGrant,
  readLocalDailyTokenGrant,
  writeLocalDailyTokenGrant,
} from '../utils/dailyTokenGrantLocal'

export { DAILY_TOKEN_BONUS_AMOUNT, DAILY_TOKEN_BONUS_HOUR } from '../utils/dailyTokenBonus'
export type { DailyTokenBonusStatus } from '../utils/dailyTokenBonus'

const DEV_ADMIN_TEST_MEDALS = 3000
const DEV_ADMIN_TEST_TOKENS = 100_000

function buildDailyBonusStatus(wallet: Wallet, userId?: string): DailyTokenBonusStatus {
  const now = new Date()
  const { claimDayKey, nextClaimAt } = nextDailyBonusWindow(now)
  const lastGrant = mergeDailyTokenGrant(wallet.lastDailyTokenGrant, userId)
  const alreadyClaimedToday = lastGrant === claimDayKey
  return {
    amount: DAILY_TOKEN_BONUS_AMOUNT,
    canClaim: isDailyBonusOpenNow(now) && !alreadyClaimedToday,
    alreadyClaimedToday,
    nextClaimAt,
    claimDayKey,
  }
}

export function useWallet() {
  const { user } = useAuth()
  const { tier, monthlyTokens, subscription, plan, patchUsage } = useSubscription()
  const monthlyAutoGrantRef = useRef<string | null>(null)
  const cloud = useOptionalCloudUserState()
  const persistLocal = !isSupabaseConfigured()
  const useCloudWallet = cloud !== undefined

  useEffect(() => {
    configureWalletStore({ persist: persistLocal })
  }, [persistLocal])

  const localWallet = useSyncExternalStore(subscribeWallet, getWalletSnapshot, getWalletSnapshot)

  const wallet = useMemo(
    () => (useCloudWallet ? normalizeWallet(cloud.app.wallet) : localWallet),
    [useCloudWallet, cloud?.app.wallet, localWallet],
  )

  const patchWallet = useCallback(
    (fn: (w: Wallet) => Wallet) => {
      if (useCloudWallet) {
        cloud.patchApp((prev) => ({
          ...prev,
          wallet: normalizeWallet(fn(normalizeWallet(prev.wallet))),
        }))
      } else {
        patchWalletStore(fn)
      }
    },
    [useCloudWallet, cloud],
  )

  useEffect(() => {
    if (!user?.id) return
    if (useCloudWallet && cloud && !cloud.syncReady) return
    if (isWalletStandardizeExempt(user, wallet) || readLocalDailyTokenGrant(user.id)) return

    if (useCloudWallet && cloud) {
      if (cloud.app.walletStandardizedV2) return
      cloud.patchApp((prev) => ({
        ...prev,
        walletStandardizedV2: true,
      }))
      void cloud.flushAppSave()
      return
    }

    if (readLocalWalletStandardizedFlag()) return
    writeLocalWalletStandardizedFlag()
  }, [
    user?.id,
    user?.isAdmin,
    user?.email,
    user?.displayName,
    wallet.lastDailyTokenGrant,
    patchWallet,
    cloud,
    useCloudWallet,
  ])

  useEffect(() => {
    if (!user?.id || !isWalletTestAdmin(user)) return
    if (useCloudWallet && cloud && !cloud.syncReady) return
    if (useCloudWallet && cloud?.app.adminWalletBootstrapped) return

    const needsBootstrap =
      wallet.medals === 0 && wallet.tokens <= DEFAULT_WALLET.tokens
    if (!needsBootstrap && useCloudWallet) {
      cloud?.patchApp((prev) =>
        prev.adminWalletBootstrapped ? prev : { ...prev, adminWalletBootstrapped: true },
      )
      return
    }
    if (!needsBootstrap) return

    const applyBootstrap = () => ({
      medals: DEV_ADMIN_TEST_MEDALS,
      tokens: DEV_ADMIN_TEST_TOKENS,
    })

    if (useCloudWallet && cloud) {
      cloud.patchApp((prev) => ({
        ...prev,
        adminWalletBootstrapped: true,
        wallet: normalizeWallet({ ...normalizeWallet(prev.wallet), ...applyBootstrap() }),
      }))
      void cloud.flushAppSave()
      return
    }

    patchWallet((w) => ({ ...w, ...applyBootstrap() }))
  }, [
    user?.id,
    user?.email,
    user?.displayName,
    user?.isAdmin,
    wallet.medals,
    wallet.tokens,
    patchWallet,
    cloud,
    useCloudWallet,
  ])

  const addTokens = useCallback(
    (amount: number) => {
      patchWallet((w) => ({ ...w, tokens: w.tokens + amount }))
      void cloud?.flushAppSave?.()
    },
    [patchWallet, cloud],
  )

  const spendTokens = useCallback(
    (amount: number): { ok: boolean } => {
      let ok = false
      patchWallet((w) => {
        if (w.tokens < amount) return w
        ok = true
        return { ...w, tokens: w.tokens - amount }
      })
      if (ok) void cloud?.flushAppSave?.()
      return { ok }
    },
    [patchWallet, cloud],
  )

  const addMedals = useCallback(
    (amount: number) => {
      patchWallet((w) => ({ ...w, medals: w.medals + amount }))
      void cloud?.flushAppSave?.()
    },
    [patchWallet, cloud],
  )

  const spendMedals = useCallback(
    (amount: number): { ok: boolean; insufficient: boolean } => {
      let ok = false
      let insufficient = false
      patchWallet((w) => {
        if (w.medals < amount) {
          insufficient = true
          return w
        }
        ok = true
        return { ...w, medals: w.medals - amount }
      })
      if (ok) void cloud?.flushAppSave?.()
      return { ok, insufficient }
    },
    [patchWallet, cloud],
  )

  const claimInFlightRef = useRef(false)

  const dailyBonus = useMemo(
    () => buildDailyBonusStatus(wallet, user?.id),
    [wallet, user?.id],
  )

  const dailyTokenBonusStatus = useCallback(() => dailyBonus, [dailyBonus])

  const claimMonthlySubscriptionTokens = useCallback((): {
    ok: boolean
    amount?: number
    reason?: string
  } => {
    if (!monthlyTokenGrantEligible(tier, subscription.usage ?? {})) {
      return {
        ok: false,
        reason: monthlyTokens <= 0 ? 'not_eligible' : 'already_claimed',
      }
    }
    const monthKey = toLocalMonthKey()
    let out: { ok: boolean; amount?: number; reason?: string } = { ok: false, reason: 'unknown' }

    if (useCloudWallet && cloud) {
      cloud.patchApp((prev) => {
        const usage = normalizeSubscription(prev.subscription).usage ?? {}
        if (usage.monthlyTokensMonthKey === monthKey) {
          out = { ok: false, reason: 'already_claimed' }
          return prev
        }
        const w = normalizeWallet(prev.wallet)
        out = { ok: true, amount: monthlyTokens }
        return {
          ...prev,
          subscription: normalizeSubscription({
            ...normalizeSubscription(prev.subscription),
            usage: { ...usage, monthlyTokensMonthKey: monthKey },
          }),
          wallet: { ...w, tokens: w.tokens + monthlyTokens },
        }
      })
      if (out.ok) void cloud.flushAppSave()
      return out
    }

    const usage = subscription.usage ?? {}
    if (usage.monthlyTokensMonthKey === monthKey) {
      return { ok: false, reason: 'already_claimed' }
    }
    patchUsage((u) => ({ ...u, monthlyTokensMonthKey: monthKey }))
    patchWallet((w) => {
      out = { ok: true, amount: monthlyTokens }
      return { ...w, tokens: w.tokens + monthlyTokens }
    })
    return out
  }, [monthlyTokens, subscription.usage, tier, patchUsage, patchWallet, cloud, useCloudWallet])

  useEffect(() => {
    if (!user?.id || !plan.flags.monthlyTokenGrant || monthlyTokens <= 0) return
    if (useCloudWallet && cloud && !cloud.syncReady) return
    const monthKey = toLocalMonthKey()
    if (monthlyAutoGrantRef.current === monthKey) return
    if (!monthlyTokenGrantEligible(tier, subscription.usage ?? {})) return

    monthlyAutoGrantRef.current = monthKey
    const result = claimMonthlySubscriptionTokens()
    if (!result.ok && result.reason !== 'already_claimed') {
      monthlyAutoGrantRef.current = null
    }
  }, [
    user?.id,
    plan.flags.monthlyTokenGrant,
    monthlyTokens,
    tier,
    subscription.usage?.monthlyTokensMonthKey,
    useCloudWallet,
    cloud,
    cloud?.syncReady,
    claimMonthlySubscriptionTokens,
  ])

  const claimDailyTokenBonus = useCallback(async (): Promise<{
    ok: boolean
    amount?: number
    reason?: string
  }> => {
    if (claimInFlightRef.current) return { ok: false, reason: 'in_flight' }

    const now = new Date()
    const { claimDayKey } = nextDailyBonusWindow(now)
    const lastGrant = mergeDailyTokenGrant(wallet.lastDailyTokenGrant, user?.id)

    if (!isDailyBonusOpenNow(now)) return { ok: false, reason: 'not_open_yet' }
    if (lastGrant === claimDayKey) return { ok: false, reason: 'already_claimed' }

    const claimLocally = (): { ok: boolean; amount?: number; reason?: string } => {
      let out: { ok: boolean; amount?: number; reason?: string } = { ok: false, reason: 'unknown' }
      patchWallet((w) => {
        const merged = mergeDailyTokenGrant(w.lastDailyTokenGrant, user?.id)
        if (merged === claimDayKey) {
          out = { ok: false, reason: 'already_claimed' }
          return w
        }
        out = { ok: true, amount: DAILY_TOKEN_BONUS_AMOUNT }
        return {
          ...w,
          tokens: w.tokens + DAILY_TOKEN_BONUS_AMOUNT,
          lastDailyTokenGrant: claimDayKey,
        }
      })
      if (out.ok) writeLocalDailyTokenGrant(user?.id, claimDayKey)
      return out
    }

    claimInFlightRef.current = true
    try {
      cloud?.cancelScheduledSave?.()

      if (useCloudWallet && user?.id && isSupabaseConfigured()) {
        const sb = getSupabaseBrowserClient()
        if (sb) {
          const rpc = await claimDailyTokenBonusCloud(sb, user.id)
          if (rpc.ok) {
            patchWallet(() => rpc.wallet)
            writeLocalDailyTokenGrant(user.id, rpc.claimDayKey)
            // Aligner app_state client sur le wallet serveur (évite qu’un flush différé écrase le RPC).
            await cloud?.flushAppSave?.()
            return { ok: true, amount: rpc.amount }
          }
          if (rpc.reason === 'already_claimed') {
            writeLocalDailyTokenGrant(user.id, rpc.claimDayKey ?? claimDayKey)
            if (rpc.wallet) {
              const synced = rpc.wallet
              patchWallet(() => synced)
              await cloud?.flushAppSave?.()
            }
            return { ok: false, reason: 'already_claimed' }
          }
          if (rpc.reason === 'not_open_yet') {
            return { ok: false, reason: 'not_open_yet' }
          }
          if (isDailyClaimRpcUnavailable(rpc.reason)) {
            const local = claimLocally()
            if (local.ok) await cloud?.flushAppSave?.()
            return local
          }
          return { ok: false, reason: rpc.reason }
        }
      }

      const local = claimLocally()
      if (local.ok && useCloudWallet) await cloud?.flushAppSave?.()
      return local
    } finally {
      claimInFlightRef.current = false
    }
  }, [wallet, user?.id, useCloudWallet, patchWallet, cloud])

  return {
    wallet,
    dailyBonus,
    subscriptionTier: tier,
    monthlyTokenAllowance: monthlyTokens,
    patchWallet,
    addTokens,
    spendTokens,
    addMedals,
    spendMedals,
    dailyTokenBonusStatus,
    claimDailyTokenBonus,
    claimMonthlySubscriptionTokens,
  }
}
