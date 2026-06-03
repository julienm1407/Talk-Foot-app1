import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import type { Wallet } from '../types/bet'
import { useOptionalCloudUserState } from '../contexts/CloudUserStateContext'
import { useAuth, type AuthUser } from '../contexts/AuthContext'
import { isAdminEmail } from '../config/adminAccess'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import {
  configureWalletStore,
  getWalletSnapshot,
  patchWalletStore,
  subscribeWallet,
} from '../store/walletStore'
import { normalizeWallet } from '../utils/walletNormalize'

export const DAILY_TOKEN_BONUS_AMOUNT = 35
export const DAILY_TOKEN_BONUS_HOUR = 10
const DEV_ADMIN_DISPLAY_NAME = 'Dev TalkFoot 1'
const DEV_ADMIN_TEST_MEDALS = 3000
const DEV_ADMIN_TEST_TOKENS = 100_000
const DEV_ADMIN_EMAIL = 'mondetju1407@gmail.com'

function isWalletTestAdmin(user: AuthUser | null | undefined): boolean {
  if (!user) return false
  if (user.isAdmin) return true
  if (user.email?.toLowerCase() === DEV_ADMIN_EMAIL) return true
  if (user.displayName === DEV_ADMIN_DISPLAY_NAME) return true
  return isAdminEmail(user.email)
}

export type DailyTokenBonusStatus = {
  amount: number
  canClaim: boolean
  alreadyClaimedToday: boolean
  nextClaimAt: Date
  claimDayKey: string
}

function toLocalDayKey(date: Date): string {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function nextDailyBonusWindow(now = new Date()): { claimDayKey: string; nextClaimAt: Date } {
  const nextClaimAt = new Date(now)
  nextClaimAt.setHours(DAILY_TOKEN_BONUS_HOUR, 0, 0, 0)
  if (now >= nextClaimAt) {
    return { claimDayKey: toLocalDayKey(now), nextClaimAt }
  }
  return { claimDayKey: toLocalDayKey(nextClaimAt), nextClaimAt }
}

function buildDailyBonusStatus(wallet: Wallet): DailyTokenBonusStatus {
  const now = new Date()
  const { claimDayKey, nextClaimAt } = nextDailyBonusWindow(now)
  const alreadyClaimedToday = wallet.lastDailyTokenGrant === claimDayKey
  return {
    amount: DAILY_TOKEN_BONUS_AMOUNT,
    canClaim: now >= nextClaimAt && !alreadyClaimedToday,
    alreadyClaimedToday,
    nextClaimAt,
    claimDayKey,
  }
}

export function useWallet() {
  const { user } = useAuth()
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

  const devWalletSeeded = useRef(false)
  useEffect(() => {
    if (!user?.id || devWalletSeeded.current) return
    if (!isWalletTestAdmin(user)) return

    const needsMedals = wallet.medals < DEV_ADMIN_TEST_MEDALS
    const needsTokens = wallet.tokens < DEV_ADMIN_TEST_TOKENS
    if (!needsMedals && !needsTokens) {
      devWalletSeeded.current = true
      return
    }

    devWalletSeeded.current = true
    patchWallet((w) => ({
      ...w,
      ...(needsMedals ? { medals: DEV_ADMIN_TEST_MEDALS } : {}),
      ...(needsTokens ? { tokens: DEV_ADMIN_TEST_TOKENS } : {}),
    }))
    void cloud?.flushAppSave?.()
  }, [
    user?.id,
    user?.email,
    user?.displayName,
    user?.isAdmin,
    wallet.medals,
    wallet.tokens,
    patchWallet,
    cloud,
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

  const dailyBonus = useMemo(() => buildDailyBonusStatus(wallet), [wallet])

  const dailyTokenBonusStatus = useCallback(() => dailyBonus, [dailyBonus])

  const claimDailyTokenBonus = useCallback((): {
    ok: boolean
    amount?: number
    reason?: string
  } => {
    const now = new Date()
    const { claimDayKey, nextClaimAt } = nextDailyBonusWindow(now)
    let out: { ok: boolean; amount?: number; reason?: string } = { ok: false, reason: 'unknown' }
    patchWallet((w) => {
      if (now < nextClaimAt) {
        out = { ok: false, reason: 'not_open_yet' }
        return w
      }
      if (w.lastDailyTokenGrant === claimDayKey) {
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
    if (out.ok) void cloud?.flushAppSave?.()
    return out
  }, [patchWallet, cloud])

  return {
    wallet,
    dailyBonus,
    patchWallet,
    addTokens,
    spendTokens,
    addMedals,
    spendMedals,
    dailyTokenBonusStatus,
    claimDailyTokenBonus,
  }
}
