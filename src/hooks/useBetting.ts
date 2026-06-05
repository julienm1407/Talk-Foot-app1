import { useCallback, useMemo } from 'react'
import type { Bet, BetMarket, BetSelection } from '../types/bet'
import type { Match } from '../types/match'
import { betMatchLabelFromMatch } from '../utils/betMatchResolve'
import {
  normalizeWallet,
} from '../utils/walletNormalize'
import { betWinTokenCredit } from '../utils/subscriptionEntitlements'
import { settleOpenBetsForMatch } from '../utils/betSettlement'
import { useWallet } from './useWallet'
import { useUserBets } from './useUserBets'
import { useSubscription } from './useSubscription'
import { useOptionalCloudUserState } from '../contexts/CloudUserStateContext'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'

function clampStake(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(5, Math.min(250, Math.round(n)))
}

export function useBetting(matchId: string, matchForLabel?: Match | null) {
  const cloud = useOptionalCloudUserState()
  const { wallet, patchWallet } = useWallet()
  const { betTokenMultiplier: betMult } = useSubscription()
  const [bets, setBets] = useUserBets()

  const matchBets = useMemo(() => bets.filter((b) => b.matchId === matchId), [bets, matchId])
  const openBets = useMemo(() => matchBets.filter((b) => b.status === 'open'), [matchBets])

  const placeBet = useCallback(
    (market: BetMarket, selection: BetSelection, stakeRaw: number, odds: number) => {
      const stake = clampStake(stakeRaw)
      if (!matchId || !matchForLabel) {
        return { ok: false as const, reason: 'not_enough_tokens' as const }
      }
      if (wallet.tokens < stake) return { ok: false as const, reason: 'not_enough_tokens' as const }

      const id = `bet-${Date.now()}-${Math.random().toString(16).slice(2)}`
      const bet: Bet = {
        id,
        matchId,
        market,
        selection,
        stake,
        odds,
        status: 'open',
        placedAt: new Date().toISOString(),
        ...(matchForLabel ? { matchLabel: betMatchLabelFromMatch(matchForLabel) } : {}),
      }

      if (isSupabaseConfigured() && cloud) {
        cloud.patchApp((prev) => {
          const w = normalizeWallet(prev.wallet)
          if (w.tokens < stake) return prev
          return {
            ...prev,
            wallet: { ...w, tokens: w.tokens - stake },
            bets: [bet, ...prev.bets].slice(0, 200),
          }
        })
      } else {
        patchWallet((w) => ({ ...w, tokens: w.tokens - stake }))
        setBets((prev) => [bet, ...prev].slice(0, 200))
      }
      return { ok: true as const, bet }
    },
    [matchId, matchForLabel, setBets, patchWallet, wallet.tokens, cloud],
  )

  const cancelBet = useCallback(
    (betId: string) => {
      if (isSupabaseConfigured() && cloud) {
        cloud.patchApp((prev) => {
          const b = prev.bets.find((x) => x.id === betId)
          if (!b || b.status !== 'open') return prev
          const w = normalizeWallet(prev.wallet)
          return {
            ...prev,
            wallet: { ...w, tokens: w.tokens + b.stake },
            bets: prev.bets.map((x) =>
              x.id === betId
                ? { ...x, status: 'cancelled' as const, settledAt: new Date().toISOString() }
                : x,
            ),
          }
        })
        return
      }
      setBets((prev) => {
        const b = prev.find((x) => x.id === betId)
        if (!b || b.status !== 'open') return prev
        patchWallet((w) => ({ ...w, tokens: w.tokens + b.stake }))
        return prev.map((x) =>
          x.id === betId
            ? {
                ...x,
                status: 'cancelled' as const,
                settledAt: new Date().toISOString(),
              }
            : x,
        )
      })
    },
    [setBets, patchWallet, cloud],
  )

  const settleNextGoal = useCallback(
    (scoringSide: 'home' | 'away') => {
      const run = (bets: Bet[], now: string, mult: number) => {
        let delta = 0
        const next = bets.map((b) => {
          if (b.matchId !== matchId) return b
          if (b.status !== 'open') return b
          if (b.market !== 'next_goal') return b
          const won =
            (scoringSide === 'home' && b.selection === 'home') ||
            (scoringSide === 'away' && b.selection === 'away')
          if (won) {
            const payout = Math.round(b.stake * b.odds)
            delta += betWinTokenCredit(payout, b.stake, mult)
            return { ...b, status: 'won' as const, settledAt: now, payout }
          }
          return { ...b, status: 'lost' as const, settledAt: now, payout: 0 }
        })
        return { next, delta }
      }
      if (isSupabaseConfigured() && cloud) {
        cloud.patchApp((prev) => {
          const now = new Date().toISOString()
          const { next, delta } = run(prev.bets, now, betMult)
          const w = normalizeWallet(prev.wallet)
          return {
            ...prev,
            bets: next,
            wallet: delta ? { ...w, tokens: w.tokens + delta } : w,
          }
        })
        return
      }
      setBets((prev) => {
        const now = new Date().toISOString()
        const { next, delta } = run(prev, now, betMult)
        if (delta) patchWallet((w) => ({ ...w, tokens: w.tokens + delta }))
        return next
      })
    },
    [matchId, setBets, patchWallet, cloud, betMult],
  )

  const settleFirstGoal = useCallback(
    (scoringSide: 'home' | 'away') => {
      const run = (bets: Bet[], now: string, mult: number) => {
        let delta = 0
        const next = bets.map((b) => {
          if (b.matchId !== matchId) return b
          if (b.status !== 'open') return b
          if (b.market !== 'first_goal') return b
          const won =
            (scoringSide === 'home' && b.selection === 'home') ||
            (scoringSide === 'away' && b.selection === 'away')
          if (won) {
            const payout = Math.round(b.stake * b.odds)
            delta += betWinTokenCredit(payout, b.stake, mult)
            return { ...b, status: 'won' as const, settledAt: now, payout }
          }
          return { ...b, status: 'lost' as const, settledAt: now, payout: 0 }
        })
        return { next, delta }
      }
      if (isSupabaseConfigured() && cloud) {
        cloud.patchApp((prev) => {
          const now = new Date().toISOString()
          const { next, delta } = run(prev.bets, now, betMult)
          const w = normalizeWallet(prev.wallet)
          return {
            ...prev,
            bets: next,
            wallet: delta ? { ...w, tokens: w.tokens + delta } : w,
          }
        })
        return
      }
      setBets((prev) => {
        const now = new Date().toISOString()
        const { next, delta } = run(prev, now, betMult)
        if (delta) patchWallet((w) => ({ ...w, tokens: w.tokens + delta }))
        return next
      })
    },
    [matchId, setBets, patchWallet, cloud, betMult],
  )

  const settleMatchResult = useCallback(
    (
      finalScore: { home: number; away: number },
      opts?: {
        scorerEvents?: { side: 'home' | 'away'; slug: string; name?: string }[]
        /** Règle les paris de ce match (ex. après navigation, le hook courant peut être un autre `matchId`). */
        forMatchId?: string
      },
    ) => {
      const targetMatchId = opts?.forMatchId ?? matchId
      if (isSupabaseConfigured() && cloud) {
        cloud.patchApp((prev) => {
          const { bets: next, tokenDelta } = settleOpenBetsForMatch(
            prev.bets,
            targetMatchId,
            finalScore,
            betMult,
            { scorerEvents: opts?.scorerEvents },
          )
          const w = normalizeWallet(prev.wallet)
          return {
            ...prev,
            bets: next,
            wallet: tokenDelta ? { ...w, tokens: w.tokens + tokenDelta } : w,
          }
        })
        return
      }
      setBets((prev) => {
        const { bets: next, tokenDelta } = settleOpenBetsForMatch(
          prev,
          targetMatchId,
          finalScore,
          betMult,
          { scorerEvents: opts?.scorerEvents },
        )
        if (tokenDelta) patchWallet((w) => ({ ...w, tokens: w.tokens + tokenDelta }))
        return next
      })
    },
    [matchId, setBets, patchWallet, cloud, betMult],
  )

  const spendTokens = useCallback(
    (amount: number, _reason: string) => {
      if (wallet.tokens < amount) return { ok: false as const, reason: 'not_enough_tokens' as const }
      if (isSupabaseConfigured() && cloud) {
        cloud.patchApp((prev) => {
          const w = normalizeWallet(prev.wallet)
          if (w.tokens < amount) return prev
          return { ...prev, wallet: { ...w, tokens: w.tokens - amount } }
        })
      } else {
        patchWallet((w) => ({ ...w, tokens: w.tokens - amount }))
      }
      return { ok: true as const }
    },
    [patchWallet, wallet.tokens, cloud],
  )

  const stats = useMemo(() => {
    const decided = matchBets.filter((b) => b.status !== 'open')
    const won = decided.filter((b) => b.status === 'won').length
    const total = matchBets.length
    return { total, won }
  }, [matchBets])

  return {
    wallet,
    matchBets,
    openBets,
    stats,
    placeBet,
    cancelBet,
    settleNextGoal,
    settleFirstGoal,
    settleMatchResult,
    spendTokens,
  }
}

