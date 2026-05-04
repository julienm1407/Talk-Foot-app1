import { useEffect, useRef, useState } from 'react'
import {
  extractFixtureTrendRowsFromSmFixture,
  extractSmRecentFormFromFixture,
  fetchSportMonksFixtureTrends,
  type FixtureTrendDisplayRow,
} from '../api/sportMonks'
import type { FormResult } from '../types/standings'
import { getSportMonksToken } from '../utils/apiTokens'
import { useVisibilityAwareInterval } from './useVisibilityAwareInterval'

const POLL_LIVE_MS = 120_000
const POLL_UPCOMING_MS = 180_000

/**
 * Tendances par équipe (`GET /fixtures/{id}` + `trends.type`, `trends.participant`).
 */
export function useSportMonksFixtureTrends(
  sportMonksFixtureId: number | undefined,
  matchStatus: 'upcoming' | 'live' | 'finished',
) {
  const [rows, setRows] = useState<FixtureTrendDisplayRow[]>([])
  const [recentForm, setRecentForm] = useState<{ home: FormResult[]; away: FormResult[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const cancelledRef = useRef(false)
  const runRef = useRef<() => void>(() => {})

  const pollMs =
    matchStatus === 'live' ? POLL_LIVE_MS : matchStatus === 'upcoming' ? POLL_UPCOMING_MS : 0
  const pollEnabled = Boolean(sportMonksFixtureId && pollMs > 0)

  useEffect(() => {
    if (!sportMonksFixtureId) {
      setRows([])
      setRecentForm(null)
      setLoading(false)
      return
    }
    const token = getSportMonksToken()
    if (!token) {
      setRows([])
      setRecentForm(null)
      setLoading(false)
      return
    }

    cancelledRef.current = false

    const run = () => {
      setLoading(true)
      fetchSportMonksFixtureTrends(token, sportMonksFixtureId)
        .then((fx) => {
          if (cancelledRef.current || !fx) return
          setRows(extractFixtureTrendRowsFromSmFixture(fx))
          setRecentForm(extractSmRecentFormFromFixture(fx))
        })
        .catch(() => {
          if (!cancelledRef.current) {
            setRows([])
            setRecentForm(null)
          }
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

  return { trendRows: rows, trendsLoading: loading, trendRecentForm: recentForm }
}
