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
  const official = Math.min(99, Math.max(0, Math.round(Number(match?.minute) || 0)))
  const [tick, setTick] = useState(0)

  const [anchor, setAnchor] = useState<{ m: number; atMs: number }>(() => ({
    m: Math.max(1, official),
    atMs: Date.now(),
  }))

  useLayoutEffect(() => {
    if (!match || match.status !== 'live' || paused) return
    const seed = official > 0 ? official : 1
    setAnchor((prev) => {
      // SM encore à 0 : ne pas reset un chrono déjà avancé localement.
      if (official <= 0 && prev.m > 1) return prev
      if (official > prev.m) return { m: official, atMs: Date.now() }
      if (official > 0 && Math.abs(official - prev.m) <= 1) return prev
      if (seed === prev.m) return prev
      return { m: seed, atMs: Date.now() }
    })
  }, [match?.id, match?.status, official, paused, match?.liveInSecondHalf])

  useEffect(() => {
    if (!isLive || paused) return
    const id = window.setInterval(() => setTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [isLive, paused, match?.id])

  return useMemo(() => {
    if (!match || match.status !== 'live') return Math.max(0, Math.round(Number(match?.minute) || 0))
    if (paused) return official > 0 ? official : Math.max(1, anchor.m)
    const seed = official > 0 ? official : Math.max(1, anchor.m)
    const drift = Math.floor((Date.now() - anchor.atMs) / 60_000)
    const linear = anchor.m + drift
    const catchUp = Math.max(1, Math.min(12, drift + 1))
    const cap = seed + catchUp
    // Toujours laisser le mur avancer (même si SM omet ticking / minute 0).
    return Math.min(99, Math.max(seed, official, Math.min(linear, cap)))
  }, [match, anchor, tick, paused, official])
}
