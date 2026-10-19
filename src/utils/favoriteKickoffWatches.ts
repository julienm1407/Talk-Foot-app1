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

function watchFromMatch(match: Match, nowMs: number, body: string): KickoffWatch | null {
  if (match.status === 'finished') return null
  const kickoffMs = Date.parse(match.kickoffAt)
  if (!Number.isFinite(kickoffMs)) return null
  if (kickoffMs <= nowMs + 90_000) return null
  if (kickoffMs > nowMs + WATCH_HORIZON_MS) return null
  const home = match.home.shortName || match.home.name
  const away = match.away.shortName || match.away.name
  return {
    matchId: match.id,
    kickoffAt: match.kickoffAt,
    title: `${home} – ${away}`,
    body,
    href: `/channel/${encodeURIComponent(match.id)}`,
    fireAtMs: Math.max(nowMs + 5_000, kickoffMs - MATCH_KICKOFF_ALERT_LEAD_MS),
  }
}

export function favoriteClubKickoffWatches(
  matches: Match[],
  favoriteClubIds: string[],
  nowMs = Date.now(),
): KickoffWatch[] {
  return buildKickoffWatches(matches, { favoriteClubIds }, nowMs)
}

export function buildKickoffWatches(
  matches: Match[],
  opts: {
    favoriteClubIds?: string[]
    favoriteMatchIds?: string[]
    favoritePlayerTeamIds?: string[]
  },
  nowMs = Date.now(),
): KickoffWatch[] {
  const clubs = new Set((opts.favoriteClubIds ?? []).filter(Boolean))
  const matchIds = new Set((opts.favoriteMatchIds ?? []).filter(Boolean))
  const playerTeams = new Set((opts.favoritePlayerTeamIds ?? []).filter(Boolean))
  if (clubs.size === 0 && matchIds.size === 0 && playerTeams.size === 0) return []

  const out: KickoffWatch[] = []
  const seen = new Set<string>()

  for (const match of matches) {
    const viaClub = clubs.has(match.home.id) || clubs.has(match.away.id)
    const viaMatch = matchIds.has(match.id)
    const viaPlayer = playerTeams.has(match.home.id) || playerTeams.has(match.away.id)
    if (!viaClub && !viaMatch && !viaPlayer) continue
    const body = viaMatch
      ? 'Match suivi — coup d’envoi dans 15 min.'
      : viaPlayer
        ? 'Joueur suivi — coup d’envoi dans 15 min.'
        : 'Coup d’envoi dans 15 min — ouvre la tribune Talk Foot.'
    const watch = watchFromMatch(match, nowMs, body)
    if (!watch || seen.has(watch.matchId)) continue
    seen.add(watch.matchId)
    out.push(watch)
  }

  return out.sort((a, b) => a.fireAtMs - b.fireAtMs)
}
