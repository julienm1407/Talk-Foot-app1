import { useEffect, useState } from 'react'
import {
  extractLiveFixtureStatistics,
  extractTimelineHighlightsFromSmFixture,
  fetchSportMonksFixtureEventsWeather,
  type LiveFixtureStatRow,
} from '../api/sportMonks'
import type { Highlight } from '../data/highlights'
import { getSportMonksToken } from '../utils/apiTokens'

/**
 * Statistiques équipe (`statistics` + `statistics.type`) pour un match live ou terminé.
 */
export function useSportMonksFixtureLiveStats(
  sportMonksFixtureId: number | undefined,
  matchStatus: 'upcoming' | 'live' | 'finished',
  /** Identifiant salon (`Match.id`) pour la timeline « Moments forts ». */
  channelMatchId?: string,
) {
  const [rows, setRows] = useState<LiveFixtureStatRow[]>([])
  const [timeline, setTimeline] = useState<Highlight[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sportMonksFixtureId || matchStatus === 'upcoming') {
      setRows([])
      setTimeline([])
      setLoading(false)
      return
    }
    const token = getSportMonksToken()
    if (!token) {
      setRows([])
      setTimeline([])
      setLoading(false)
      return
    }

    let cancelled = false
    const pollMs = matchStatus === 'live' ? 60_000 : 0

    const run = () => {
      setLoading(true)
      fetchSportMonksFixtureEventsWeather(token, sportMonksFixtureId)
        .then((fx) => {
          if (cancelled || !fx) return
          setRows(extractLiveFixtureStatistics(fx))
          if (channelMatchId) {
            setTimeline(extractTimelineHighlightsFromSmFixture(fx, channelMatchId))
          } else {
            setTimeline([])
          }
        })
        .catch(() => {
          if (!cancelled) {
            setRows([])
            setTimeline([])
          }
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
  }, [sportMonksFixtureId, matchStatus, channelMatchId])

  return { liveStatRows: rows, liveStatsLoading: loading, smTimelineHighlights: timeline }
}
