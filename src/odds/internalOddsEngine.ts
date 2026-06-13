import type { SmBookOdds1x2, SmBookOddsOverUnder25 } from './types'
import type {
  InternalOddsResult,
  LiveOddsContext,
  LiveOverUnderLines,
  MatchOddsContext,
  Probabilities1x2,
  ScorerOddsContext,
  TeamPowerFactors,
} from './types'

/** Pondérations demandées pour la puissance équipe. */
export const TEAM_POWER_WEIGHTS = {
  form: 0.35,
  attack: 0.25,
  defense: 0.2,
  home: 0.1,
  ranking: 0.1,
} as const

/** Marge bookmaker par défaut (entre 5 % et 10 %). */
export const DEFAULT_BOOK_MARGIN = 0.075

export const SCORER_WEIGHTS = {
  recentForm: 0.4,
  goalsPerMatch: 0.3,
  starter: 0.2,
  penalty: 0.1,
} as const

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function normalize3(pH: number, pD: number, pA: number): Probabilities1x2 {
  const s = pH + pD + pA
  if (!Number.isFinite(s) || s <= 0) return { pHome: 0.42, pDraw: 0.28, pAway: 0.3 }
  return { pHome: pH / s, pDraw: pD / s, pAway: pA / s }
}

/** Score de puissance 0–100 (forme, attaque, défense, domicile, classement). */
export function teamPowerScore(factors: TeamPowerFactors, absenceFactor = 1): number {
  const w = TEAM_POWER_WEIGHTS
  const raw =
    factors.form * w.form +
    factors.attack * w.attack +
    factors.defense * w.defense +
    factors.home * w.home +
    factors.ranking * w.ranking
  return clamp(raw * clamp(absenceFactor, 0.72, 1), 0, 100)
}

/**
 * Convertit deux puissances en probabilités 1 / N / 2.
 * Courbe calibrée sur des cotes bookmaker (favori ~1,15–1,35, outsider ~8–20).
 */
export function probabilities1x2FromPower(homePower: number, awayPower: number): Probabilities1x2 {
  const diff = clamp(homePower - awayPower, -55, 55)
  const absDiff = Math.abs(diff)

  const homeWinShare = 1 / (1 + Math.exp(-0.078 * diff))
  let pDraw = 0.22 * Math.exp(-0.028 * absDiff) + 0.055
  pDraw = clamp(pDraw, 0.06, 0.32)

  const remain = 1 - pDraw
  let pHome = remain * homeWinShare
  let pAway = remain * (1 - homeWinShare)

  if (absDiff >= 28) {
    pDraw = Math.min(pDraw, 0.14)
    const s = pHome + pDraw + pAway
    pHome /= s
    pDraw /= s
    pAway /= s
  }

  return normalize3(pHome, pDraw, pAway)
}

export function applyBookmakerMargin(
  probs: Probabilities1x2,
  marginPct = DEFAULT_BOOK_MARGIN,
): Probabilities1x2 {
  const m = clamp(marginPct, 0.05, 0.1)
  const over = 1 + m
  const sum = (probs.pHome + probs.pDraw + probs.pAway) * over
  if (!Number.isFinite(sum) || sum <= 0) return probs
  return {
    pHome: (probs.pHome * over) / sum,
    pDraw: (probs.pDraw * over) / sum,
    pAway: (probs.pAway * over) / sum,
  }
}

/** Cote décimale = 1 / probabilité implicite (avec marge déjà dans les probas si souhaité). */
export function probabilityToDecimalOdd(p: number, marginPct = DEFAULT_BOOK_MARGIN): number {
  const implied = clamp(p * (1 + clamp(marginPct, 0.05, 0.1)), 0.018, 0.92)
  return round2(clamp(1 / implied, 1.02, 80))
}

export function probabilitiesToDecimalOdds(
  probs: Probabilities1x2,
  marginPct = DEFAULT_BOOK_MARGIN,
): SmBookOdds1x2 {
  return {
    home: probabilityToDecimalOdd(probs.pHome, marginPct),
    draw: probabilityToDecimalOdd(probs.pDraw, marginPct),
    away: probabilityToDecimalOdd(probs.pAway, marginPct),
  }
}

export function computePrematch1x2FromContext(
  ctx: MatchOddsContext,
  marginPct = DEFAULT_BOOK_MARGIN,
): InternalOddsResult {
  const homePower = teamPowerScore(ctx.home.factors, ctx.home.absenceFactor ?? 1)
  const awayPower = teamPowerScore(ctx.away.factors, ctx.away.absenceFactor ?? 1)
  const probs = probabilities1x2FromPower(homePower, awayPower)
  const odds1x2 = probabilitiesToDecimalOdds(probs, marginPct)
  const ou = prematchOverUnder25From1x2(probs, marginPct)
  return {
    odds1x2,
    oddsOverUnder25: ou,
    probs1x2: probs,
    source: 'talkfoot',
    marginPct,
  }
}

/** Modèle simple : total buts attendu dérivé des probabilités 1N2. */
export function prematchOverUnder25From1x2(
  probs: Probabilities1x2,
  marginPct = DEFAULT_BOOK_MARGIN,
): SmBookOddsOverUnder25 {
  const attackSum = probs.pHome + probs.pAway
  const lambda = 2.35 + (attackSum - 0.72) * 1.1 - probs.pDraw * 0.35
  const lam = clamp(lambda, 1.8, 3.4)
  const p0 = Math.exp(-lam)
  const p1 = p0 * lam
  const p2 = p1 * (lam / 2)
  const pUnder = p0 + p1 + p2
  const pOver = clamp(1 - pUnder, 0.12, 0.88)
  return {
    over: probabilityToDecimalOdd(pOver, marginPct),
    under: probabilityToDecimalOdd(1 - pOver, marginPct),
  }
}

export function impliedProbsFromDecimalOdds(o: SmBookOdds1x2): Probabilities1x2 {
  const iH = 1 / o.home
  const iD = 1 / o.draw
  const iA = 1 / o.away
  const s = iH + iD + iA
  if (!Number.isFinite(s) || s <= 0) return { pHome: 0.42, pDraw: 0.28, pAway: 0.3 }
  return { pHome: iH / s, pDraw: iD / s, pAway: iA / s }
}

/**
 * Ajustements live : score, minute, cartons rouges (−15 % équipe sanctionnée),
 * tirs cadrés x2 (favorise l’équipe dominante).
 */
export function adjustProbabilities1x2ForLive(
  base: Probabilities1x2,
  live: LiveOddsContext,
): Probabilities1x2 {
  const { minute, homeGoals, awayGoals } = live
  const d = homeGoals - awayGoals
  const tau = clamp((minute + 8) / 96, 0.1, 1)
  const k = 1.05 + 0.95 * tau
  const sh = Math.exp(k * d)
  const sa = Math.exp(-k * d)
  let pH = base.pHome * sh
  let pA = base.pAway * sa
  let pD = base.pDraw * Math.exp(-0.48 * Math.abs(d) * tau)

  if (d === 0 && homeGoals === 0 && awayGoals === 0 && minute >= 55) {
    const lateTie = clamp((minute - 55) / 40, 0, 1)
    pD *= Math.exp(-1.1 * lateTie * tau)
    pH *= 1 + 0.06 * lateTie
    pA *= 1 + 0.06 * lateTie
  } else if (d === 0 && homeGoals > 0 && minute >= 50) {
    const late = clamp((minute - 50) / 45, 0, 1)
    pD *= 1 + 0.28 * late * tau
    pH *= 1 - 0.1 * late * tau
    pA *= 1 - 0.1 * late * tau
  }

  const hRed = live.homeRedCards ?? 0
  const aRed = live.awayRedCards ?? 0
  if (hRed > aRed) {
    const pen = Math.pow(0.85, hRed - aRed)
    pH *= pen
  } else if (aRed > hRed) {
    const pen = Math.pow(0.85, aRed - hRed)
    pA *= pen
  }

  const hSot = live.homeShotsOnTarget ?? 0
  const aSot = live.awayShotsOnTarget ?? 0
  if (hSot >= 2 && aSot > 0 && hSot >= aSot * 2) {
    const boost = clamp(0.04 + (hSot / aSot - 2) * 0.03, 0.04, 0.12)
    pH *= 1 + boost
    pD *= 1 - boost * 0.35
    pA *= 1 - boost * 0.65
  } else if (aSot >= 2 && hSot > 0 && aSot >= hSot * 2) {
    const boost = clamp(0.04 + (aSot / hSot - 2) * 0.03, 0.04, 0.12)
    pA *= 1 + boost
    pD *= 1 - boost * 0.35
    pH *= 1 - boost * 0.65
  }

  return normalize3(pH, pD, pA)
}

/** Plafond réaliste des cotes live — ne bride pas l’outsider mené tardivement. */
export function capLive1x2Odds(
  odds: SmBookOdds1x2,
  homeGoals: number,
  awayGoals: number,
  minute: number,
): SmBookOdds1x2 {
  const diff = homeGoals - awayGoals
  const absDiff = Math.abs(diff)
  const tau = clamp((minute + 5) / 95, 0.05, 1)

  let maxOdd = 80
  if (absDiff === 0) {
    maxOdd = clamp(4.8 + (1 - tau) * 2.5, 4.5, 7.5)
  } else if (absDiff === 1 && minute >= 78) {
    maxOdd = 35
  } else if (absDiff >= 2 && minute >= 70) {
    maxOdd = 50
  } else if (absDiff >= 3) {
    maxOdd = 100
  }

  const cap = (n: number) => round2(clamp(n, 1.04, maxOdd))
  return { home: cap(odds.home), draw: cap(odds.draw), away: cap(odds.away) }
}

export function adjust1x2OddsForLiveInternal(
  prematch: SmBookOdds1x2,
  live: LiveOddsContext,
  marginPct = DEFAULT_BOOK_MARGIN,
): SmBookOdds1x2 {
  const base = impliedProbsFromDecimalOdds(prematch)
  const adjusted = adjustProbabilities1x2ForLive(base, live)
  const odds = probabilitiesToDecimalOdds(adjusted, marginPct * 0.95)
  return capLive1x2Odds(odds, live.homeGoals, live.awayGoals, live.minute)
}

/**
 * Ex. score 1-0 à la 70e : pas de +0,5 ; +1,5 match ≈ 70 % ; +2,5 ≈ 35 %.
 */
export function liveOverUnderLines(
  totalGoals: number,
  minute: number,
): LiveOverUnderLines {
  const tau = clamp((minute + 5) / 95, 0.05, 1)
  const timeLeft = clamp(1 - tau, 0.05, 0.95)
  const goalsForOver15 = Math.max(0, 2 - totalGoals)
  const goalsForOver25 = Math.max(0, 3 - totalGoals)

  let pOver15 = 0.5
  let pOver25 = 0.5

  if (goalsForOver15 === 0) pOver15 = 0.99
  else if (goalsForOver15 === 1) {
    pOver15 = clamp(0.7 * (1 - timeLeft * 0.35) + (1 - timeLeft) * 0.15, 0.55, 0.88)
  } else {
    pOver15 = clamp(0.12 + (1 - timeLeft) * 0.08, 0.05, 0.35)
  }

  if (goalsForOver25 === 0) pOver25 = 0.99
  else if (goalsForOver25 === 1) {
    pOver25 = clamp(0.48 * (1 - timeLeft * 0.4), 0.22, 0.62)
  } else if (goalsForOver25 === 2) {
    pOver25 = clamp(0.35 * (1 - timeLeft * 0.55), 0.12, 0.42)
  } else {
    pOver25 = clamp(0.06 + (1 - timeLeft) * 0.04, 0.02, 0.15)
  }

  const hidePlus05 = totalGoals >= 1 && minute >= 65

  return {
    hidePlus05,
    pOver15: clamp(pOver15, 0.02, 0.98),
    pOver25: clamp(pOver25, 0.02, 0.98),
  }
}

export function adjustOverUnder25ForLiveInternal(
  _prematch: SmBookOddsOverUnder25,
  totalGoals: number,
  minute: number,
  marginPct = DEFAULT_BOOK_MARGIN,
): SmBookOddsOverUnder25 {
  const lines = liveOverUnderLines(totalGoals, minute)
  return {
    over: probabilityToDecimalOdd(lines.pOver25, marginPct),
    under: probabilityToDecimalOdd(1 - lines.pOver25, marginPct),
  }
}

function scorerPositionTier(formationPosition?: number): 'gk' | 'def' | 'mid' | 'fwd' {
  if (formationPosition == null || !Number.isFinite(formationPosition)) return 'mid'
  const p = Math.round(formationPosition)
  if (p === 1) return 'gk'
  if (p >= 2 && p <= 5) return 'def'
  if (p >= 6 && p <= 8) return 'mid'
  if (p >= 9 && p <= 11) return 'fwd'
  return 'mid'
}

function estimateGoalsPerMatch(tier: 'gk' | 'def' | 'mid' | 'fwd', teamAttackIndex: number): number {
  const base = teamAttackIndex / 100
  switch (tier) {
    case 'fwd':
      return 0.35 + base * 0.55
    case 'mid':
      return 0.08 + base * 0.18
    case 'def':
      return 0.02 + base * 0.06
    case 'gk':
      return 0
  }
}

function estimateRecentGoalsLast5(tier: 'gk' | 'def' | 'mid' | 'fwd', gpg: number): number {
  switch (tier) {
    case 'fwd':
      return clamp(gpg * 4.2, 0, 5)
    case 'mid':
      return clamp(gpg * 2.5, 0, 3)
    case 'def':
      return clamp(gpg * 1.2, 0, 1.5)
    case 'gk':
      return 0
  }
}

function hashNameSeed(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return h || 1
}

const PENALTY_NAME_HINTS = [
  'mbappe',
  'messi',
  'ronaldo',
  'lewandowski',
  'haaland',
  'kane',
  'lacazette',
  'depay',
  'neymar',
  'calhanoglu',
  'lukaku',
]

function guessPenaltyTaker(name: string, tier: ReturnType<typeof scorerPositionTier>): boolean {
  if (tier !== 'fwd' && tier !== 'mid') return false
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  return PENALTY_NAME_HINTS.some((h) => slug.includes(h))
}

/**
 * Probabilité buteur anytime (0–1), puis conversion en cote.
 * 40 % forme · 30 % buts/match · 20 % titulaire · 10 % penalty.
 */
export function scorerProbabilityScore(ctx: ScorerOddsContext, teamAttackIndex: number): number {
  const tier = scorerPositionTier(ctx.formationPosition)
  if (tier === 'gk') return 0.008

  const gpg =
    ctx.goalsPerMatch ??
    estimateGoalsPerMatch(tier, teamAttackIndex) * (0.92 + (hashNameSeed(ctx.name) % 13) / 100)
  const recent =
    ctx.recentGoalsLast5 ?? estimateRecentGoalsLast5(tier, gpg) * (0.88 + (hashNameSeed(ctx.name) % 17) / 100)

  const formPart = clamp((recent / 5) * 100, 0, 100)
  const gpgPart = clamp(gpg * 45, 0, 100)
  const starterPart = ctx.isStarter ? 100 : 15
  const penPart =
    ctx.isPenaltyTaker ?? guessPenaltyTaker(ctx.name, tier) ? 100 : tier === 'fwd' ? 25 : 8

  const raw =
    formPart * SCORER_WEIGHTS.recentForm +
    gpgPart * SCORER_WEIGHTS.goalsPerMatch +
    starterPart * SCORER_WEIGHTS.starter +
    penPart * SCORER_WEIGHTS.penalty

  const tierCap = tier === 'fwd' ? 72 : tier === 'mid' ? 38 : 18
  return clamp((raw / 100) * tierCap * 0.01, 0.006, tier === 'fwd' ? 0.52 : tier === 'mid' ? 0.22 : 0.08)
}

export function anytimeScorerOddsFromEngine(
  ctx: ScorerOddsContext,
  teamAttackIndex: number,
  alreadyScored: boolean,
  opts?: { liveMinute?: number },
): number {
  if (alreadyScored) return 1.01
  let p = scorerProbabilityScore(ctx, teamAttackIndex)
  const minLive = opts?.liveMinute
  if (minLive != null && minLive > 55) {
    const late = clamp((minLive - 55) / 35, 0, 1)
    p *= 1 - late * 0.35
  }
  const tier = scorerPositionTier(ctx.formationPosition)
  const min = tier === 'gk' ? 80 : tier === 'def' ? 8 : tier === 'mid' ? 3.5 : 2.05
  const max = tier === 'gk' ? 100 : tier === 'def' ? 28 : tier === 'mid' ? 16 : 12
  return round2(clamp(probabilityToDecimalOdd(p, DEFAULT_BOOK_MARGIN), min, max))
}

/** Fallback stable si pas de classement. */
export function synthetic1x2FromSeed(fixtureId: number, marginPct = DEFAULT_BOOK_MARGIN): SmBookOdds1x2 {
  const s1 = Math.sin(fixtureId * 12.989) * 43758.5453
  const s2 = Math.sin(fixtureId * 78.233) * 12345.6789
  const h = s1 - Math.floor(s1)
  const d = s2 - Math.floor(s2)
  const pHome = 0.44 + (h - 0.5) * 0.14 + 0.06
  const pDraw = 0.26 + (d - 0.5) * 0.08
  const pAway = clamp(1 - pHome - pDraw, 0.14, 0.52)
  return probabilitiesToDecimalOdds(normalize3(pHome, pDraw, pAway), marginPct)
}
