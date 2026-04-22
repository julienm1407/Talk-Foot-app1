import { teams } from './teams'
import type { Team } from '../types/match'

export function findTeamById(id: string): Team | null {
  for (const list of Object.values(teams)) {
    const t = list.find((x) => x.id === id)
    if (t) return t
  }
  return null
}
