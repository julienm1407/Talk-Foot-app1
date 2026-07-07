import { useEffect, useMemo, useRef, useState } from 'react'
import type { SmFixture } from '../api/sportMonks'
import {
  extractCurrentGoalsFromSmFixture,
  extractLiveMinuteFromSmFixture,
  fetchSportMonksFixtureEventsTimeline,
  liveClockPausedFromSmFixture,
  livePeriodTickingFromSmFixture,
  liveSecondHalfFromSmFixture,
} from '../api/sportMonks'
import type { Match } from '../types/match'
import { getSportMonksToken } from '../utils/apiTokens'
import { useTalkFootLiveBundle } from './useTalkFootLiveBundle'
import { useEffectiveMatchStatus } from './useEffectiveMatchStatus'

/**
 * Match enrichi pour le chrono live (minute SM, mi-temps, ticking…) — même logique que la page salon live.
 */
export function useLiveMatchForClock(match: Match | null | undefined): Match | null {
  const effectiveStatus = useEffectiveMatchStatus(match)
  const { liveBundleFixture } = useTalkFootLiveBundle(match?.sportMonksFixtureId, effectiveStatus)
  const [clockFallbackFixture, setClockFallbackFixture] = useState<SmFixture | null>(null)
  const bundleMinute = liveBundleFixture ? extractLiveMinuteFromSmFixture(liveBundleFixture) : 0
  const needsFallbackPoll =
    effectiveStatus === 'live' && Boolean(match?.sportMonksFixtureId) && bundleMinute <= 0
  const fallbackPollActiveRef = useRef(false)

  useEffect(() => {
    if (!needsFallbackPoll) {
      fallbackPollActiveRef.current = false
      setClockFallbackFixture(null)
      return
    }

    const token = getSportMonksToken()
    if (!token) {
      fallbackPollActiveRef.current = false
      setClockFallbackFixture(null)
      return
    }

    if (fallbackPollActiveRef.current) return
    fallbackPollActiveRef.current = true

    let cancelled = false
    const poll = async () => {
      try {
        const fx = await fetchSportMonksFixtureEventsTimeline(token, match!.sportMonksFixtureId!)
        if (!cancelled) setClockFallbackFixture(fx)
      } catch {
        if (!cancelled) setClockFallbackFixture(null)
      }
    }

    void poll()
    const id = window.setInterval(() => void poll(), 5_000)
    return () => {
      cancelled = true
      fallbackPollActiveRef.current = false
      window.clearInterval(id)
    }
  }, [needsFallbackPoll, match?.sportMonksFixtureId])

  const clockFixture = useMemo(() => {
    if (!liveBundleFixture) return clockFallbackFixture
    if (bundleMinute > 0) return liveBundleFixture
    return clockFallbackFixture ?? liveBundleFixture
  }, [liveBundleFixture, clockFallbackFixture, bundleMinute])

  const liveSnapshot = useMemo(() => {
    if (!clockFixture || effectiveStatus !== 'live') return null
    return {
      score: extractCurrentGoalsFromSmFixture(clockFixture),
      minute: extractLiveMinuteFromSmFixture(clockFixture),
      paused: liveClockPausedFromSmFixture(clockFixture),
      inSecondHalf: liveSecondHalfFromSmFixture(clockFixture),
    }
  }, [clockFixture, effectiveStatus])

  return useMemo(() => {
    if (!match) return null
    if (!liveSnapshot) return match
    const contextMinute = Math.min(99, Math.max(0, Math.round(Number(match.minute) || 0)))
    const snapshotMinute = Math.min(99, Math.max(0, Math.round(Number(liveSnapshot.minute) || 0)))
    const minute =
      snapshotMinute > 0
        ? Math.max(contextMinute, snapshotMinute)
        : contextMinute > 0
          ? contextMinute
          : snapshotMinute
    return {
      ...match,
      minute,
      liveClockPaused: liveSnapshot.paused,
      liveInSecondHalf: liveSnapshot.inSecondHalf,
      livePeriodTicking: clockFixture ? livePeriodTickingFromSmFixture(clockFixture) : match.livePeriodTicking,
      score: liveSnapshot.score ?? match.score,
    }
  }, [match, liveSnapshot, clockFixture])
}
