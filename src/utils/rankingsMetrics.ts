import type { LeagueStandingRow } from '../data/leagueStandings'
import type { FormResult } from '../types/standings'

export function safeDiv(n: number, d: number): number {
  if (!d || !Number.isFinite(n) || !Number.isFinite(d)) return 0
  return n / d
}

/** Points par match joué. */
export function ppg(r: LeagueStandingRow): number {
  return safeDiv(r.points, Math.max(1, r.played))
}

export function gfPerMatch(r: LeagueStandingRow): number {
  return safeDiv(r.gf, Math.max(1, r.played))
}

export function gaPerMatch(r: LeagueStandingRow): number {
  return safeDiv(r.ga, Math.max(1, r.played))
}

/** Points sur les n derniers résultats de forme (W=3, D=1, L=0). */
export function formWindowPoints(form: FormResult[], n = 5): number {
  const slice = form.slice(-n)
  let pts = 0
  for (const x of slice) {
    if (x === 'W') pts += 3
    else if (x === 'D') pts += 1
  }
  return pts
}

/** Efficacité : points / but marqué (plus haut = plus de points par but). */
export function pointsPerGoal(r: LeagueStandingRow): number {
  if (r.gf <= 0) return r.points
  return safeDiv(r.points, r.gf)
}

export function goalDiff(r: LeagueStandingRow): number {
  return r.gf - r.ga
}

/** Rang si on trie par `score` décroissant (1 = meilleur). */
export function rankByScore(rows: LeagueStandingRow[], score: (r: LeagueStandingRow) => number): Map<string, number> {
  const sorted = [...rows].sort((a, b) => score(b) - score(a) || a.rank - b.rank)
  const m = new Map<string, number>()
  sorted.forEach((r, i) => m.set(r.teamId, i + 1))
  return m
}
