import { useEffect, useRef, useState } from 'react'
import {
  extractLiveFixtureStatistics,
  extractTimelineHighlightsFromSmFixture,
  fetchSportMonksFixtureEventsWeather,
  type LiveFixtureStatRow,
  type SmFixture,
} from '../api/sportMonks'
import type { Highlight } from '../data/highlights'
import { getSportMonksToken } from '../utils/apiTokens'
import { useVisibilityAwareInterval } from './useVisibilityAwareInterval'
import { useTalkFootLiveBundle } from './useTalkFootLiveBundle'
import {
  demoBarcaPsgLiveStats,
  demoBarcaPsgTimeline,
  isDemoBarcaPsgShowcaseMatch,
} from '../data/demoBarcaPsgShowcase'

/** Live : cadence renforcée pour éviter les buts invisibles sans F5. */
const LIVE_POLL_MS = 5_000

function highlightIdsSignature(items: Highlight[]): string {
  return items.map((h) => h.id).join('|')
}

function liveStatRowsSignature(rows: LiveFixtureStatRow[]): string {
  return rows.map((r) => `${r.label}:${r.home}:${r.away}`).join('|')
}

function bundleCoversLiveStats(fixture: SmFixture | null): boolean {
  if (!fixture) return false
  if (extractLiveFixtureStatistics(fixture).length > 0) return true
  const events = fixture.events
  return Array.isArray(events) && events.length > 0
}

/**
 * Statistiques équipe (`statistics` + `statistics.type`) pour un match live ou terminé.
 */
export function useSportMonksFixtureLiveStats(
  sportMonksFixtureId: number | undefined,
  matchStatus: 'upcoming' | 'live' | 'finished',
  /** Identifiant tribune (`Match.id`) pour la timeline « Moments forts ». */
  channelMatchId?: string,
) {
  const isShowcase = isDemoBarcaPsgShowcaseMatch(channelMatchId)
  const { liveBundleFixture, liveBundleSettled } = useTalkFootLiveBundle(
    isShowcase ? undefined : sportMonksFixtureId,
    matchStatus,
  )
  const [rows, setRows] = useState<LiveFixtureStatRow[]>(() =>
    isShowcase ? demoBarcaPsgLiveStats() : [],
  )
  const [timeline, setTimeline] = useState<Highlight[]>(() =>
    isShowcase && channelMatchId ? demoBarcaPsgTimeline(channelMatchId) : [],
  )
  const [loading, setLoading] = useState(false)
  const cancelledRef = useRef(false)
  const runRef = useRef<() => void>(() => {})

  const bundleCovers = bundleCoversLiveStats(liveBundleFixture)
  const pollLive = !isShowcase && matchStatus === 'live' && liveBundleSettled && !bundleCovers

  useEffect(() => {
    if (!isShowcase || !channelMatchId) return
    setRows(demoBarcaPsgLiveStats())
    setTimeline(demoBarcaPsgTimeline(channelMatchId))
    setLoading(false)
  }, [isShowcase, channelMatchId])

  useEffect(() => {
    cancelledRef.current = false
    if (isShowcase) return
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

    if (liveBundleFixture && bundleCoversLiveStats(liveBundleFixture)) return

    if (!liveBundleSettled) {
      setLoading(true)
      return
    }

    const run = () => {
      setLoading(true)
      fetchSportMonksFixtureEventsWeather(token, sportMonksFixtureId)
        .then((fx) => {
          if (cancelledRef.current || !fx) return
          const nextRows = extractLiveFixtureStatistics(fx)
          const nextTimeline = channelMatchId
            ? extractTimelineHighlightsFromSmFixture(fx, channelMatchId)
            : []
          setRows((prev) =>
            liveStatRowsSignature(prev) === liveStatRowsSignature(nextRows) ? prev : nextRows,
          )
          setTimeline((prev) =>
            highlightIdsSignature(prev) === highlightIdsSignature(nextTimeline) ? prev : nextTimeline,
          )
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
  }, [sportMonksFixtureId, matchStatus, channelMatchId, liveBundleFixture, liveBundleSettled, isShowcase])

  useVisibilityAwareInterval(
    () => runRef.current(),
    LIVE_POLL_MS,
    Boolean(!isShowcase && sportMonksFixtureId && pollLive),
  )

  useEffect(() => {
    if (isShowcase) return
    if (!liveBundleFixture) return
    const nextRows = extractLiveFixtureStatistics(liveBundleFixture)
    const nextTimeline = channelMatchId
      ? extractTimelineHighlightsFromSmFixture(liveBundleFixture, channelMatchId)
      : []
    setRows((prev) =>
      liveStatRowsSignature(prev) === liveStatRowsSignature(nextRows) ? prev : nextRows,
    )
    setTimeline((prev) =>
      highlightIdsSignature(prev) === highlightIdsSignature(nextTimeline) ? prev : nextTimeline,
    )
    setLoading(false)
  }, [liveBundleFixture, channelMatchId, isShowcase])

  return {
    liveStatRows: rows,
    liveStatsLoading: loading,
    smTimelineHighlights: timeline,
  }
}
