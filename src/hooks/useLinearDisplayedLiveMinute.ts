import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import type { Match } from '../types/match'

/**
 * Minute affichée : valeur SportMonks + lissage entre polls.
 * Si l’API est en retard, on laisse le chrono avancer avec le mur (plafond élargi),
 * puis on se recalibre quand la minute officielle rattrape.
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
  }, [match?.id, match?.status, official, paused, match?.liveInSecondHalf])

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
    // Ancien plafond +1 figeait l’UI si SM/live-bundle stagnaient (ex. 3' → puis saut à 15').
    const catchUp = Math.max(1, Math.min(12, drift + 1))
    const cap = seed + catchUp
    const displayed = Math.min(99, Math.max(seed, official, Math.min(linear, cap)))
    // SM omet parfois `periods.ticking` alors que le match avance — ne pas figer le chrono pour autant.
    if (!periodTicking && official > 0) return displayed
    if (!periodTicking && official <= 0) return seed
    return displayed
  }, [match, anchor, tick, paused, periodTicking, official])
}
