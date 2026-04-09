import type { Wallet } from '../types/bet'

export const WALLET_STORAGE_KEY = 'talkfoot.wallet.v1'

export const DEFAULT_WALLET: Wallet = {
  tokens: 750,
  medals: 120,
}

/** Fusionne les anciens saves (jetons seuls) avec les champs médailles / bonus quotidien. */
export function normalizeWallet(raw: unknown): Wallet {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_WALLET }
  }
  const o = raw as Record<string, unknown>
  const tokens = typeof o.tokens === 'number' && Number.isFinite(o.tokens) ? Math.max(0, o.tokens) : DEFAULT_WALLET.tokens
  const medals =
    typeof o.medals === 'number' && Number.isFinite(o.medals) ? Math.max(0, o.medals) : DEFAULT_WALLET.medals
  const lastDailyTokenGrant =
    typeof o.lastDailyTokenGrant === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.lastDailyTokenGrant)
      ? o.lastDailyTokenGrant
      : undefined
  return { tokens, medals, lastDailyTokenGrant }
}

export function isWalletStored(p: unknown): boolean {
  return (
    p !== null &&
    typeof p === 'object' &&
    !Array.isArray(p) &&
    typeof (p as Wallet).tokens === 'number'
  )
}
