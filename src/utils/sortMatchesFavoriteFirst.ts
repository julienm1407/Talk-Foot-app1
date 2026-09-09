import type { Match } from '../types/match'
import { matchCalendarDayKeyParis } from './time'

function matchInvolvesClub(m: Match, clubId: string): boolean {
  return m.home.id === clubId || m.away.id === clubId
}

/** Rang dans la liste des clubs de cœur (0 = premier favori). `Infinity` si hors favoris. */
export function favoriteClubMatchRank(m: Match, favoriteClubIds: readonly string[]): number {
  for (let i = 0; i < favoriteClubIds.length; i++) {
    const id = favoriteClubIds[i]
    if (id && matchInvolvesClub(m, id)) return i
  }
  return Number.POSITIVE_INFINITY
}

function byKickoffAsc(a: Match, b: Match): number {
  return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
}

/**
 * Matchs à venir : club de cœur en premier, puis les autres du même soir (jour Paris),
 * puis le reste chronologique.
 */
export function sortUpcomingMatchesFavoriteFirst(
  matches: readonly Match[],
  favoriteClubIds: readonly string[],
): Match[] {
  const upcoming = matches.filter((m) => m.status === 'upcoming')
  if (upcoming.length <= 1) return [...upcoming]

  if (!favoriteClubIds.length) {
    return [...upcoming].sort(byKickoffAsc)
  }

  const favMatches = upcoming
    .filter((m) => favoriteClubMatchRank(m, favoriteClubIds) < Number.POSITIVE_INFINITY)
    .sort((a, b) => {
      const ra = favoriteClubMatchRank(a, favoriteClubIds)
      const rb = favoriteClubMatchRank(b, favoriteClubIds)
      if (ra !== rb) return ra - rb
      return byKickoffAsc(a, b)
    })

  const featured = favMatches[0]
  if (!featured) return [...upcoming].sort(byKickoffAsc)

  const featuredDay = matchCalendarDayKeyParis(featured.kickoffAt)
  const rest = upcoming.filter((m) => m.id !== featured.id)
  const sameEvening = rest
    .filter((m) => matchCalendarDayKeyParis(m.kickoffAt) === featuredDay)
    .sort(byKickoffAsc)
  const later = rest
    .filter((m) => matchCalendarDayKeyParis(m.kickoffAt) !== featuredDay)
    .sort(byKickoffAsc)

  return [featured, ...sameEvening, ...later]
}

/** Lives : clubs de cœur d’abord (ordre des favoris), puis les autres. */
export function sortLiveMatchesFavoriteFirst(
  matches: readonly Match[],
  favoriteClubIds: readonly string[],
): Match[] {
  const lives = matches.filter((m) => m.status === 'live')
  if (lives.length <= 1 || !favoriteClubIds.length) return [...lives]

  return [...lives].sort((a, b) => {
    const ra = favoriteClubMatchRank(a, favoriteClubIds)
    const rb = favoriteClubMatchRank(b, favoriteClubIds)
    if (ra !== rb) return ra - rb
    return byKickoffAsc(a, b)
  })
}
