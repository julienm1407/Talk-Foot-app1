import { useEffect, useMemo, useState } from 'react'
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

/**
 * Match enrichi pour le chrono live (minute SM, mi-temps, ticking…) — même logique que la page salon live.
 */
export function useLiveMatchForClock(match: Match | null | undefined): Match | null {
  const status = match?.status ?? 'upcoming'
  const { liveBundleFixture } = useTalkFootLiveBundle(match?.sportMonksFixtureId, status)
  const [clockFallbackFixture, setClockFallbackFixture] = useState<SmFixture | null>(null)

  useEffect(() => {
    if (status !== 'live' || !match?.sportMonksFixtureId) {
      setClockFallbackFixture(null)
      return
    }

    const bundleMinute = liveBundleFixture ? extractLiveMinuteFromSmFixture(liveBundleFixture) : 0
    const needsFallback = !liveBundleFixture || bundleMinute <= 0
    if (!needsFallback) {
      setClockFallbackFixture(null)
      return
    }

    const token = getSportMonksToken()
    if (!token) {
      setClockFallbackFixture(null)
      return
    }

    let cancelled = false
    const poll = async () => {
      try {
        const fx = await fetchSportMonksFixtureEventsTimeline(token, match.sportMonksFixtureId!)
        if (!cancelled) setClockFallbackFixture(fx)
      } catch {
        if (!cancelled) setClockFallbackFixture(null)
      }
    }

    void poll()
    const id = window.setInterval(() => void poll(), 5_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [status, match?.sportMonksFixtureId, liveBundleFixture])

  const clockFixture = useMemo(() => {
    if (!liveBundleFixture) return clockFallbackFixture
    const bundleMinute = extractLiveMinuteFromSmFixture(liveBundleFixture)
    if (bundleMinute > 0) return liveBundleFixture
    return clockFallbackFixture ?? liveBundleFixture
  }, [liveBundleFixture, clockFallbackFixture])

  const liveSnapshot = useMemo(() => {
    if (!clockFixture || status !== 'live') return null
    return {
      score: extractCurrentGoalsFromSmFixture(clockFixture),
      minute: extractLiveMinuteFromSmFixture(clockFixture),
      paused: liveClockPausedFromSmFixture(clockFixture),
      inSecondHalf: liveSecondHalfFromSmFixture(clockFixture),
    }
  }, [clockFixture, status])

  return useMemo(() => {
    if (!match) return null
    if (!liveSnapshot) return match
    const contextMinute = Math.min(99, Math.max(0, Math.round(Number(match.minute) || 0)))
    const bundleMinute = Math.min(99, Math.max(0, Math.round(Number(liveSnapshot.minute) || 0)))
    const minute =
      bundleMinute > 0
        ? Math.max(contextMinute, bundleMinute)
        : contextMinute > 0
          ? contextMinute
          : bundleMinute
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
