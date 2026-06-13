import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import type { Match } from '../types/match'

/**
 * Minute de jeu affichée en direct : avance d’environ 1 minute réelle entre deux valeurs API,
 * au lieu de rester figée puis sauter quand les données se rafraîchissent.
 */
export function useLinearDisplayedLiveMinute(match: Match | null | undefined): number {
  const isLive = match?.status === 'live'
  const paused = Boolean(match?.liveClockPaused)
  const official = Math.min(99, Math.max(0, Math.round(Number(match?.minute) || 0)))

  const [anchor, setAnchor] = useState<{ m: number; atMs: number }>(() => ({
    m: official,
    atMs: Date.now(),
  }))
  const [tick, setTick] = useState(0)

  useLayoutEffect(() => {
    if (!match || match.status !== 'live' || paused) return
    setAnchor({ m: official, atMs: Date.now() })
  }, [match?.id, match?.status, official, paused])

  useEffect(() => {
    if (!isLive || paused) return
    const id = window.setInterval(() => setTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [isLive, paused, match?.id])

  return useMemo(() => {
    if (!match || match.status !== 'live') return Math.max(0, Math.round(Number(match?.minute) || 0))
    if (paused) return official
    const drift = Math.floor((Date.now() - anchor.atMs) / 60_000)
    const linear = anchor.m + drift
    return Math.min(99, Math.max(0, Math.min(linear, official + 1)))
  }, [match, anchor, tick, paused, official])
}
