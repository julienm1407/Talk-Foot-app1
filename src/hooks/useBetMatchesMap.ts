import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Bet } from '../types/bet'
import type { Match } from '../types/match'
import { useMatches } from '../contexts/MatchesContext'
import { useUserBets } from './useUserBets'
import { readMatchesSessionCache } from '../utils/matchesSessionCache'
import {
  enrichBetWithMatchLabel,
  fetchMatchByTalkFootId,
  parseSportMonksFixtureIdFromMatchId,
  readBetMatchCache,
  resolveBetMatch,
  syntheticMatchFromBetLabel,
} from '../utils/betMatchResolve'

/**
 * Résout les matchs liés aux paris : calendrier live, cache session, snapshot au pari, ou fetch SportMonks.
 */
export function useBetMatchesMap(bets: Bet[]) {
  const { matches, loading: matchesLoading } = useMatches()
  const [, setBets] = useUserBets()
  const [fetchedById, setFetchedById] = useState<Record<string, Match>>(() => readBetMatchCache())
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(() => new Set())
  const inflightRef = useRef<Set<string>>(new Set())
  const backfilledRef = useRef<Set<string>>(new Set())

  const liveById = useMemo(() => {
    const map = new Map<string, Match>()
    for (const m of matches) map.set(m.id, m)
    for (const m of readMatchesSessionCache()) {
      if (!map.has(m.id)) map.set(m.id, m)
    }
    for (const [id, m] of Object.entries(fetchedById)) {
      if (!map.has(id)) map.set(id, m)
    }
    return map
  }, [matches, fetchedById])

  const missingFetchIds = useMemo(() => {
    const out = new Set<string>()
    for (const bet of bets) {
      if (liveById.has(bet.matchId)) continue
      if (syntheticMatchFromBetLabel(bet)) continue
      if (!parseSportMonksFixtureIdFromMatchId(bet.matchId)) continue
      if (inflightRef.current.has(bet.matchId)) continue
      out.add(bet.matchId)
    }
    return [...out]
  }, [bets, liveById])

  useEffect(() => {
    if (!missingFetchIds.length) {
      setResolvingIds(new Set())
      return
    }
    setResolvingIds(new Set(missingFetchIds))
    let cancelled = false

    void (async () => {
      for (const matchId of missingFetchIds) {
        if (cancelled || inflightRef.current.has(matchId)) continue
        inflightRef.current.add(matchId)
        const m = await fetchMatchByTalkFootId(matchId)
        inflightRef.current.delete(matchId)
        if (cancelled) return
        setResolvingIds((prev) => {
          const next = new Set(prev)
          next.delete(matchId)
          return next
        })
        if (!m) continue
        setFetchedById((prev) => (prev[matchId] ? prev : { ...prev, [matchId]: m }))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [missingFetchIds])

  useEffect(() => {
    const patches: Bet[] = []
    for (const bet of bets) {
      if (bet.matchLabel || backfilledRef.current.has(bet.id)) continue
      const match = liveById.get(bet.matchId)
      if (!match) continue
      backfilledRef.current.add(bet.id)
      patches.push(enrichBetWithMatchLabel(bet, match))
    }
    if (!patches.length) return
    setBets((prev) =>
      prev.map((b) => {
        const patch = patches.find((p) => p.id === b.id)
        return patch ?? b
      }),
    )
  }, [bets, liveById, setBets])

  const getBetMatch = useCallback(
    (bet: Bet): Match | null => {
      const live = liveById.get(bet.matchId) ?? null
      return resolveBetMatch(bet, live)
    },
    [liveById],
  )

  const isBetMatchResolving = useCallback(
    (bet: Bet): boolean => {
      if (getBetMatch(bet)) return false
      if (resolvingIds.has(bet.matchId)) return true
      if (inflightRef.current.has(bet.matchId)) return true
      if (matchesLoading && !bet.matchLabel && parseSportMonksFixtureIdFromMatchId(bet.matchId)) {
        return true
      }
      return false
    },
    [getBetMatch, matchesLoading, resolvingIds],
  )

  return { getBetMatch, isBetMatchResolving }
}
