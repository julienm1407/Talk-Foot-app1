import { useEffect, useState } from 'react'
import {
  extractFixtureTrendRowsFromSmFixture,
  extractSmRecentFormFromFixture,
  fetchSportMonksFixtureTrends,
  type FixtureTrendDisplayRow,
} from '../api/sportMonks'
import type { FormResult } from '../types/standings'
import { getSportMonksToken } from '../utils/apiTokens'

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

    let cancelled = false
    const pollMs = matchStatus === 'live' ? 90_000 : matchStatus === 'upcoming' ? 120_000 : 0

    const run = () => {
      setLoading(true)
      fetchSportMonksFixtureTrends(token, sportMonksFixtureId)
        .then((fx) => {
          if (cancelled || !fx) return
          setRows(extractFixtureTrendRowsFromSmFixture(fx))
          setRecentForm(extractSmRecentFormFromFixture(fx))
        })
        .catch(() => {
          if (!cancelled) {
            setRows([])
            setRecentForm(null)
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }

    run()
    if (!pollMs)
      return () => {
        cancelled = true
      }

    const id = window.setInterval(run, pollMs)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [sportMonksFixtureId, matchStatus])

  return { trendRows: rows, trendsLoading: loading, trendRecentForm: recentForm }
}
