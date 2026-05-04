import { useEffect, useRef, useState } from 'react'
import { extractMatchXGFromFixture, fetchSportMonksFixtureWithXG, type SmMatchXGTotals } from '../api/sportMonks'
import { getSportMonksToken } from '../utils/apiTokens'
import { useVisibilityAwareInterval } from './useVisibilityAwareInterval'

const POLL_LIVE_MS = 120_000
const POLL_UPCOMING_MS = 180_000

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
  const cancelledRef = useRef(false)
  const runRef = useRef<() => void>(() => {})

  const pollMs =
    matchStatus === 'live' ? POLL_LIVE_MS : matchStatus === 'upcoming' ? POLL_UPCOMING_MS : 0
  const pollEnabled = Boolean(sportMonksFixtureId && pollMs > 0)

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

    cancelledRef.current = false

    const run = () => {
      setLoading(true)
      fetchSportMonksFixtureWithXG(token, sportMonksFixtureId)
        .then((fx) => {
          if (cancelledRef.current || !fx) return
          setXg(extractMatchXGFromFixture(fx))
        })
        .catch(() => {
          if (!cancelledRef.current) setXg(null)
        })
        .finally(() => {
          if (!cancelledRef.current) setLoading(false)
        })
    }

    runRef.current = run
    if (!pollMs) void run()

    return () => {
      cancelledRef.current = true
    }
  }, [sportMonksFixtureId, matchStatus, pollMs])

  useVisibilityAwareInterval(() => runRef.current(), pollMs, pollEnabled)

  return { xgTotals: xg, xgLoading: loading }
}
