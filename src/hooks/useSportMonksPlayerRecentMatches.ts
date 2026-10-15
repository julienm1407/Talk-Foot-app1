import { useEffect, useState } from 'react'
import { fetchSportMonksPlayerLatest } from '../api/sportMonks/sportMonksApi'
import {
  extractPlayerRecentMatchesFromSmPlayerPayload,
  type PlayerRecentMatch,
} from '../api/sportMonks/extractPlayerRecentMatchesFromSm'
import { getSportMonksToken } from '../utils/apiTokens'

const cache = new Map<string, PlayerRecentMatch[]>()

export function useSportMonksPlayerRecentMatches(
  playerId: number | null | undefined,
  excludeFixtureId?: number | null,
) {
  const [matches, setMatches] = useState<PlayerRecentMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (playerId == null || playerId <= 0) {
      setMatches([])
      setLoading(false)
      setError(null)
      return
    }
    const token = getSportMonksToken()
    if (!token) {
      setMatches([])
      setLoading(false)
      setError('Stats joueur indisponibles.')
      return
    }
    const key = `${playerId}:${excludeFixtureId ?? 0}`
    const hit = cache.get(key)
    if (hit) {
      setMatches(hit)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchSportMonksPlayerLatest(token, playerId)
      .then((json) => {
        if (cancelled) return
        const rows = extractPlayerRecentMatchesFromSmPlayerPayload(json, {
          excludeFixtureId: excludeFixtureId ?? undefined,
          limit: 6,
        })
        cache.set(key, rows)
        setMatches(rows)
      })
      .catch((err) => {
        if (cancelled) return
        if (import.meta.env.DEV) console.warn('[Talk Foot] player latest', err)
        setMatches([])
        setError('Impossible de charger les derniers matchs.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [playerId, excludeFixtureId])

  return { matches, loading, error }
}
