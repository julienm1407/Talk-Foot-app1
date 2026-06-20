import type { UserAppStateV1 } from '../data/userAppStateDefaults'
import type { Bet } from '../types/bet'
import { betWinTokenCredit } from './subscriptionEntitlements'
import { normalizeWallet } from './walletNormalize'

/** Paris gagnés réglés dans cette fenêtre peuvent être recrédités si le wallet a été écrasé. */
export const BET_TOKEN_RECONCILE_WINDOW_DAYS = 45

function betPayout(bet: Bet): number {
  if (bet.payout != null && bet.payout > 0) return bet.payout
  return Math.round(bet.stake * bet.odds)
}

function betWinCredit(bet: Bet, tokenMultiplier: number): number {
  const payout = betPayout(bet)
  if (payout <= 0) return 0
  return betWinTokenCredit(payout, bet.stake, tokenMultiplier)
}

function isWithinReconcileWindow(settledAt: string | undefined, now: Date): boolean {
  if (!settledAt) return true
  const settled = new Date(settledAt)
  if (Number.isNaN(settled.getTime())) return true
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - BET_TOKEN_RECONCILE_WINDOW_DAYS)
  return settled >= cutoff
}

/** Crédite les gains des paris gagnés dont les jetons n’ont pas encore été appliqués au wallet. */
export function reconcileBetTokenCredits(
  app: UserAppStateV1,
  tokenMultiplier: number,
  opts?: { now?: Date },
): { app: UserAppStateV1; tokenDelta: number; reconciledBetIds: string[] } {
  const now = opts?.now ?? new Date()
  let tokenDelta = 0
  const reconciledBetIds: string[] = []
  let betsChanged = false

  const bets = app.bets.map((bet) => {
    if (bet.status !== 'won' || bet.tokenCreditApplied) return bet

    const payout = betPayout(bet)
    if (payout <= 0) {
      betsChanged = true
      return { ...bet, tokenCreditApplied: true }
    }

    if (!isWithinReconcileWindow(bet.settledAt, now)) {
      betsChanged = true
      return { ...bet, payout, tokenCreditApplied: true }
    }

    const credit = betWinCredit(bet, tokenMultiplier)
    if (credit <= 0) {
      betsChanged = true
      return { ...bet, payout, tokenCreditApplied: true }
    }

    const wallet = normalizeWallet(app.wallet)
    if (wallet.tokens >= credit + 50) {
      betsChanged = true
      return { ...bet, payout, tokenCreditApplied: true }
    }

    tokenDelta += credit
    reconciledBetIds.push(bet.id)
    betsChanged = true
    return { ...bet, payout, tokenCreditApplied: true }
  })

  if (!betsChanged && tokenDelta === 0) {
    return { app, tokenDelta: 0, reconciledBetIds: [] }
  }

  const w = normalizeWallet(app.wallet)
  return {
    app: {
      ...app,
      bets,
      wallet: tokenDelta > 0 ? { ...w, tokens: w.tokens + tokenDelta } : w,
    },
    tokenDelta,
    reconciledBetIds,
  }
}
