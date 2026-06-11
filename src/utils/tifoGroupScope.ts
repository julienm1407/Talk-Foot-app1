import { nationSupporterGroupId } from '../data/nationSupporterGroups'
import type { MatchTribuneZone } from '../types/chat'
import type { Match } from '../types/match'
import { resolveNationForTeam } from './resolveMatchNation'
import { isWorldCupCompetitionId } from './seasonMode'

/** Grille partagée sur la tribune neutre / analystes d'un match. */
export const CHANNEL_TIFO_GROUP_ID = 'g-match-tribune'

/** Une grille tifo par tribune nation (ultras) ou globale match. */
export function tifoGroupIdForMatchChannel(match: Match, tribune: MatchTribuneZone): string {
  if (!isWorldCupCompetitionId(match.competition.id)) {
    return CHANNEL_TIFO_GROUP_ID
  }
  if (tribune === 'home-ultras') {
    const nation = resolveNationForTeam(match.home, match.competition.id)
    if (nation) return nationSupporterGroupId(nation.iso)
  }
  if (tribune === 'away-ultras') {
    const nation = resolveNationForTeam(match.away, match.competition.id)
    if (nation) return nationSupporterGroupId(nation.iso)
  }
  return CHANNEL_TIFO_GROUP_ID
}
