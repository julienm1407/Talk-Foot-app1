import type { Team } from '../types/match'
import { clubPathForId, findTeamById, resolveClubIdFromSlug } from './clubRoute'
import { resolveNationForTeam } from './resolveMatchNation'
import { isWorldCupCompetitionId } from './seasonMode'

/** URL hub équipe : fiche nation en CDM, page club sinon. */
export function teamHubPathForMatch(team: Team, competitionId?: string | null): string | null {
  if (!team.id?.trim()) return null
  if (isWorldCupCompetitionId(competitionId)) {
    const nation = resolveNationForTeam(team, competitionId)
    if (nation) return `/nation/${nation.iso.toLowerCase()}`
  }
  const catalogId = resolveClubIdFromSlug(team.id) ?? team.id.trim().toLowerCase()
  if (!findTeamById(catalogId)) return null
  return clubPathForId(catalogId)
}
