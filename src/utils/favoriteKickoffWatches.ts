import type { Match } from '../types/match'

export const MATCH_KICKOFF_ALERT_LEAD_MS = 15 * 60 * 1000
const WATCH_HORIZON_MS = 8 * 24 * 60 * 60 * 1000

export type KickoffWatch = {
  matchId: string
  kickoffAt: string
  title: string
  body: string
  href: string
  fireAtMs: number
}

export function localNotificationIdForMatch(matchId: string): number {
  let h = 0
  for (let i = 0; i < matchId.length; i += 1) {
    h = (Math.imul(h, 31) + matchId.charCodeAt(i)) | 0
  }
  const n = Math.abs(h) % 2_000_000_000
  return n === 0 ? 1 : n
}

export function favoriteClubKickoffWatches(
  matches: Match[],
  favoriteClubIds: string[],
  nowMs = Date.now(),
): KickoffWatch[] {
  const clubs = new Set(favoriteClubIds.filter(Boolean))
  if (clubs.size === 0) return []

  const horizon = nowMs + WATCH_HORIZON_MS
  const out: KickoffWatch[] = []

  for (const match of matches) {
    if (match.status === 'finished') continue
    if (!clubs.has(match.home.id) && !clubs.has(match.away.id)) continue
    const kickoffMs = Date.parse(match.kickoffAt)
    if (!Number.isFinite(kickoffMs)) continue
    if (kickoffMs <= nowMs + 90_000) continue
    if (kickoffMs > horizon) continue

    const home = match.home.shortName || match.home.name
    const away = match.away.shortName || match.away.name
    out.push({
      matchId: match.id,
      kickoffAt: match.kickoffAt,
      title: `${home} – ${away}`,
      body: 'Coup d’envoi dans 15 min — ouvre la tribune Talk Foot.',
      href: `/channel/${encodeURIComponent(match.id)}`,
      fireAtMs: Math.max(nowMs + 5_000, kickoffMs - MATCH_KICKOFF_ALERT_LEAD_MS),
    })
  }

  return out.sort((a, b) => a.fireAtMs - b.fireAtMs)
}
