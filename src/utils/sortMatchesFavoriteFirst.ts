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

/** Favori d’abord, puis coup d’envoi. */
function byFavoriteThenKickoff(favoriteClubIds: readonly string[]) {
  return (a: Match, b: Match): number => {
    const ra = favoriteClubMatchRank(a, favoriteClubIds)
    const rb = favoriteClubMatchRank(b, favoriteClubIds)
    if (ra !== rb) return ra - rb
    return byKickoffAsc(a, b)
  }
}

/**
 * Matchs à venir : d’abord le prochain créneau (jour Paris du 1er match chronologique),
 * avec club de cœur prioritaire **dans ce créneau uniquement**, puis le reste chronologique.
 * Ne remonte pas un match favori lointain (ex. dimanche) devant des matchs plus proches.
 */
export function sortUpcomingMatchesFavoriteFirst(
  matches: readonly Match[],
  favoriteClubIds: readonly string[],
): Match[] {
  const upcoming = matches.filter((m) => m.status === 'upcoming')
  if (upcoming.length <= 1) return [...upcoming]

  const chronological = [...upcoming].sort(byKickoffAsc)
  if (!favoriteClubIds.length) return chronological

  const nextKickoffDay = matchCalendarDayKeyParis(chronological[0]!.kickoffAt)
  const nearSlot = chronological.filter(
    (m) => matchCalendarDayKeyParis(m.kickoffAt) === nextKickoffDay,
  )
  const later = chronological.filter(
    (m) => matchCalendarDayKeyParis(m.kickoffAt) !== nextKickoffDay,
  )

  return [...nearSlot.sort(byFavoriteThenKickoff(favoriteClubIds)), ...later]
}

/** Lives : clubs de cœur d’abord (ordre des favoris), puis les autres. */
export function sortLiveMatchesFavoriteFirst(
  matches: readonly Match[],
  favoriteClubIds: readonly string[],
): Match[] {
  const lives = matches.filter((m) => m.status === 'live')
  if (lives.length <= 1 || !favoriteClubIds.length) return [...lives]

  return [...lives].sort(byFavoriteThenKickoff(favoriteClubIds))
}
