import type { NewsItem } from '../data/news'
import type { Match } from '../types/match'
import type { AvatarCharacterLook } from '../types/profile'
import { teams } from '../data/teams'

/** Mode « supporter » = maillot aux couleurs du club (Profil → Apparence), avec club configuré */
export function isSupporterTintActive(
  look: AvatarCharacterLook,
  preferencesComplete: boolean,
  favoriteClubId: string | null,
): boolean {
  return Boolean(look.supporterTint && preferencesComplete && favoriteClubId)
}

export function getFavoriteTeamRecord(
  _favoriteLeagueId: string | null,
  favoriteClubId: string | null,
): { id: string; name: string; shortName: string } | null {
  if (!favoriteClubId) return null
  for (const key of Object.keys(teams) as (keyof typeof teams)[]) {
    const t = teams[key].find((x) => x.id === favoriteClubId)
    if (t) return t
  }
  return null
}

export function matchInvolvesClub(m: Match, clubId: string): boolean {
  return m.home.id === clubId || m.away.id === clubId
}

/** Matchs du club ; si aucun en données mock, on garde tout pour ne pas vider l’écran */
export function filterMatchesForSupporterClub(matches: Match[], clubId: string): Match[] {
  const mine = matches.filter((m) => matchInvolvesClub(m, clubId))
  return mine.length > 0 ? mine : matches
}

/** Matchs impliquant au moins un des clubs favoris */
export function filterMatchesForSupporterClubs(matches: Match[], clubIds: string[]): Match[] {
  if (clubIds.length === 0) return matches
  const mine = matches.filter((m) => clubIds.some((id) => matchInvolvesClub(m, id)))
  return mine.length > 0 ? mine : matches
}

/**
 * Actus : ligue du fan + son club + brèves globales app ; exclut les autres championnats « purs ».
 */
export function filterNewsForSupporterClub(
  items: NewsItem[],
  favoriteLeagueId: string | null,
  favoriteClubId: string,
): NewsItem[] {
  return filterNewsForSupporterClubs(items, favoriteLeagueId, [favoriteClubId])
}

export function filterNewsForSupporterClubs(
  items: NewsItem[],
  favoriteLeagueId: string | null,
  favoriteClubIds: string[],
): NewsItem[] {
  if (favoriteClubIds.length === 0) return items
  return items.filter((n) => articleVisibleInSupporterMode(n, favoriteLeagueId, favoriteClubIds))
}

function articleVisibleInSupporterMode(
  n: NewsItem,
  favoriteLeagueId: string | null,
  favoriteClubIds: string[],
): boolean {
  const hasLeague = Boolean(n.leagueIds?.length)
  const hasClub = Boolean(n.clubIds?.length)
  if (!hasLeague && !hasClub) return true
  if (hasClub && n.clubIds!.some((id) => favoriteClubIds.includes(id))) return true
  if (hasLeague && favoriteLeagueId && n.leagueIds!.includes(favoriteLeagueId)) {
    if (!hasClub) return true
    return n.clubIds!.some((id) => favoriteClubIds.includes(id))
  }
  return false
}
