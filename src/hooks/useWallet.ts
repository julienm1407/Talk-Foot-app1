import { useCallback } from 'react'
import type { Wallet } from '../types/bet'
import { useLocalStorageState } from './useLocalStorage'
import {
  DEFAULT_WALLET,
  normalizeWallet,
  isWalletStored,
  WALLET_STORAGE_KEY,
} from '../utils/walletNormalize'

export function useWallet() {
  const [raw, setRaw] = useLocalStorageState<Wallet>(
    WALLET_STORAGE_KEY,
    DEFAULT_WALLET,
    isWalletStored,
  )
  const wallet = normalizeWallet(raw)

  const addTokens = useCallback(
    (amount: number) => {
      setRaw((prev) => {
        const w = normalizeWallet(prev)
        return { ...w, tokens: w.tokens + amount }
      })
    },
    [setRaw],
  )

  const spendTokens = useCallback(
    (amount: number): { ok: boolean } => {
      let ok = false
      setRaw((prev) => {
        const w = normalizeWallet(prev)
        if (w.tokens < amount) return prev as Wallet
        ok = true
        return { ...w, tokens: w.tokens - amount }
      })
      return { ok }
    },
    [setRaw],
  )

  const addMedals = useCallback(
    (amount: number) => {
      setRaw((prev) => {
        const w = normalizeWallet(prev)
        return { ...w, medals: w.medals + amount }
      })
    },
    [setRaw],
  )

  const spendMedals = useCallback(
    (amount: number): { ok: boolean } => {
      let ok = false
      setRaw((prev) => {
        const w = normalizeWallet(prev)
        if (w.medals < amount) return prev as Wallet
        ok = true
        return { ...w, medals: w.medals - amount }
      })
      return { ok }
    },
    [setRaw],
  )

  const claimDailyTokenBonus = useCallback((): { ok: boolean; amount?: number; reason?: string } => {
    const today = new Date().toISOString().slice(0, 10)
    let out: { ok: boolean; amount?: number; reason?: string } = { ok: false, reason: 'unknown' }
    setRaw((prev) => {
      const w = normalizeWallet(prev)
      if (w.lastDailyTokenGrant === today) {
        out = { ok: false, reason: 'already_claimed' }
        return prev as Wallet
      }
      out = { ok: true, amount: 35 }
      return { ...w, tokens: w.tokens + 35, lastDailyTokenGrant: today }
    })
    return out
  }, [setRaw])

  return {
    wallet,
    addTokens,
    spendTokens,
    addMedals,
    spendMedals,
    claimDailyTokenBonus,
  }
}
