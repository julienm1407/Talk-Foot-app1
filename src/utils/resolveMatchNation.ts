import { findNationByName, getNationByIso, type Nation } from '../data/nations'
import type { Match, Team } from '../types/match'
import type { WcMatchTeam } from '../types/wc2026'
import { isWorldCupCompetitionId } from './seasonMode'

const UPCOMING_KICKOFF_GRACE_MS = 60_000

/** Matchs CDM à venir pour une sélection (exclut terminés et coups d’envoi passés). */
export function nationUpcomingMatches(
  matches: readonly Match[],
  nationIso: string,
  nowMs: number = Date.now(),
): Match[] {
  return matches
    .filter((m) => isWorldCupCompetitionId(m.competition.id))
    .filter((m) => matchInvolvesNation(m, nationIso))
    .filter(
      (m) =>
        m.status === 'upcoming' &&
        Date.parse(m.kickoffAt) >= nowMs - UPCOMING_KICKOFF_GRACE_MS,
    )
    .sort((a, b) => Date.parse(a.kickoffAt) - Date.parse(b.kickoffAt))
}

/** Match CDM en direct pour une sélection, s’il existe. */
export function nationLiveMatch(
  matches: readonly Match[],
  nationIso: string,
): Match | null {
  return (
    matches.find(
      (m) =>
        isWorldCupCompetitionId(m.competition.id) &&
        m.status === 'live' &&
        matchInvolvesNation(m, nationIso),
    ) ?? null
  )
}

/** Prochain match à mettre en avant : live prioritaire, sinon le plus proche à venir. */
export function nationFeaturedMatch(
  matches: readonly Match[],
  nationIso: string,
  nowMs: number = Date.now(),
): Match | null {
  return nationLiveMatch(matches, nationIso) ?? nationUpcomingMatches(matches, nationIso, nowMs)[0] ?? null
}

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
