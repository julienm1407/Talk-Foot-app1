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
    m: official > 0 ? official : 1,
    atMs: Date.now(),
  }))

  useLayoutEffect(() => {
    if (!match || match.status !== 'live' || paused) return
    // Minute SM à 0 = donnée absente (pas une vraie 0') — on amorce à 1' pour défiler entre deux polls.
    const seed = official > 0 ? official : 1
    setAnchor({ m: seed, atMs: Date.now() })
  }, [match?.id, match?.status, official, paused])

  useEffect(() => {
    if (!isLive || paused) return
    const id = window.setInterval(() => setTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [isLive, paused, match?.id])

  return useMemo(() => {
    if (!match || match.status !== 'live') return Math.max(0, Math.round(Number(match?.minute) || 0))
    if (paused) return official
    const seed = official > 0 ? official : 1
    const drift = Math.floor((Date.now() - anchor.atMs) / 60_000)
    const linear = anchor.m + drift
    const cap = official > 0 ? official + 1 : seed + 1
    const displayed = Math.min(99, Math.max(seed, official, Math.min(linear, cap)))
    // SM omet parfois `periods.ticking` alors que le match avance — ne pas figer le chrono pour autant.
    if (!periodTicking && official > 0) return displayed
    if (!periodTicking && official <= 0) return seed
    return displayed
  }, [match, anchor, tick, paused, periodTicking, official])
}
