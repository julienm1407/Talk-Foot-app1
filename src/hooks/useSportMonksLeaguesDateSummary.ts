import { useEffect, useState } from 'react'
import { fetchSportMonksLeaguesByDate, summarizeLeaguesDateEnvelope, type LeaguesDateDaySummary } from '../api/sportMonks'
import { getSportMonksToken } from '../utils/apiTokens'

const YMD = /^\d{4}-\d{2}-\d{2}$/

/**
 * Aperçu `GET /leagues/date/{jour}` pour un jour civil sélectionné (fuseau Paris dans l’UI).
 */
export function useSportMonksLeaguesDateSummary(dayKey: string) {
  const [summary, setSummary] = useState<LeaguesDateDaySummary | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (dayKey === 'all' || !YMD.test(dayKey)) {
      setSummary(null)
      setLoading(false)
      return
    }
    const token = getSportMonksToken()
    if (!token) {
      setSummary(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setSummary(null)

    fetchSportMonksLeaguesByDate(token, dayKey)
      .then((json) => {
        if (cancelled) return
        setSummary(summarizeLeaguesDateEnvelope(json))
      })
      .catch(() => {
        if (!cancelled) setSummary(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [dayKey])

  return { leaguesDateSummary: summary, leaguesDateLoading: loading }
}
