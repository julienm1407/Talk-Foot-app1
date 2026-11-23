import type { LeagueStandingRow } from '../data/leagueStandings'
import type { Match } from '../types/match'
import type { WcStandingRow } from '../types/wc2026'
import { matchCalendarDayKeyParis } from './time'

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

  home.played += 1
  away.played += 1
  if (opts.homeScore > opts.awayScore) {
    home.points += 3
    home.won += 1
    away.lost += 1
    home.form = [...home.form.slice(-4), 'W']
    away.form = [...away.form.slice(-4), 'L']
  } else if (opts.awayScore > opts.homeScore) {
    away.points += 3
    away.won += 1
    home.lost += 1
    home.form = [...home.form.slice(-4), 'L']
    away.form = [...away.form.slice(-4), 'W']
  } else {
    home.points += 1
    away.points += 1
    home.drawn += 1
    away.drawn += 1
    home.form = [...home.form.slice(-4), 'D']
    away.form = [...away.form.slice(-4), 'D']
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

function mostCommonPlayed(rows: LeagueStandingRow[]): number {
  const counts = new Map<number, number>()
  for (const r of rows) counts.set(r.played, (counts.get(r.played) ?? 0) + 1)
  let best = 0
  let n = -1
  for (const [played, c] of counts) {
    if (c > n) {
      n = c
      best = played
    }
  }
  return best
}

/** Intègre les matchs du jour (live ou terminés) si SportMonks n’a pas encore incrémenté PJ. */
export function projectLeagueStandingsFromTodayMatches(
  rows: LeagueStandingRow[],
  matches: Match[],
  leagueId: string,
  now: Date = new Date(),
): LeagueStandingRow[] {
  if (!rows.length) return rows
  const today = matchCalendarDayKeyParis(now)
  const relevant = matches.filter(
    (m) =>
      m.competition.id === leagueId &&
      m.score != null &&
      (m.status === 'live' ||
        (m.status === 'finished' && matchCalendarDayKeyParis(m.kickoffAt) === today)),
  )
  let next = rows
  for (const m of relevant) {
    const homeScore = m.score?.home
    const awayScore = m.score?.away
    if (homeScore == null || awayScore == null) continue
    const hi = next.find((r) => r.teamId === m.home.id)
    const ai = next.find((r) => r.teamId === m.away.id)
    if (!hi || !ai) continue
    if (m.status === 'finished') {
      const mode = mostCommonPlayed(next)
      if (hi.played > mode || ai.played > mode) continue
    }
    next = projectStandingsWithLiveMatch(next, {
      homeTeamId: m.home.id,
      awayTeamId: m.away.id,
      homeScore,
      awayScore,
    })
  }
  return next
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
