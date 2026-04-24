import { useEffect, useState } from 'react'
import { extractMatchXGFromFixture, fetchSportMonksFixtureWithXG, type SmMatchXGTotals } from '../api/sportMonks'
import { getSportMonksToken } from '../utils/apiTokens'

/**
 * xG cumulés domicile / extérieur (`GET /fixtures/{id}` + include `xGFixture`…).
 * Rafraîchissement léger en live pour suivre l’évolution.
 */
export function useSportMonksFixtureXG(
  sportMonksFixtureId: number | undefined,
  matchStatus: 'upcoming' | 'live' | 'finished',
) {
  const [xg, setXg] = useState<SmMatchXGTotals | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sportMonksFixtureId) {
      setXg(null)
      setLoading(false)
      return
    }
    const token = getSportMonksToken()
    if (!token) {
      setXg(null)
      setLoading(false)
      return
    }

    let cancelled = false
    const pollMs = matchStatus === 'live' ? 90_000 : matchStatus === 'upcoming' ? 120_000 : 0

    const run = () => {
      setLoading(true)
      fetchSportMonksFixtureWithXG(token, sportMonksFixtureId)
        .then((fx) => {
          if (cancelled || !fx) return
          setXg(extractMatchXGFromFixture(fx))
        })
        .catch(() => {
          if (!cancelled) setXg(null)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }

    run()
    if (!pollMs) return () => {
      cancelled = true
    }

    const id = window.setInterval(run, pollMs)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [sportMonksFixtureId, matchStatus])

  return { xgTotals: xg, xgLoading: loading }
}
