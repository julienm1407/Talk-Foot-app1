import type { Match } from '../types/match'

export const MATCH_KICKOFF_ALERT_LEAD_MS = 60 * 60 * 1000
const WATCH_HORIZON_MS = 8 * 24 * 60 * 60 * 1000
const MIN_FIRE_AHEAD_MS = 8_000
/** Garder le match en base après le KO pour les FCM buts / cartons. */
const LIVE_CLOUD_KEEP_MS = 4 * 60 * 60 * 1000

export type KickoffWatchKind = 't60' | 'kickoff'

export type KickoffWatch = {
  matchId: string
  kickoffAt: string
  title: string
  body: string
  href: string
  fireAtMs: number
  kind: KickoffWatchKind
}

export function localNotificationIdForMatch(matchId: string, kind: KickoffWatchKind = 't60'): number {
  let h = 0
  for (let i = 0; i < matchId.length; i += 1) {
    h = (Math.imul(h, 31) + matchId.charCodeAt(i)) | 0
  }
  const salt = kind === 'kickoff' ? 1_000_003 : 0
  const n = Math.abs(h + salt) % 2_000_000_000
  return n === 0 ? 1 : n
}

function clubNotifName(club: { name?: string; shortName?: string }): string {
  const full = String(club.name ?? '').trim()
  if (full) return full
  return String(club.shortName ?? '').trim() || 'Équipe'
}

function matchNotifTitle(match: Match): string {
  return `${clubNotifName(match.home)} – ${clubNotifName(match.away)}`
}

function viaBody(kind: KickoffWatchKind, via: 'match' | 'player' | 'club'): string {
  if (kind === 'kickoff') {
    if (via === 'match') return 'C’est parti — ton match suivi commence.'
    if (via === 'player') return 'C’est parti — le match de ton joueur commence.'
    return 'C’est parti — le match commence. Ouvre la tribune Talk Foot.'
  }
  if (via === 'match') return 'Match suivi — coup d’envoi dans 1 h.'
  if (via === 'player') return 'Joueur suivi — coup d’envoi dans 1 h.'
  return 'Coup d’envoi dans 1 h — ouvre la tribune Talk Foot.'
}

function watchesFromMatch(
  match: Match,
  nowMs: number,
  via: 'match' | 'player' | 'club',
): KickoffWatch[] {
  if (match.status === 'finished') return []
  const kickoffMs = Date.parse(match.kickoffAt)
  if (!Number.isFinite(kickoffMs)) return []
  if (kickoffMs > nowMs + WATCH_HORIZON_MS) return []
  if (kickoffMs <= nowMs + MIN_FIRE_AHEAD_MS && match.status === 'live') return []

  const title = matchNotifTitle(match)
  const href = `/channel/${encodeURIComponent(match.id)}`
  const out: KickoffWatch[] = []

  const t60At = kickoffMs - MATCH_KICKOFF_ALERT_LEAD_MS
  if (t60At > nowMs + MIN_FIRE_AHEAD_MS && kickoffMs > nowMs + MIN_FIRE_AHEAD_MS) {
    out.push({
      matchId: match.id,
      kickoffAt: match.kickoffAt,
      title,
      body: viaBody('t60', via),
      href,
      fireAtMs: t60At,
      kind: 't60',
    })
  }

  if (kickoffMs > nowMs + MIN_FIRE_AHEAD_MS) {
    out.push({
      matchId: match.id,
      kickoffAt: match.kickoffAt,
      title,
      body: viaBody('kickoff', via),
      href,
      fireAtMs: kickoffMs,
      kind: 'kickoff',
    })
  }

  return out
}

function followedVia(
  match: Match,
  opts: {
    favoriteClubIds?: string[]
    favoriteMatchIds?: string[]
    favoritePlayerTeamIds?: string[]
  },
): 'match' | 'player' | 'club' | null {
  const clubs = new Set((opts.favoriteClubIds ?? []).filter(Boolean))
  const matchIds = new Set((opts.favoriteMatchIds ?? []).filter(Boolean))
  const playerTeams = new Set((opts.favoritePlayerTeamIds ?? []).filter(Boolean))
  const viaClub = clubs.has(match.home.id) || clubs.has(match.away.id)
  const viaMatch = matchIds.has(match.id)
  const viaPlayer = playerTeams.has(match.home.id) || playerTeams.has(match.away.id)
  if (!viaClub && !viaMatch && !viaPlayer) return null
  if (viaMatch) return 'match'
  if (viaPlayer) return 'player'
  return 'club'
}

/**
 * Une ligne cloud par match suivi encore à venir ou en cours.
 * Distinct des rappels locaux : un match live n’a plus de notif planifiée,
 * mais il doit rester dans `match_kickoff_watches` pour les FCM buts / cartons.
 */
export function buildCloudFavoriteMatchWatches(
  matches: Match[],
  opts: {
    favoriteClubIds?: string[]
    favoriteMatchIds?: string[]
    favoritePlayerTeamIds?: string[]
  },
  nowMs = Date.now(),
): KickoffWatch[] {
  const out: KickoffWatch[] = []
  const seen = new Set<string>()
  for (const match of matches) {
    if (match.status === 'finished') continue
    const via = followedVia(match, opts)
    if (!via) continue
    const kickoffMs = Date.parse(match.kickoffAt)
    if (!Number.isFinite(kickoffMs)) continue
    if (kickoffMs > nowMs + WATCH_HORIZON_MS) continue
    const live = match.status === 'live'
    if (!live && kickoffMs + LIVE_CLOUD_KEEP_MS < nowMs) continue
    if (seen.has(match.id)) continue
    seen.add(match.id)
    out.push({
      matchId: match.id,
      kickoffAt: match.kickoffAt,
      title: matchNotifTitle(match),
      body: viaBody('kickoff', via),
      href: `/channel/${encodeURIComponent(match.id)}`,
      fireAtMs: kickoffMs,
      kind: 'kickoff',
    })
  }
  return out
}

export function favoriteClubKickoffWatches(
  matches: Match[],
  favoriteClubIds: string[],
  nowMs = Date.now(),
): KickoffWatch[] {
  return buildKickoffWatches(matches, { favoriteClubIds }, nowMs)
}

export function uniqueKickoffWatchesForCloud(watches: KickoffWatch[]): KickoffWatch[] {
  const seen = new Set<string>()
  const out: KickoffWatch[] = []
  for (const w of watches) {
    if (seen.has(w.matchId)) continue
    seen.add(w.matchId)
    out.push(w)
  }
  return out
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
  const out: KickoffWatch[] = []
  const seenKeys = new Set<string>()

  for (const match of matches) {
    const via = followedVia(match, opts)
    if (!via) continue
    for (const watch of watchesFromMatch(match, nowMs, via)) {
      const key = `${watch.matchId}:${watch.kind}`
      if (seenKeys.has(key)) continue
      seenKeys.add(key)
      out.push(watch)
    }
  }

  return out.sort((a, b) => a.fireAtMs - b.fireAtMs || a.kind.localeCompare(b.kind))
}
