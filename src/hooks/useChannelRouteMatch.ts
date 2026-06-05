import { useEffect, useMemo, useState } from 'react'
import type { Match } from '../types/match'
import { useMatches } from '../contexts/MatchesContext'
import { fetchMatchByTalkFootId, readBetMatchCache } from '../utils/betMatchResolve'
import { readMatchesSessionCache } from '../utils/matchesSessionCache'

function matchFromLocalSources(matchId: string, matches: Match[]): Match | null {
  const fromList = matches.find((m) => m.id === matchId)
  if (fromList) return fromList
  const cache = readBetMatchCache()[matchId]
  if (cache) return cache
  for (const m of readMatchesSessionCache()) {
    if (m.id === matchId) return m
  }
  for (const m of Object.values(readBetMatchCache())) {
    if (m.id === matchId) return m
  }
  return null
}

/**
 * Résout le match demandé par l’URL `/channel/:matchId` sans basculer sur un autre match.
 */
export function useChannelRouteMatch(matchId: string | undefined) {
  const { matches, loading: matchesLoading } = useMatches()
  const [fetched, setFetched] = useState<Match | null>(null)
  const [fetching, setFetching] = useState(false)
  const [fetchFailed, setFetchFailed] = useState(false)

  const localMatch = useMemo(() => {
    if (!matchId) return null
    return matchFromLocalSources(matchId, matches)
  }, [matchId, matches])

  useEffect(() => {
    if (!matchId) {
      setFetched(null)
      setFetching(false)
      setFetchFailed(false)
      return
    }
    if (localMatch) {
      setFetched(localMatch)
      setFetching(false)
      setFetchFailed(false)
      return
    }

    let cancelled = false
    setFetching(true)
    setFetchFailed(false)
    void fetchMatchByTalkFootId(matchId).then((m) => {
      if (cancelled) return
      setFetched(m)
      setFetching(false)
      setFetchFailed(!m)
    })

    return () => {
      cancelled = true
    }
  }, [matchId, localMatch])

  const routeMatch = localMatch ?? fetched
  const hasRouteMatchId = Boolean(matchId)
  const waitingRouteResolution =
    hasRouteMatchId && (matchesLoading || fetching) && !routeMatch

  return {
    routeMatch,
    hasRouteMatchId,
    waitingRouteResolution,
    routeNotFound: hasRouteMatchId && !waitingRouteResolution && !routeMatch && fetchFailed,
  }
}
