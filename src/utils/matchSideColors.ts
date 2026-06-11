import type { Match, Team } from '../types/match'
import { findNationByName, getNationByIso } from '../data/nations'
import { isWorldCupCompetitionId } from './seasonMode'

export type SideColors = { primary: string; secondary: string }

function nationForTeam(team: Team) {
  if (team.shortName?.length === 3) {
    const byIso = getNationByIso(team.shortName)
    if (byIso) return byIso
  }
  return findNationByName(team.name) ?? findNationByName(team.shortName)
}

/** Libellé affiché : nom FR pour les sélections CDM quand connues. */
export function resolveTeamDisplayName(team: Team, competitionId?: string | null): string {
  if (isWorldCupCompetitionId(competitionId)) {
    const nation = nationForTeam(team)
    if (nation) return nation.nameFr
  }
  return team.name
}

/** Applique noms et couleurs FR sur les matchs Coupe du Monde (API SM en anglais). */
export function localizeWcTeam(team: Team): Team {
  const nation = nationForTeam(team)
  if (!nation) return team
  return {
    ...team,
    name: nation.nameFr,
    shortName: nation.iso,
    colors: { primary: nation.primary, secondary: nation.secondary },
  }
}

export function localizeMatchTeams(match: Match): Match {
  if (!isWorldCupCompetitionId(match.competition.id)) return match
  return {
    ...match,
    home: localizeWcTeam(match.home),
    away: localizeWcTeam(match.away),
  }
}

/** Couleurs affichage : nations CDM si compétition Coupe du Monde, sinon palette club. */
export function resolveTeamColors(team: Team, competitionId?: string | null): SideColors {
  if (isWorldCupCompetitionId(competitionId)) {
    const nation = nationForTeam(team)
    if (nation) return { primary: nation.primary, secondary: nation.secondary }
  }
  return team.colors
}

export function matchSpotlightGradient(
  home: Team,
  away: Team,
  competitionId?: string | null,
): string {
  const h = resolveTeamColors(home, competitionId)
  const a = resolveTeamColors(away, competitionId)
  return `linear-gradient(125deg, ${h.primary} 0%, ${h.secondary} 38%, #0a0f1a 50%, ${a.secondary} 62%, ${a.primary} 100%)`
}
