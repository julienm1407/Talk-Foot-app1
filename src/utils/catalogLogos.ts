import { CLUB_OFFICIAL_LOGO_BY_ID } from '../data/clubOfficialLogoUrls'
import { LEAGUE_OFFICIAL_LOGO_BY_ID } from '../data/leagueOfficialLogoUrls'
import { sportMonksTeamLogoUrlForClubId } from '../data/sportMonksLogoUrls'

/** URL logo ligue pour l’onboarding / profil. */
export function getLeagueLogoUrl(leagueId: string): string | null {
  return LEAGUE_OFFICIAL_LOGO_BY_ID[leagueId] ?? null
}

/** URL logo club catalogue (officiel / local → SportMonks). */
export function resolveClubCatalogLogoUrl(clubId: string): string | null {
  const id = clubId.trim().toLowerCase()
  return CLUB_OFFICIAL_LOGO_BY_ID[id] ?? sportMonksTeamLogoUrlForClubId(id) ?? null
}
