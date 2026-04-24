import type { LeagueStandingRow } from '../data/leagueStandings'
import { teams } from '../data/teams'

/** Libellé court pour une ligne de classement (catalogue Talk Foot ou nom SM). */
export function rankingsTeamShort(leagueId: string, row: LeagueStandingRow): string {
  if (row.displayName?.trim()) return row.displayName.trim()
  const list = teams[leagueId as keyof typeof teams]
  const t = list?.find((x) => x.id === row.teamId)
  if (t?.shortName) return t.shortName
  if (row.teamId.startsWith('sm-')) return row.teamId.slice(3)
  return row.teamId.toUpperCase()
}
