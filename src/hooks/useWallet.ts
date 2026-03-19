import { useCallback } from 'react'
import type { Wallet } from '../types/bet'
import { useLocalStorageState } from './useLocalStorage'

const WALLET_KEY = 'talkfoot.wallet.v1'

const defaultWallet: Wallet = { tokens: 750 }

function parseWallet(raw: unknown): Wallet {
  if (raw && typeof raw === 'object' && 'tokens' in raw && typeof (raw as Wallet).tokens === 'number') {
    return { tokens: Math.max(0, (raw as Wallet).tokens) }
  }
  return defaultWallet
}

export function useWallet() {
  const [raw, setRaw] = useLocalStorageState<Wallet>(WALLET_KEY, defaultWallet)
  const wallet = parseWallet(raw)

  const addTokens = useCallback(
    (amount: number) => {
      setRaw((w) => ({ ...parseWallet(w), tokens: parseWallet(w).tokens + amount }))
    },
    [setRaw],
  )

  const spendTokens = useCallback(
    (amount: number): { ok: boolean } => {
      const current = parseWallet(raw)
      if (current.tokens < amount) return { ok: false }
      setRaw((w) => ({ ...parseWallet(w), tokens: parseWallet(w).tokens - amount }))
      return { ok: true }
    },
    [raw, setRaw],
  )

  return { wallet, addTokens, spendTokens }
}
