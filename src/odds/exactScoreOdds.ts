import type { BetSelection } from '../types/bet'
import {
  DEFAULT_BOOK_MARGIN,
  impliedProbsFromDecimalOdds,
  probabilityToExactScoreOdd,
} from './internalOddsEngine'
import type { Probabilities1x2, SmBookOdds1x2 } from './types'

export type ExactScoreCategory = 'home' | 'draw' | 'away'

export type ExactScorePick = {
  id: BetSelection
  label: string
  homeGoals: number
  awayGoals: number
  odds: number
  category: ExactScoreCategory
  disabled?: boolean
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function poissonPMF(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0
  if (k < 0) return 0
  let term = Math.exp(-lambda)
  for (let i = 1; i <= k; i += 1) term *= lambda / i
  return term
}

function remainingGoalsExpectancy(minute: number, totalPerMatch = 2.55): number {
  const tau = clamp(minute / 95, 0, 1)
  return totalPerMatch * clamp(1 - tau, 0.025, 1)
}

/** Buts attendus domicile / extérieur dérivés des probas 1N2. */
export function expectedGoalsFrom1x2Probs(probs: Probabilities1x2): { lamH: number; lamA: number } {
  const attackSum = probs.pHome + probs.pAway
  const lambda = clamp(2.35 + (attackSum - 0.72) * 1.1 - probs.pDraw * 0.35, 1.55, 3.25)
  const homeShare = clamp(probs.pHome / Math.max(0.12, probs.pHome + probs.pAway), 0.2, 0.8)
  return { lamH: lambda * homeShare, lamA: lambda * (1 - homeShare) }
}

export function exactScoreSelectionId(homeGoals: number, awayGoals: number): BetSelection {
  return `ex:${homeGoals}:${awayGoals}` as BetSelection
}

export function parseExactScoreSelection(
  selection: BetSelection,
): { home: number; away: number } | null {
  const s = String(selection)
  const m = /^ex:(\d+):(\d+)$/.exec(s)
  if (m) {
    return { home: Number(m[1]), away: Number(m[2]) }
  }
  const legacy = LEGACY_SCORE_KEY_MAP[s]
  if (legacy) return { home: legacy[0], away: legacy[1] }
  return null
}

const LEGACY_SCORE_KEY_MAP: Record<string, [number, number]> = {
  '00': [0, 0],
  '10': [1, 0],
  '20': [2, 0],
  '21': [2, 1],
  '11': [1, 1],
  '01': [0, 1],
  '12': [1, 2],
}

function scoreCategory(home: number, away: number): ExactScoreCategory {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

function scoreProbabilityGrid(opts: {
  lamH: number
  lamA: number
  minHome: number
  minAway: number
  maxGoals: number
}): Map<string, number> {
  const { lamH, lamA, minHome, minAway, maxGoals } = opts
  const grid = new Map<string, number>()
  let sum = 0
  for (let h = minHome; h <= maxGoals; h += 1) {
    for (let a = minAway; a <= maxGoals; a += 1) {
      const dh = h - minHome
      const da = a - minAway
      const p = poissonPMF(dh, lamH) * poissonPMF(da, lamA)
      if (p <= 0) continue
      grid.set(`${h}:${a}`, p)
      sum += p
    }
  }
  if (sum <= 0) return grid
  const keepMass = clamp(sum, 0.72, 0.98)
  for (const [k, v] of grid) {
    grid.set(k, (v / sum) * keepMass)
  }
  return grid
}

function probToOdds(p: number, marginPct = DEFAULT_BOOK_MARGIN): number {
  const minOdd =
    p >= 0.14 ? 4.5 : p >= 0.08 ? 5.5 : p >= 0.04 ? 7 : p >= 0.02 ? 9 : 12
  return probabilityToExactScoreOdd(p, marginPct, minOdd, 150)
}

function resolveExpectedGoals(
  odds1x2: SmBookOdds1x2,
  opts?: {
    prematchOdds1x2?: SmBookOdds1x2 | null
    liveMinute?: number | null
    isLive?: boolean
  },
): { lamH: number; lamA: number } {
  const liveProbs = impliedProbsFromDecimalOdds(odds1x2)
  const prematchProbs = opts?.prematchOdds1x2
    ? impliedProbsFromDecimalOdds(opts.prematchOdds1x2)
    : liveProbs
  const liveFull = expectedGoalsFrom1x2Probs(liveProbs)
  const prematchFull = expectedGoalsFrom1x2Probs(prematchProbs)

  if (!opts?.isLive) return prematchFull

  const minute = opts.liveMinute ?? 0
  const liveBlend = clamp(minute / 90, 0.15, 0.65)
  return {
    lamH: prematchFull.lamH * (1 - liveBlend) + liveFull.lamH * liveBlend,
    lamA: prematchFull.lamA * (1 - liveBlend) + liveFull.lamA * liveBlend,
  }
}

/**
 * Cotes score exact (grille 0–4) calibrées sur le 1N2 — favori → scores « son » côté plus bas.
 */
export function exactScorePicksFrom1x2(
  odds1x2: SmBookOdds1x2,
  opts?: {
    liveScore?: { home: number; away: number } | null
    liveMinute?: number | null
    prematchOdds1x2?: SmBookOdds1x2 | null
    maxGoals?: number
    marginPct?: number
  },
): ExactScorePick[] {
  const scoreHome = Math.max(0, opts?.liveScore?.home ?? 0)
  const scoreAway = Math.max(0, opts?.liveScore?.away ?? 0)
  const minute = opts?.liveMinute ?? 0
  const isLive = minute > 0 || scoreHome > 0 || scoreAway > 0
  const full = resolveExpectedGoals(odds1x2, {
    prematchOdds1x2: opts?.prematchOdds1x2,
    liveMinute: minute,
    isLive,
  })
  const remainShare = isLive ? remainingGoalsExpectancy(minute) / 2.55 : 1
  const lamH = full.lamH * clamp(remainShare, 0.08, 1)
  const lamA = full.lamA * clamp(remainShare, 0.08, 1)
  const maxGoals = opts?.maxGoals ?? 4
  const marginPct = opts?.marginPct ?? DEFAULT_BOOK_MARGIN

  const grid = scoreProbabilityGrid({
    lamH,
    lamA,
    minHome: scoreHome,
    minAway: scoreAway,
    maxGoals,
  })

  const picks: ExactScorePick[] = []
  for (const [key, p] of grid) {
    const [h, a] = key.split(':').map(Number)
    if (!Number.isFinite(h) || !Number.isFinite(a)) continue
    picks.push({
      id: exactScoreSelectionId(h, a),
      label: `${h}-${a}`,
      homeGoals: h,
      awayGoals: a,
      odds: probToOdds(p, marginPct),
      category: scoreCategory(h, a),
    })
  }

  picks.sort((x, y) => x.odds - y.odds)

  const byCat = {
    home: picks.filter((p) => p.category === 'home'),
    draw: picks.filter((p) => p.category === 'draw'),
    away: picks.filter((p) => p.category === 'away'),
  }

  const cap = (rows: ExactScorePick[], n: number) => rows.slice(0, n)
  return [
    ...cap(byCat.home, 7),
    ...cap(byCat.draw, 4),
    ...cap(byCat.away, 7),
  ].sort((a, b) => a.odds - b.odds)
}
