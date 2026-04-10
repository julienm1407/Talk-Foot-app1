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

  const claimDailyTokenBonus = useCallback((): { ok: boolean; amount?: number; reason?: string } => {
    const today = new Date().toISOString().slice(0, 10)
    let out: { ok: boolean; amount?: number; reason?: string } = { ok: false, reason: 'unknown' }
    patchWallet((w) => {
      if (w.lastDailyTokenGrant === today) {
        out = { ok: false, reason: 'already_claimed' }
        return w
      }
      out = { ok: true, amount: 35 }
      return { ...w, tokens: w.tokens + 35, lastDailyTokenGrant: today }
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
    claimDailyTokenBonus,
  }
}
