import type { LeagueStandingRow } from '../data/leagueStandings'
import type { WcStandingRow } from '../types/wc2026'

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

function cloneWcRow(r: WcStandingRow): WcStandingRow {
  return { ...r }
}

/** Projection classement de poule CDM pendant le match (même logique que championnat). */
export function projectWcStandingsWithLiveMatch(
  rows: WcStandingRow[],
  opts: {
    homeIso: string
    awayIso: string
    homeScore: number
    awayScore: number
  },
): WcStandingRow[] {
  if (!rows.length) return rows

  const adjusted = rows.map(cloneWcRow)
  const hi = adjusted.findIndex((r) => r.iso === opts.homeIso)
  const ai = adjusted.findIndex((r) => r.iso === opts.awayIso)
  if (hi < 0 || ai < 0) return rows

  const home = adjusted[hi]!
  const away = adjusted[ai]!

  home.goalsFor += opts.homeScore
  home.goalsAgainst += opts.awayScore
  away.goalsFor += opts.awayScore
  away.goalsAgainst += opts.homeScore
  home.goalDiff = home.goalsFor - home.goalsAgainst
  away.goalDiff = away.goalsFor - away.goalsAgainst

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
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
    return b.goalsFor - a.goalsFor
  })

  return adjusted.map((r, i) => ({ ...r, rank: i + 1 }))
}
