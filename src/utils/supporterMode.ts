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
  favoriteLeagueId: string | null,
  favoriteClubId: string | null,
): { id: string; name: string; shortName: string } | null {
  if (!favoriteLeagueId || !favoriteClubId) return null
  const list = teams[favoriteLeagueId as keyof typeof teams]
  return list?.find((t) => t.id === favoriteClubId) ?? null
}

export function matchInvolvesClub(m: Match, clubId: string): boolean {
  return m.home.id === clubId || m.away.id === clubId
}

/** Matchs du club ; si aucun en données mock, on garde tout pour ne pas vider l’écran */
export function filterMatchesForSupporterClub(matches: Match[], clubId: string): Match[] {
  const mine = matches.filter((m) => matchInvolvesClub(m, clubId))
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
  return items.filter((n) => articleVisibleInSupporterMode(n, favoriteLeagueId, favoriteClubId))
}

function articleVisibleInSupporterMode(
  n: NewsItem,
  favoriteLeagueId: string | null,
  favoriteClubId: string,
): boolean {
  const hasLeague = Boolean(n.leagueIds?.length)
  const hasClub = Boolean(n.clubIds?.length)
  if (!hasLeague && !hasClub) return true
  if (hasClub && n.clubIds!.includes(favoriteClubId)) return true
  if (hasLeague && favoriteLeagueId && n.leagueIds!.includes(favoriteLeagueId)) {
    if (!hasClub) return true
    return n.clubIds!.includes(favoriteClubId)
  }
  return false
}
