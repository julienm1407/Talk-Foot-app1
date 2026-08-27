import type { Team } from '../types/match'
import { clubPathForId, findTeamById, resolveClubIdFromSlug } from './clubRoute'
import { resolveNationForTeam } from './resolveMatchNation'
import { isWorldCupCompetitionId } from './seasonMode'

/** URL hub équipe : fiche nation en CDM, page club sinon (catalogue ou provisoire SM). */
export function teamHubPathForMatch(team: Team, competitionId?: string | null): string | null {
  if (!team.id?.trim()) return null
  if (isWorldCupCompetitionId(competitionId)) {
    const nation = resolveNationForTeam(team, competitionId)
    if (nation) return `/nation/${nation.iso.toLowerCase()}`
  }
  const catalogId = resolveClubIdFromSlug(team.id) ?? team.id.trim().toLowerCase()
  if (!catalogId) return null
  if (findTeamById(catalogId)) return clubPathForId(catalogId)

  // Clubs hors catalogue (ex. KuPS) : page club provisoire + ids SM / libellés.
  const params = new URLSearchParams()
  if (team.sportMonksTeamId != null && Number.isFinite(team.sportMonksTeamId)) {
    params.set('sm', String(Math.floor(team.sportMonksTeamId)))
  }
  if (team.name?.trim()) params.set('n', team.name.trim().slice(0, 80))
  if (team.shortName?.trim()) params.set('s', team.shortName.trim().slice(0, 24))
  const qs = params.toString()
  const base = clubPathForId(catalogId)
  return qs ? `${base}?${qs}` : base
}
