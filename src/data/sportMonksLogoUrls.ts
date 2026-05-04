import { SPORTMONKS_TEAM_ID_BY_CLUB_ID } from './sportMonksKnownTeamIds'

export function sportMonksTeamLogoUrlForClubId(clubId: string): string | null {
  const id = SPORTMONKS_TEAM_ID_BY_CLUB_ID[clubId]
  if (!id) return null
  return `https://images.sportmonks.com/images/soccer/teams/${id}.png`
}

