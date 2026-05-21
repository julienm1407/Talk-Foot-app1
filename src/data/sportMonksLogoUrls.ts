import { SPORTMONKS_TEAM_ID_BY_CLUB_ID } from './sportMonksKnownTeamIds'

/** Dossier CDN SportMonks (cdn.sportmonks.com/images/soccer/teams/{folder}/{id}.png). */
export const SPORTMONKS_CDN_FOLDER_BY_TEAM_ID: Readonly<Record<number, number>> = {
  1: 1,
  6: 6,
  7: 7,
  18: 18,
  8: 8,
  9: 9,
  11: 11,
  13: 13,
  14: 14,
  15: 15,
  19: 19,
  20: 20,
  29: 29,
  36: 4,
  37: 5,
  42: 10,
  43: 11,
  44: 12,
  47: 15,
  51: 19,
  52: 20,
  59: 27,
  63: 31,
  65: 1,
  68: 4,
  78: 14,
  79: 15,
  82: 18,
  83: 19,
  90: 26,
  102: 6,
  106: 10,
  108: 12,
  113: 17,
  214: 22,
  231: 7,
  236: 12,
  266: 10,
  271: 15,
  277: 21,
  289: 1,
  346: 26,
  366: 14,
  377: 25,
  397: 13,
  450: 2,
  459: 11,
  485: 5,
  503: 23,
  510: 30,
  581: 5,
  585: 9,
  591: 15,
  594: 18,
  597: 21,
  598: 22,
  613: 5,
  625: 17,
  645: 5,
  676: 4,
  683: 11,
  686: 14,
  690: 18,
  708: 4,
  776: 8,
  794: 26,
  999: 7,
  1028: 4,
  1055: 31,
  1079: 23,
  1628: 28,
  2726: 6,
  2831: 15,
  2930: 18,
  2975: 31,
  3319: 23,
  3320: 24,
  3321: 25,
  3468: 12,
  3477: 21,
  3513: 25,
  3543: 23,
  3682: 2,
  4508: 28,
  6789: 5,
  7790: 14,
  7980: 12,
  8513: 1,
  9257: 9,
  13258: 10,
}

export const SPORTMONKS_CDN_FOLDER_BY_LEAGUE_ID: Readonly<Record<number, number>> = {
  5: 5,
  8: 8,
  82: 18,
  301: 13,
  384: 0,
  564: 20,
  848: 16,
  1371: 27,
  2286: 14,
}

export function cdnTeamLogoFromImagePath(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl?.trim()) return null
  const m = pathOrUrl.trim().match(/\/teams\/(\d+)\/(\d+)\./i)
  if (!m) return null
  return `https://cdn.sportmonks.com/images/soccer/teams/${m[1]}/${m[2]}.png`
}

export function sportMonksTeamLogoUrl(teamId: number): string | null {
  const folder = SPORTMONKS_CDN_FOLDER_BY_TEAM_ID[teamId]
  if (folder == null) return null
  return `https://cdn.sportmonks.com/images/soccer/teams/${folder}/${teamId}.png`
}

export function sportMonksLeagueLogoUrl(leagueId: number): string | null {
  const folder = SPORTMONKS_CDN_FOLDER_BY_LEAGUE_ID[leagueId]
  if (folder == null) return null
  return `https://cdn.sportmonks.com/images/soccer/leagues/${folder}/${leagueId}.png`
}

export function sportMonksTeamLogoUrlForClubId(clubId: string): string | null {
  const smId = SPORTMONKS_TEAM_ID_BY_CLUB_ID[clubId]
  if (smId == null) return null
  return sportMonksTeamLogoUrl(smId)
}
