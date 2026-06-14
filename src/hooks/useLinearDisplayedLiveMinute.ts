import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import type { Match } from '../types/match'

function kickoffElapsedMinute(match: Match, nowMs = Date.now()): number {
  const kickoffMs = Date.parse(match.kickoffAt)
  if (!Number.isFinite(kickoffMs)) return 0
  const elapsed = Math.floor((nowMs - kickoffMs) / 60_000)
  if (elapsed <= 0) return 0
  const cap = match.liveInSecondHalf ? 99 : 55
  return Math.min(cap, elapsed)
}

function authorityMinute(match: Match | null | undefined, official: number, nowMs = Date.now()): number {
  if (!match || match.status !== 'live') return Math.max(0, official)
  if (official > 0) return official
  if (match.liveClockPaused) return official
  return kickoffElapsedMinute(match, nowMs)
}

/**
 * Minute affichée : valeur SportMonks + lissage léger entre deux polls (max +1 min),
 * avec repli coup d'envoi si SM n'expose pas encore la minute (has_timer false).
 */
export function useLinearDisplayedLiveMinute(match: Match | null | undefined): number {
  const isLive = match?.status === 'live'
  const paused = Boolean(match?.liveClockPaused)
  const periodTicking = match?.livePeriodTicking !== false
  const official = Math.min(99, Math.max(0, Math.round(Number(match?.minute) || 0)))
  const [tick, setTick] = useState(0)

  const authority = useMemo(
    () => authorityMinute(match, official, Date.now()),
    [match, official, tick],
  )

  const [anchor, setAnchor] = useState<{ m: number; atMs: number }>(() => ({
    m: authority,
    atMs: Date.now(),
  }))

  useLayoutEffect(() => {
    if (!match || match.status !== 'live' || paused || !periodTicking || authority <= 0) return
    setAnchor({ m: authority, atMs: Date.now() })
  }, [match?.id, match?.status, authority, paused, periodTicking])

  useEffect(() => {
    if (!isLive || paused || !periodTicking) return
    const id = window.setInterval(() => setTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [isLive, paused, periodTicking, match?.id])

  return useMemo(() => {
    if (!match || match.status !== 'live') return Math.max(0, Math.round(Number(match?.minute) || 0))
    const auth = authorityMinute(match, official, Date.now())
    if (paused || !periodTicking) return auth
    if (auth <= 0) return 0
    const drift = Math.floor((Date.now() - anchor.atMs) / 60_000)
    const linear = anchor.m + drift
    return Math.min(99, Math.max(auth, Math.min(linear, auth + 1)))
  }, [match, anchor, tick, paused, periodTicking, official])
}
