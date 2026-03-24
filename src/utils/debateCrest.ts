import { teams } from '../data/teams'
import type { Team } from '../types/match'

export function getTeamByClubId(clubId: string): Team | null {
  for (const list of Object.values(teams)) {
    const t = list.find((x) => x.id === clubId)
    if (t) return t
  }
  return null
}
