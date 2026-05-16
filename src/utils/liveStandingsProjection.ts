import type { LeagueStandingRow } from '../data/leagueStandings'

function cloneRow(r: LeagueStandingRow): LeagueStandingRow {
  return { ...r, form: [...r.form] }
}

function findTeamIndex(rows: LeagueStandingRow[], teamId: string): number {
  return rows.findIndex((r) => r.teamId === teamId)
}

/**
 * Projection « classement live » pendant le match :
 * nul au score → +1 pt chacun ; équipe qui mène → +3 pts provisoires.
 * Met aussi à jour BP/BC avec le score courant (match non encore compté en J+1 côté API).
 */
export function projectStandingsWithLiveMatch(
  rows: LeagueStandingRow[],
  opts: {
    homeTeamId: string
    awayTeamId: string
    homeScore: number
    awayScore: number
  },
): LeagueStandingRow[] {
  if (!rows.length) return rows

  const adjusted = rows.map(cloneRow)
  const hi = findTeamIndex(adjusted, opts.homeTeamId)
  const ai = findTeamIndex(adjusted, opts.awayTeamId)
  if (hi < 0 || ai < 0) return rows

  const home = adjusted[hi]
  const away = adjusted[ai]

  home.gf += opts.homeScore
  home.ga += opts.awayScore
  away.gf += opts.awayScore
  away.ga += opts.homeScore

  if (opts.homeScore > opts.awayScore) {
    home.points += 3
  } else if (opts.awayScore > opts.homeScore) {
    away.points += 3
  } else {
    home.points += 1
    away.points += 1
  }

  adjusted.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const diffA = a.gf - a.ga
    const diffB = b.gf - b.ga
    if (diffB !== diffA) return diffB - diffA
    return b.gf - a.gf
  })

  return adjusted.map((r, i) => ({ ...r, rank: i + 1 }))
}
