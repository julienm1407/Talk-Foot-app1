import { useEffect, useRef } from 'react'
import { useMatches } from '../contexts/MatchesContext'
import { useOptionalCloudUserState } from '../contexts/CloudUserStateContext'
import { isSupabaseConfigured } from '../lib/supabase/isEnabled'
import type { Bet, BetMarket } from '../types/bet'
import type { Match } from '../types/match'
import { settleOpenBetsForMatch } from '../utils/betSettlement'
import { loadScorerEventsForMatch } from '../utils/matchScorerEvents'
import { normalizeWallet } from '../utils/walletNormalize'
import { useUserBets } from './useUserBets'
import { useWallet } from './useWallet'
import { useSubscription } from './useSubscription'
import { useXpGrant } from './useXpGrant'

const NON_SCORER_MARKETS: BetMarket[] = ['result_1x2', 'over25', 'exact_score']

function matchHasOpenBets(matchId: string, bets: Bet[]): boolean {
  return bets.some((b) => b.matchId === matchId && b.status === 'open')
}

function markSettledWhenDone(matchId: string, bets: Bet[], settled: Set<string>) {
  if (!matchHasOpenBets(matchId, bets)) settled.add(matchId)
}

/** Règle les paris ouverts quand un match passe « terminé » (même hors page Channel). */
export function useGlobalBetSettlement() {
  const { matches } = useMatches()
  const [bets, setBets] = useUserBets()
  const { patchWallet } = useWallet()
  const cloud = useOptionalCloudUserState()
  const { betTokenMultiplier } = useSubscription()
  const { grantBetWon } = useXpGrant()
  const settledMatchIdsRef = useRef<Set<string>>(new Set())
  const fetchingMatchIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const candidates = matches.filter((m) => {
      if (m.status !== 'finished') return false
      if (m.score?.home == null || m.score?.away == null) return false
      if (settledMatchIdsRef.current.has(m.id)) return false
      return matchHasOpenBets(m.id, bets)
    })

    if (!candidates.length) return

    let cancelled = false

    const settleMatch = async (match: Match, currentBets: Bet[]) => {
      const openOnMatch = currentBets.filter((b) => b.matchId === match.id && b.status === 'open')
      if (!openOnMatch.length) return { bets: currentBets, tokenDelta: 0, wonBetIds: [] as string[] }

      const home = match.score!.home!
      const away = match.score!.away!
      const totalGoals = home + away
      let nextBets = currentBets
      let tokenDelta = 0
      const wonBetIds: string[] = []

      const hasNonScorer = openOnMatch.some((b) => NON_SCORER_MARKETS.includes(b.market))
      if (hasNonScorer) {
        const result = settleOpenBetsForMatch(
          nextBets,
          match.id,
          { home, away },
          betTokenMultiplier,
          { markets: NON_SCORER_MARKETS },
        )
        wonBetIds.push(...result.newlyWonBetIds)
        nextBets = result.bets
        tokenDelta += result.tokenDelta
      }

      const needsScorer = nextBets.some(
        (b) => b.matchId === match.id && b.status === 'open' && b.market === 'anytime_scorer',
      )
      if (!needsScorer) return { bets: nextBets, tokenDelta, wonBetIds }

      if (fetchingMatchIdsRef.current.has(match.id)) {
        return { bets: nextBets, tokenDelta, wonBetIds }
      }
      fetchingMatchIdsRef.current.add(match.id)
      let scorerEvents: Awaited<ReturnType<typeof loadScorerEventsForMatch>> = []
      try {
        await new Promise((r) => window.setTimeout(r, 2000))
        if (cancelled) return { bets: nextBets, tokenDelta, wonBetIds }
        scorerEvents = await loadScorerEventsForMatch(match)
      } finally {
        fetchingMatchIdsRef.current.delete(match.id)
      }

      if (totalGoals > 0 && scorerEvents.length === 0 && match.sportMonksFixtureId) {
        return { bets: nextBets, tokenDelta, wonBetIds }
      }

      const scorerResult = settleOpenBetsForMatch(
        nextBets,
        match.id,
        { home, away },
        betTokenMultiplier,
        { markets: ['anytime_scorer'], scorerEvents },
      )
      wonBetIds.push(...scorerResult.newlyWonBetIds)
      return {
        bets: scorerResult.bets,
        tokenDelta: tokenDelta + scorerResult.tokenDelta,
        wonBetIds,
      }
    }

    void (async () => {
      if (isSupabaseConfigured() && cloud) {
        let workingBets = bets
        let totalDelta = 0
        let changed = false
        const allWonBetIds: string[] = []
        for (const match of candidates) {
          if (cancelled) return
          const openBefore = workingBets.filter((b) => b.matchId === match.id && b.status === 'open').length
          const result = await settleMatch(match, workingBets)
          workingBets = result.bets
          totalDelta += result.tokenDelta
          allWonBetIds.push(...result.wonBetIds)
          const openAfter = workingBets.filter((b) => b.matchId === match.id && b.status === 'open').length
          if (result.tokenDelta !== 0 || openBefore !== openAfter) changed = true
          markSettledWhenDone(match.id, workingBets, settledMatchIdsRef.current)
        }
        if (cancelled || !changed) return
        if (allWonBetIds.length) grantBetWon(allWonBetIds)
        const finalBets = workingBets
        const delta = totalDelta
        cloud.patchApp((prev) => {
          const w = normalizeWallet(prev.wallet)
          return {
            ...prev,
            bets: finalBets,
            wallet: delta ? { ...w, tokens: w.tokens + delta } : w,
          }
        })
        return
      }

      let nextBets = bets
      let tokenDelta = 0
      let changed = false
      const allWonBetIds: string[] = []
      for (const match of candidates) {
        if (cancelled) return
        const openBefore = nextBets.filter((b) => b.matchId === match.id && b.status === 'open').length
        const result = await settleMatch(match, nextBets)
        nextBets = result.bets
        tokenDelta += result.tokenDelta
        allWonBetIds.push(...result.wonBetIds)
        const openAfter = nextBets.filter((b) => b.matchId === match.id && b.status === 'open').length
        if (result.tokenDelta !== 0 || openBefore !== openAfter) changed = true
        markSettledWhenDone(match.id, nextBets, settledMatchIdsRef.current)
      }

      if (cancelled || !changed) return
      setBets(nextBets)
      if (tokenDelta) patchWallet((w) => ({ ...w, tokens: w.tokens + tokenDelta }))
      if (allWonBetIds.length) grantBetWon(allWonBetIds)
    })()

    return () => {
      cancelled = true
    }
  }, [matches, bets, setBets, patchWallet, cloud, betTokenMultiplier, grantBetWon])
}
