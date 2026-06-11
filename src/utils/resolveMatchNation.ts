import { findNationByName, getNationByIso, type Nation } from '../data/nations'
import type { Match, Team } from '../types/match'
import type { WcMatchTeam } from '../types/wc2026'
import { isWorldCupCompetitionId } from './seasonMode'

/** Résout une nation à partir d'un ISO et/ou d'un libellé (EN ou FR). */
export function resolveNationByIsoOrName(
  iso?: string | null,
  name?: string | null,
): Nation | null {
  if (iso) {
    const byIso = getNationByIso(iso)
    if (byIso) return byIso
  }
  return findNationByName(name)
}

/** Résout une nation pour un slot CDM (poules, bracket, etc.). */
export function resolveNationForWcSlot(slot: Pick<WcMatchTeam, 'iso' | 'label'>): Nation | null {
  return resolveNationByIsoOrName(slot.iso, slot.label)
}

/** Résout une nation pour une équipe d'un match Talk Foot (fixtures SM). */
export function resolveNationForTeam(team: Team, competitionId?: string | null): Nation | null {
  if (!isWorldCupCompetitionId(competitionId)) return null
  const byIso = team.shortName?.length === 3 ? getNationByIso(team.shortName) : null
  return byIso ?? findNationByName(team.name) ?? findNationByName(team.shortName)
}

/** Vrai si la sélection (ISO) joue ce match CDM. */
export function matchInvolvesNation(match: Match, nationIso: string): boolean {
  const iso = nationIso.toUpperCase()
  const home = resolveNationForTeam(match.home, match.competition.id)
  const away = resolveNationForTeam(match.away, match.competition.id)
  return home?.iso === iso || away?.iso === iso
}
