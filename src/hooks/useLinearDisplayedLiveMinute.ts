import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import type { Match } from '../types/match'

/**
 * Minute affichée : valeur SportMonks + lissage léger entre deux polls (max +1 min).
 * Pas d’estimation depuis le coup d’envoi (la mi-temps fausse l’horloge).
 */
export function useLinearDisplayedLiveMinute(match: Match | null | undefined): number {
  const isLive = match?.status === 'live'
  const paused = Boolean(match?.liveClockPaused)
  const periodTicking = match?.livePeriodTicking !== false
  const official = Math.min(99, Math.max(0, Math.round(Number(match?.minute) || 0)))
  const [tick, setTick] = useState(0)

  const [anchor, setAnchor] = useState<{ m: number; atMs: number }>(() => ({
    m: official,
    atMs: Date.now(),
  }))

  useLayoutEffect(() => {
    if (!match || match.status !== 'live' || paused || !periodTicking || official <= 0) return
    setAnchor({ m: official, atMs: Date.now() })
  }, [match?.id, match?.status, official, paused, periodTicking])

  useEffect(() => {
    if (!isLive || paused || !periodTicking) return
    const id = window.setInterval(() => setTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [isLive, paused, periodTicking, match?.id])

  return useMemo(() => {
    if (!match || match.status !== 'live') return Math.max(0, Math.round(Number(match?.minute) || 0))
    if (paused || !periodTicking) return official
    if (official <= 0) return 0
    const drift = Math.floor((Date.now() - anchor.atMs) / 60_000)
    const linear = anchor.m + drift
    return Math.min(99, Math.max(official, Math.min(linear, official + 1)))
  }, [match, anchor, tick, paused, periodTicking, official])
}
