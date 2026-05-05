import { useEffect, useRef, useState } from 'react'
import {
  extractLiveFixtureStatistics,
  extractTimelineHighlightsFromSmFixture,
  fetchSportMonksFixtureEventsWeather,
  type LiveFixtureStatRow,
} from '../api/sportMonks'
import type { Highlight } from '../data/highlights'
import { getSportMonksToken } from '../utils/apiTokens'
import { useVisibilityAwareInterval } from './useVisibilityAwareInterval'

/** Live : cadence renforcée pour éviter les buts invisibles sans F5. */
const LIVE_POLL_MS = 12_000

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
  const cancelledRef = useRef(false)
  const runRef = useRef<() => void>(() => {})

  const pollLive = matchStatus === 'live'

  useEffect(() => {
    cancelledRef.current = false
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

    const run = () => {
      setLoading(true)
      fetchSportMonksFixtureEventsWeather(token, sportMonksFixtureId)
        .then((fx) => {
          if (cancelledRef.current || !fx) return
          setRows(extractLiveFixtureStatistics(fx))
          if (channelMatchId) {
            setTimeline(extractTimelineHighlightsFromSmFixture(fx, channelMatchId))
          } else {
            setTimeline([])
          }
        })
        .catch(() => {
          if (!cancelledRef.current) {
            setRows([])
            setTimeline([])
          }
        })
        .finally(() => {
          if (!cancelledRef.current) setLoading(false)
        })
    }

    runRef.current = run
    void run()

    return () => {
      cancelledRef.current = true
    }
  }, [sportMonksFixtureId, matchStatus, channelMatchId, pollLive])

  useVisibilityAwareInterval(
    () => runRef.current(),
    LIVE_POLL_MS,
    Boolean(sportMonksFixtureId && pollLive),
  )

  return { liveStatRows: rows, liveStatsLoading: loading, smTimelineHighlights: timeline }
}
