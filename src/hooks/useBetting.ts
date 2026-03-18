import { useCallback, useMemo } from 'react'
import type { Bet, BetMarket, BetSelection, Wallet } from '../types/bet'
import { useLocalStorageState } from './useLocalStorage'

const WALLET_KEY = 'talkfoot.wallet.v1'
const BETS_KEY = 'talkfoot.bets.v1'

function clampStake(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(5, Math.min(250, Math.round(n)))
}

export function useBetting(matchId: string) {
  const [wallet, setWallet] = useLocalStorageState<Wallet>(WALLET_KEY, {
    tokens: 750,
  })
  const [bets, setBets] = useLocalStorageState<Bet[]>(BETS_KEY, [])

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

      setWallet((w) => ({ ...w, tokens: w.tokens - stake }))
      setBets((prev) => [bet, ...prev].slice(0, 200))
      return { ok: true as const, bet }
    },
    [matchId, setBets, setWallet, wallet.tokens],
  )

  const cancelBet = useCallback(
    (betId: string) => {
      setBets((prev) => {
        const b = prev.find((x) => x.id === betId)
        if (!b || b.status !== 'open') return prev
        setWallet((w) => ({ ...w, tokens: w.tokens + b.stake }))
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
    [setBets, setWallet],
  )

  const settleNextGoal = useCallback(
    (scoringSide: 'home' | 'away') => {
      setBets((prev) => {
        const now = new Date().toISOString()
        let delta = 0
        const next = prev.map((b) => {
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
        if (delta) setWallet((w) => ({ ...w, tokens: w.tokens + delta }))
        return next
      })
    },
    [matchId, setBets, setWallet],
  )

  const settleFirstGoal = useCallback(
    (scoringSide: 'home' | 'away') => {
      setBets((prev) => {
        const now = new Date().toISOString()
        let delta = 0
        const next = prev.map((b) => {
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
        if (delta) setWallet((w) => ({ ...w, tokens: w.tokens + delta }))
        return next
      })
    },
    [matchId, setBets, setWallet],
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
  }
}

