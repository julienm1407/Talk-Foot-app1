import type { SmFixture } from '../api/sportMonks/types'
import type { Match } from '../types/match'

/** Fenêtre tchat débrief après le coup de sifflet final. */
export const POST_MATCH_DEBRIEF_MS = 30 * 60 * 1000

/** Durée typique coup d'envoi → sifflet (90 + MT + arrêts). */
const ESTIMATED_MATCH_DURATION_MS = 105 * 60 * 1000

function kickoffMs(match: Pick<Match, 'kickoffAt'>): number | null {
  const ms = Date.parse(match.kickoffAt)
  return Number.isFinite(ms) ? ms : null
}

function lastPeriodMinuteTotal(fixture: SmFixture): number | null {
  const periods = fixture.periods
  if (!Array.isArray(periods) || !periods.length) return null
  let best: number | null = null
  for (const p of periods) {
    if (typeof p.minutes !== 'number' || p.minutes < 0) continue
    const base = typeof p.counts_from === 'number' && p.counts_from >= 0 ? p.counts_from : 0
    const added = typeof p.time_added === 'number' ? p.time_added : p.extra_minute ?? 0
    const total = base + p.minutes + added
    if (best == null || total > best) best = total
  }
  return best
}

function maxEventMinute(fixture: SmFixture): number | null {
  let best: number | null = null
  for (const ev of fixture.events ?? []) {
    const base = typeof ev.minute === 'number' ? ev.minute : null
    if (base == null) continue
    const extra = typeof ev.extra_minute === 'number' ? ev.extra_minute : 0
    const total = base + extra
    if (best == null || total > best) best = total
  }
  return best
}

/** Estime l'instant du coup de sifflet final (epoch ms). */
export function estimateMatchFinishedAtMs(
  match: Pick<Match, 'kickoffAt' | 'status'>,
  fixture?: SmFixture | null,
): number | null {
  if (match.status !== 'finished') return null
  const kick = kickoffMs(match)
  if (kick == null) return null

  const fromPeriods = fixture ? lastPeriodMinuteTotal(fixture) : null
  const fromEvents = fixture ? maxEventMinute(fixture) : null
  const lastMinute = Math.max(fromPeriods ?? 0, fromEvents ?? 0, 90)
  const durationMs = Math.max(ESTIMATED_MATCH_DURATION_MS, (lastMinute + 5) * 60_000)
  return kick + durationMs
}

export function resolveMatchFinishedAtMs(opts: {
  match: Match | null | undefined
  fixture?: SmFixture | null
  /** Instant où l'utilisateur a vu le passage live → terminé (cette session). */
  witnessedFinishedAtMs?: number | null
}): number | null {
  const { match, fixture, witnessedFinishedAtMs } = opts
  if (!match || match.status !== 'finished') return null

  const estimated = estimateMatchFinishedAtMs(match, fixture)
  if (witnessedFinishedAtMs == null) return estimated
  return witnessedFinishedAtMs
}

export function isPostMatchDebriefOpen(finishedAtMs: number | null, nowMs = Date.now()): boolean {
  if (finishedAtMs == null) return false
  return nowMs - finishedAtMs < POST_MATCH_DEBRIEF_MS
}

export function postMatchDebriefMinutesLeft(finishedAtMs: number | null, nowMs = Date.now()): number {
  if (finishedAtMs == null) return 0
  const remaining = POST_MATCH_DEBRIEF_MS - (nowMs - finishedAtMs)
  if (remaining <= 0) return 0
  return Math.max(1, Math.ceil(remaining / 60_000))
}
