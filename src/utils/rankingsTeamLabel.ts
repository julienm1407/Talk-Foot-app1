import type { LeagueStandingRow } from '../data/leagueStandings'
import { ALL_CLUBS_BY_ID } from '../data/allClubsCatalog'
import { SPORTMONKS_TEAM_ID_BY_CLUB_ID } from '../data/sportMonksKnownTeamIds'
import { teams } from '../data/teams'
import { apiNameToOurId } from '../api/footballApi'

function catalogShortName(teamId: string): string | null {
  const fromAll = ALL_CLUBS_BY_ID[teamId]?.shortName?.trim()
  if (fromAll) return fromAll
  for (const list of Object.values(teams)) {
    const t = list.find((x) => x.id === teamId)
    if (t?.shortName) return t.shortName
  }
  return null
}

function shortNameFromSportMonksId(smId: number | undefined): string | null {
  if (smId == null || !Number.isFinite(smId)) return null
  for (const [clubId, id] of Object.entries(SPORTMONKS_TEAM_ID_BY_CLUB_ID)) {
    if (id === smId) return catalogShortName(clubId)
  }
  return null
}

/**
 * Sigle lisible pour le classement (PSG, RMA, OM…).
 * Priorité catalogue Talk Foot — évite les troncatures SM du type « PARGE » / « REAMA ».
 */
export function rankingsTeamShort(leagueId: string, row: LeagueStandingRow): string {
  const fromId = catalogShortName(row.teamId)
  if (fromId) return fromId

  const fromSm = shortNameFromSportMonksId(row.sportMonksParticipantId)
  if (fromSm) return fromSm

  const dn = row.displayName?.trim()
  if (dn) {
    const guessed = apiNameToOurId(dn)
    const fromGuess = catalogShortName(guessed)
    if (fromGuess) return fromGuess

    // Sigle SM déjà court et propre.
    if (dn.length <= 4 && /^[A-Za-zÀ-ÿ0-9]+$/.test(dn)) return dn.toUpperCase()
  }

  const list = teams[leagueId as keyof typeof teams]
  const t = list?.find((x) => x.id === row.teamId)
  if (t?.shortName) return t.shortName

  if (row.teamId.startsWith('sm-')) return row.teamId.slice(3)
  return row.teamId.toUpperCase()
}
