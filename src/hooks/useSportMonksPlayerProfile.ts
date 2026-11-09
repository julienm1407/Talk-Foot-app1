import { useEffect, useState } from 'react'
import { fetchSportMonksPlayer } from '../api/sportMonks/sportMonksApi'
import {
  extractPlayerProfileFromSmPayload,
  type PlayerProfile,
} from '../api/sportMonks/extractPlayerProfileFromSm'
import { getSportMonksToken } from '../utils/apiTokens'

const cache = new Map<string, PlayerProfile>()

export function useSportMonksPlayerProfile(
  playerId: number | null | undefined,
  excludeFixtureId?: number | null,
) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (playerId == null || playerId <= 0) {
      setProfile(null)
      setLoading(false)
      setError(null)
      return
    }
    const token = getSportMonksToken()
    if (!token) {
      setProfile(null)
      setLoading(false)
      setError('Fiche joueur indisponible.')
      return
    }
    const key = `${playerId}:${excludeFixtureId ?? 0}`
    const hit = cache.get(key)
    if (hit) {
      setProfile(hit)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchSportMonksPlayer(token, playerId)
      .then((json) => {
        if (cancelled) return
        const next = extractPlayerProfileFromSmPayload(json, {
          excludeFixtureId: excludeFixtureId ?? undefined,
          matchLimit: 12,
        })
        if (!next) {
          setProfile(null)
          setError('Fiche joueur introuvable.')
          return
        }
        cache.set(key, next)
        setProfile(next)
      })
      .catch((err) => {
        if (cancelled) return
        if (import.meta.env.DEV) console.warn('[Talk Foot] player profile', err)
        setProfile(null)
        setError('Impossible de charger la fiche joueur.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [playerId, excludeFixtureId])

  return { profile, loading, error }
}
