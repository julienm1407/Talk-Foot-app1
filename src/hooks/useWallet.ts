import { useCallback } from 'react'
import type { Wallet } from '../types/bet'
import { useLocalStorageState } from './useLocalStorage'
import {
  DEFAULT_WALLET,
  normalizeWallet,
  isWalletStored,
  WALLET_STORAGE_KEY,
} from '../utils/walletNormalize'
import { useOptionalCloudUserState } from '../contexts/CloudUserStateContext'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'

const DAILY_TOKEN_BONUS_AMOUNT = 35
const DAILY_TOKEN_BONUS_HOUR = 10

type DailyTokenBonusStatus = {
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

export function useWallet() {
  const cloud = useOptionalCloudUserState()
  const persistLocal = !isSupabaseConfigured()
  const [localRaw, setLocalRaw] = useLocalStorageState<Wallet>(
    WALLET_STORAGE_KEY,
    DEFAULT_WALLET,
    isWalletStored,
    { persist: persistLocal },
  )
  const raw = cloud !== undefined ? cloud.app.wallet : localRaw
  const wallet = normalizeWallet(raw)

  const patchWallet = useCallback(
    (fn: (w: Wallet) => Wallet) => {
      if (cloud) {
        cloud.patchApp((prev) => ({
          ...prev,
          wallet: fn(normalizeWallet(prev.wallet)),
        }))
      } else {
        setLocalRaw((prev) => fn(normalizeWallet(prev)))
      }
    },
    [cloud, setLocalRaw],
  )

  const addTokens = useCallback(
    (amount: number) => {
      patchWallet((w) => ({ ...w, tokens: w.tokens + amount }))
    },
    [patchWallet],
  )

  const spendTokens = useCallback(
    (amount: number): { ok: boolean } => {
      let ok = false
      patchWallet((w) => {
        if (w.tokens < amount) return w
        ok = true
        return { ...w, tokens: w.tokens - amount }
      })
      return { ok }
    },
    [patchWallet],
  )

  const addMedals = useCallback(
    (amount: number) => {
      patchWallet((w) => ({ ...w, medals: w.medals + amount }))
    },
    [patchWallet],
  )

  const spendMedals = useCallback(
    (amount: number): { ok: boolean } => {
      let ok = false
      patchWallet((w) => {
        if (w.medals < amount) return w
        ok = true
        return { ...w, medals: w.medals - amount }
      })
      return { ok }
    },
    [patchWallet],
  )

  const dailyTokenBonusStatus = useCallback((): DailyTokenBonusStatus => {
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
  }, [wallet.lastDailyTokenGrant])

  const claimDailyTokenBonus = useCallback((): { ok: boolean; amount?: number; reason?: string } => {
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
      return { ...w, tokens: w.tokens + DAILY_TOKEN_BONUS_AMOUNT, lastDailyTokenGrant: claimDayKey }
    })
    return out
  }, [patchWallet])

  return {
    wallet,
    patchWallet,
    addTokens,
    spendTokens,
    addMedals,
    spendMedals,
    dailyTokenBonusStatus,
    claimDailyTokenBonus,
  }
}
