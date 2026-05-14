import { useCallback, useMemo } from 'react'
import type { Bet, BetMarket, BetSelection } from '../types/bet'
import {
  normalizeWallet,
} from '../utils/walletNormalize'
import { useWallet } from './useWallet'
import { useUserBets } from './useUserBets'
import { useOptionalCloudUserState } from '../contexts/CloudUserStateContext'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'

function clampStake(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(5, Math.min(250, Math.round(n)))
}

export function useBetting(matchId: string) {
  const cloud = useOptionalCloudUserState()
  const { wallet, patchWallet } = useWallet()
  const [bets, setBets] = useUserBets()

  const matchBets = useMemo(() => bets.filter((b) => b.matchId === matchId), [bets, matchId])
  const openBets = useMemo(() => matchBets.filter((b) => b.status === 'open'), [matchBets])

  const placeBet = useCallback(
    (market: BetMarket, selection: BetSelection, stakeRaw: number, odds: number) => {
      const stake = clampStake(stakeRaw)
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
    [matchId, setBets, patchWallet, wallet.tokens, cloud],
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
      const run = (bets: Bet[], now: string) => {
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
            delta += payout
            return { ...b, status: 'won' as const, settledAt: now, payout }
          }
          return { ...b, status: 'lost' as const, settledAt: now, payout: 0 }
        })
        return { next, delta }
      }
      if (isSupabaseConfigured() && cloud) {
        cloud.patchApp((prev) => {
          const now = new Date().toISOString()
          const { next, delta } = run(prev.bets, now)
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
        const { next, delta } = run(prev, now)
        if (delta) patchWallet((w) => ({ ...w, tokens: w.tokens + delta }))
        return next
      })
    },
    [matchId, setBets, patchWallet, cloud],
  )

  const settleFirstGoal = useCallback(
    (scoringSide: 'home' | 'away') => {
      const run = (bets: Bet[], now: string) => {
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
            delta += payout
            return { ...b, status: 'won' as const, settledAt: now, payout }
          }
          return { ...b, status: 'lost' as const, settledAt: now, payout: 0 }
        })
        return { next, delta }
      }
      if (isSupabaseConfigured() && cloud) {
        cloud.patchApp((prev) => {
          const now = new Date().toISOString()
          const { next, delta } = run(prev.bets, now)
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
        const { next, delta } = run(prev, now)
        if (delta) patchWallet((w) => ({ ...w, tokens: w.tokens + delta }))
        return next
      })
    },
    [matchId, setBets, patchWallet, cloud],
  )

  const settleMatchResult = useCallback(
    (
      finalScore: { home: number; away: number },
      opts?: {
        scorerEvents?: { side: 'home' | 'away'; slug: string }[]
        /** Règle les paris de ce match (ex. après navigation, le hook courant peut être un autre `matchId`). */
        forMatchId?: string
      },
    ) => {
      const targetMatchId = opts?.forMatchId ?? matchId
      const run = (bets: Bet[], now: string) => {
        let delta = 0
        const { home, away } = finalScore
        const totalGoals = home + away
        const homeWins = home > away
        const awayWins = away > home
        const isDraw = home === away
        const scoreKeyMap: Record<string, [number, number]> = {
          '00': [0, 0],
          '10': [1, 0],
          '20': [2, 0],
          '21': [2, 1],
          '11': [1, 1],
          '01': [0, 1],
          '12': [1, 2],
        }
        const scorerEvents = opts?.scorerEvents ?? []
        const next = bets.map((b) => {
          if (b.matchId !== targetMatchId) return b
          if (b.status !== 'open') return b
          if (b.market === 'result_1x2') {
            const won =
              (b.selection === 'home' && homeWins) ||
              (b.selection === 'draw' && isDraw) ||
              (b.selection === 'away' && awayWins)
            if (won) {
              const payout = Math.round(b.stake * b.odds)
              delta += payout
              return { ...b, status: 'won' as const, settledAt: now, payout }
            }
            return { ...b, status: 'lost' as const, settledAt: now, payout: 0 }
          }
          if (b.market === 'over25') {
            const won =
              (b.selection === 'over' && totalGoals > 2) ||
              (b.selection === 'under' && totalGoals <= 2)
            if (won) {
              const payout = Math.round(b.stake * b.odds)
              delta += payout
              return { ...b, status: 'won' as const, settledAt: now, payout }
            }
            return { ...b, status: 'lost' as const, settledAt: now, payout: 0 }
          }
          if (b.market === 'exact_score') {
            const exp = scoreKeyMap[b.selection as keyof typeof scoreKeyMap]
            const won = Boolean(exp && exp[0] === home && exp[1] === away)
            if (won) {
              const payout = Math.round(b.stake * b.odds)
              delta += payout
              return { ...b, status: 'won' as const, settledAt: now, payout }
            }
            return { ...b, status: 'lost' as const, settledAt: now, payout: 0 }
          }
          if (b.market === 'anytime_scorer' && typeof b.selection === 'string' && b.selection.startsWith('scor:')) {
            const rest = b.selection.slice('scor:'.length)
            const idx = rest.indexOf(':')
            if (idx === -1) return { ...b, status: 'lost' as const, settledAt: now, payout: 0 }
            const side = rest.slice(0, idx) as 'home' | 'away'
            const slug = rest.slice(idx + 1)
            const won = scorerEvents.some((e) => e.side === side && e.slug === slug)
            if (won) {
              const payout = Math.round(b.stake * b.odds)
              delta += payout
              return { ...b, status: 'won' as const, settledAt: now, payout }
            }
            return { ...b, status: 'lost' as const, settledAt: now, payout: 0 }
          }
          return b
        })
        return { next, delta }
      }
      if (isSupabaseConfigured() && cloud) {
        cloud.patchApp((prev) => {
          const now = new Date().toISOString()
          const { next, delta } = run(prev.bets, now)
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
        const { next, delta } = run(prev, now)
        if (delta) patchWallet((w) => ({ ...w, tokens: w.tokens + delta }))
        return next
      })
    },
    [matchId, setBets, patchWallet, cloud],
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

