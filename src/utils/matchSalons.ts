import type { Match } from '../types/match'
import type { SupporterGroup } from '../types/group'

export type MatchSalonPick = {
  group: SupporterGroup
  reason: 'home' | 'away' | 'league'
}

/**
 * Tribunes dont les fanTags recoupent les équipes du match, ou la compétition (sans club ciblé).
 */
export function salonsForMatch(
  match: Match,
  allGroups: SupporterGroup[],
): MatchSalonPick[] {
  const teamIds = new Set([match.home.id, match.away.id])
  const compId = match.competition.id
  const seen = new Set<string>()
  const out: MatchSalonPick[] = []

  for (const group of allGroups) {
    const tags = group.fanTags
    if (!tags) continue
    const clubIds = tags.clubIds ?? []
    const leagueIds = tags.leagueIds ?? []

    let reason: MatchSalonPick['reason'] | null = null
    if (clubIds.some((c) => teamIds.has(c))) {
      if (clubIds.includes(match.home.id)) reason = 'home'
      else if (clubIds.includes(match.away.id)) reason = 'away'
    } else if (leagueIds.includes(compId) && clubIds.length === 0) {
      reason = 'league'
    }

    if (reason && !seen.has(group.id)) {
      seen.add(group.id)
      out.push({ group, reason })
    }
  }

  const rank = (r: MatchSalonPick['reason']) =>
    r === 'home' ? 0 : r === 'away' ? 1 : 2
  out.sort(
    (a, b) =>
      rank(a.reason) - rank(b.reason) || b.group.intensity - a.group.intensity,
  )

  return out
}
