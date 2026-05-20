import type { Highlight } from '../data/highlights'
import type { SmBookOdds1x2, SmBookOddsOverUnder25 } from '../api/sportMonks'

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Probabilités « dé-vig » simples (partage proportionnel des implied). */
export function impliedProbs1x2(o: SmBookOdds1x2): { pH: number; pD: number; pA: number } {
  const iH = 1 / o.home
  const iD = 1 / o.draw
  const iA = 1 / o.away
  const s = iH + iD + iA
  if (!Number.isFinite(s) || s <= 0) return { pH: 0.42, pD: 0.28, pA: 0.3 }
  return { pH: iH / s, pD: iD / s, pA: iA / s }
}

/**
 * Cotes 1N2 « live » à partir des cotes book (pré-match ou dernière poll) et du score courant.
 * Plus le score est favorable et plus la fin de match approche, plus la cote du leader se resserre.
 */
export function adjust1x2OddsForLive(
  prematch: SmBookOdds1x2,
  homeGoals: number,
  awayGoals: number,
  minute: number,
): SmBookOdds1x2 {
  const { pH, pD, pA } = impliedProbs1x2(prematch)
  const d = homeGoals - awayGoals
  const tau = clamp((minute + 8) / 96, 0.1, 1)
  const k = 0.95 + 0.85 * tau
  const sh = Math.exp(k * d)
  const sa = Math.exp(-k * d)
  let pH2 = pH * sh
  let pA2 = pA * sa
  let pD2 = pD * Math.exp(-0.42 * Math.abs(d) * tau)
  if (d === 0 && minute >= 55) {
    const lateTie = clamp((minute - 55) / 40, 0, 1)
    pD2 *= Math.exp(-2.4 * lateTie * tau)
    pH2 *= 1 + 0.12 * lateTie
    pA2 *= 1 + 0.12 * lateTie
  }
  const sum = pH2 + pD2 + pA2
  pH2 /= sum
  pD2 /= sum
  pA2 /= sum
  const overround = 1.048
  const toDec = (p: number) => round2(1 / clamp(p * overround, 0.018, 0.92))
  return {
    home: clamp(toDec(pH2), 1.02, 80),
    draw: clamp(toDec(pD2), 1.02, 80),
    away: clamp(toDec(pA2), 1.02, 80),
  }
}

/** Cotes Over/Under 2,5 ajustées au score et au temps restant. */
export function adjustOverUnder25ForLive(
  prematch: SmBookOddsOverUnder25,
  totalGoals: number,
  minute: number,
): SmBookOddsOverUnder25 {
  const iOver = 1 / prematch.over
  const iUnder = 1 / prematch.under
  const s = iOver + iUnder
  let pOver = s > 0 ? iOver / s : 0.5
  let pUnder = s > 0 ? iUnder / s : 0.5
  const tau = clamp((minute + 6) / 98, 0.08, 1)
  const goalsNeededForOver = Math.max(0, 3 - totalGoals)
  if (goalsNeededForOver === 0) {
    pOver = 0.99
    pUnder = 0.01
  } else if (goalsNeededForOver >= 3) {
    const timeLeft = clamp(1 - tau, 0.05, 0.95)
    pOver *= Math.exp(-2.2 * timeLeft)
    pUnder = 1 - pOver
  } else {
    const urgency = clamp((minute - 20) / 75, 0, 1) * goalsNeededForOver
    pOver *= Math.exp(-1.15 * urgency * tau)
    pUnder = 1 - pOver
  }
  const norm = pOver + pUnder
  if (norm > 0) {
    pOver /= norm
    pUnder /= norm
  }
  const overround = 1.05
  const toDec = (p: number) => round2(1 / clamp(p * overround, 0.02, 0.92))
  return {
    over: clamp(toDec(pOver), 1.02, 50),
    under: clamp(toDec(pUnder), 1.02, 50),
  }
}

export function slugScorer(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

/**
 * Titulaire (slug depuis la compo) vs but déjà déduit des moments forts (slug souvent plus court).
 */
export function scorerLineupMatchesScoredGoal(
  lineupSlug: string,
  goal: { slug: string; name?: string },
): boolean {
  if (!lineupSlug || !goal.slug) return false
  if (lineupSlug === goal.slug) return true
  if (goal.name) {
    const fromName = slugScorer(goal.name)
    if (fromName) {
      if (fromName === lineupSlug) return true
      if (fromName.length >= 5 && lineupSlug.endsWith(`-${fromName}`)) return true
      if (lineupSlug.length >= 5 && fromName.endsWith(`-${lineupSlug}`)) return true
    }
  }
  const parts = goal.slug.split('-').filter(Boolean)
  const single = parts.length === 1
  if (single && goal.slug.length >= 5 && lineupSlug.endsWith(`-${goal.slug}`)) return true
  return false
}

/** Nom court affiché sous le score (nom de famille si possible). */
export function compactScorerDisplayName(name: string): string {
  const cleaned = name.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'Buteur'
  const parts = cleaned.split(' ').filter(Boolean)
  if (parts.length >= 2) return parts[parts.length - 1] ?? cleaned
  return cleaned
}

/** Extrait le passeur depuis un libellé de but (commentaire SM / EN / FR). */
export function parseGoalAssistFromText(raw: string): string | null {
  const s = raw.replace(/\s+/g, ' ').trim()
  if (!s) return null

  const assistClause =
    s.match(/\bassist(?:ed)?\s*(?:by|:)\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{1,48})/i) ??
    s.match(/\bpasse\s+d[eé]cisive\s+(?:de\s+)?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{1,48})/i)
  if (assistClause?.[1]) {
    const name = assistClause[1].replace(/\s+\d{1,2}['']?\s*$/u, '').trim()
    if (name.length >= 2) return name
  }

  const parenPairs = [...s.matchAll(/\(([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{1,48})\)/g)]
  if (parenPairs.length) {
    const last = parenPairs[parenPairs.length - 1][1].trim()
    if (last.length >= 2 && !/^\d{1,2}\+?\d*['']?$/.test(last)) return last
  }

  return null
}

/** Libellé buteur + passeur : « Salah (Alexander-Arnold) » — le ballon ne concerne que le buteur. */
export function formatGoalScorerLabel(scorer: string, assist?: string | null): string {
  const sc = compactScorerDisplayName(scorer)
  if (!assist?.trim()) return sc
  const as = compactScorerDisplayName(assist)
  if (!as || slugScorer(as) === slugScorer(sc)) return sc
  return `${sc} (${as})`
}

/** Extrait « prénom nom » depuis un libellé de but (timeline FR / EN). */
export function parseGoalScorerName(raw: string): string | null {
  const s = raw.replace(/\s+/g, ' ').trim()
  if (!s) return null
  const cut = (sep: string) => {
    const i = s.lastIndexOf(sep)
    if (i === -1) return null
    const tail = s.slice(i + sep.length).trim()
    return tail.length >= 2 ? tail : null
  }
  const fromSep = cut('·') ?? cut('–') ?? cut('-') ?? cut(':')
  if (fromSep) return fromSep
  const badLast = new Set(['goal', 'gol', 'but', 'score', 'minute', 'penalty', 'own', 'var'])
  const parts = s.split(/[\s|]+/).filter((p) => p.length >= 2)
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const p = parts[i].replace(/[^A-Za-zÀ-ÿ'-]/g, '')
    if (p.length < 4 || /^\d+$/.test(p) || badLast.has(p.toLowerCase())) continue
    return p
  }
  return null
}

/** Indices pour rattacher un but au bon camp (sigle, nom, id SM). */
export type LiveGoalTeamHints = {
  shortName: string
  name: string
  sportMonksTeamId?: number
}

function guessSideFromTeams(
  text: string,
  home: LiveGoalTeamHints,
  away: LiveGoalTeamHints,
): 'home' | 'away' | null {
  const raw = text
  const t = raw.toLowerCase()

  if (/\b(psg|paris\s*saint|saint[\s-]?germain)\b/i.test(raw)) {
    if (away.sportMonksTeamId === 591 || away.shortName.toUpperCase() === 'PSG') return 'away'
    if (home.sportMonksTeamId === 591 || home.shortName.toUpperCase() === 'PSG') return 'home'
  }
  if (/\b(paris\s*fc|paris\s*football|football\s*club)\b/i.test(raw)) {
    if (home.sportMonksTeamId === 4508) return 'home'
    if (away.sportMonksTeamId === 4508) return 'away'
  }

  const needles: { side: 'home' | 'away'; needle: string }[] = []
  for (const s of [home.name, home.shortName]) {
    const n = s.trim().toLowerCase()
    if (n.length >= 3) needles.push({ side: 'home', needle: n })
  }
  for (const s of [away.name, away.shortName]) {
    const n = s.trim().toLowerCase()
    if (n.length >= 3) needles.push({ side: 'away', needle: n })
  }
  needles.sort((a, b) => b.needle.length - a.needle.length)

  let hitH = false
  let hitA = false
  for (const { side, needle } of needles) {
    if (!t.includes(needle)) continue
    if (side === 'home') hitH = true
    else hitA = true
  }
  if (hitH && !hitA) return 'home'
  if (hitA && !hitH) return 'away'
  return null
}

/** Buts affichables (salon live : nom + minute sous le bon camp). */
export type LiveGoalDisplayRow = {
  side: 'home' | 'away'
  name: string
  minute: number
  assistName?: string
}

/**
 * Liste ordonnée des buts avec minute et camp, à partir de la timeline SM.
 * Déduplication par camp + slug buteur + minute (deux lignes identiques API).
 */
export function parseLiveGoalRowsFromHighlights(
  highlights: Highlight[],
  home: LiveGoalTeamHints,
  away: LiveGoalTeamHints,
  scoreHint?: { home: number; away: number },
): LiveGoalDisplayRow[] {
  const out: LiveGoalDisplayRow[] = []
  const seen = new Set<string>()
  const pendingNoSide: Omit<LiveGoalDisplayRow, 'side'>[] = []

  for (const h of highlights) {
    if (h.type !== 'But') continue
    const raw = `${h.title ?? ''} ${h.detail ?? ''}`
    const name =
      h.scorerName?.trim() ||
      parseGoalScorerName(raw) ||
      parseGoalScorerName(String(h.detail ?? '')) ||
      parseGoalScorerName(String(h.title ?? ''))
    if (!name) continue
    const minute = typeof h.minute === 'number' && Number.isFinite(h.minute) ? h.minute : 0
    const slug = slugScorer(name)
    if (!slug) continue
    const displayName = compactScorerDisplayName(name)
    const side = h.side ?? guessSideFromTeams(raw, home, away)
    if (!side) {
      pendingNoSide.push({ name: displayName, minute })
      continue
    }
    const key = `${side}:${slug}:${minute}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ side, name: displayName, minute })
  }

  if (pendingNoSide.length && scoreHint) {
    const homeGoals = out.filter((r) => r.side === 'home').length
    const awayGoals = out.filter((r) => r.side === 'away').length
    const homeMissing = Math.max(0, scoreHint.home - homeGoals)
    const awayMissing = Math.max(0, scoreHint.away - awayGoals)
    for (const row of pendingNoSide) {
      let side: 'home' | 'away' | null = null
      if (homeMissing > 0 && awayMissing === 0) side = 'home'
      else if (awayMissing > 0 && homeMissing === 0) side = 'away'
      else if (homeMissing > 0 && awayMissing > 0 && pendingNoSide.length === 1) {
        side = awayMissing >= homeMissing ? 'away' : 'home'
      }
      if (!side) continue
      const key = `${side}:${slugScorer(row.name)}:${row.minute}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ side, name: row.name, minute: row.minute })
    }
  }

  out.sort((a, b) => a.minute - b.minute || a.name.localeCompare(b.name))
  return out
}

/** Buteurs déduits des moments forts (pour règlement faux-argent). */
export function extractScorerEventsFromHighlights(
  highlights: Highlight[],
  home: LiveGoalTeamHints,
  away: LiveGoalTeamHints,
): { side: 'home' | 'away'; slug: string; name: string }[] {
  const out: { side: 'home' | 'away'; slug: string; name: string }[] = []
  const seen = new Set<string>()
  for (const h of highlights) {
    if (h.type !== 'But') continue
    const raw = `${h.title ?? ''} ${h.detail ?? ''}`
    const name =
      h.scorerName?.trim() ||
      parseGoalScorerName(raw) ||
      parseGoalScorerName(String(h.detail ?? '')) ||
      parseGoalScorerName(String(h.title ?? ''))
    if (!name) continue
    const slug = slugScorer(name)
    if (!slug) continue
    const side = h.side ?? guessSideFromTeams(raw, home, away)
    if (!side) continue
    const key = `${side}:${slug}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ side, slug, name: compactScorerDisplayName(name) })
  }
  return out
}

/** Métadonnées compos SM pour calibrer la cote buteur (poste + terrain). */
export type ScorerLineupMeta = {
  formationPosition?: number
  formationField?: string
}

/**
 * Poste SM (`formation_position`) : 1 = gardien, 2–5 défense, 6–8 milieu, 9–11 attaque.
 * Sans info → milieu (neutre).
 */
export function scorerPositionTier(formationPosition?: number): 'gk' | 'def' | 'mid' | 'fwd' {
  if (formationPosition == null || !Number.isFinite(formationPosition)) return 'mid'
  const p = Math.round(formationPosition)
  if (p === 1) return 'gk'
  if (p >= 2 && p <= 5) return 'def'
  if (p >= 6 && p <= 8) return 'mid'
  if (p >= 9 && p <= 11) return 'fwd'
  return 'mid'
}

/** Plus le facteur est bas, plus la cote décimale est basse (attaquant favori). */
function scorerPositionOddsFactor(tier: 'def' | 'mid' | 'fwd'): number {
  switch (tier) {
    case 'fwd':
      return 0.62
    case 'mid':
      return 0.94
    case 'def':
      return 1.32
  }
}

function hashNameSeed(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return h || 1
}

/**
 * Cote buteur « anytime » : poste (attaquant < milieu < défenseur ; **gardien = 100**),
 * difficulté du match (favori vs outsider), micro-étalement sur le nom.
 */
export function anytimeScorerOdds(
  name: string,
  side: 'home' | 'away',
  anchor1x2: SmBookOdds1x2,
  alreadyScored: boolean,
  meta?: ScorerLineupMeta | null,
  opts?: { liveMinute?: number },
): number {
  if (alreadyScored) return 1.01
  const tier = scorerPositionTier(meta?.formationPosition)
  /** Gardien : buteur extrêmement rare → cote fixe symbolique. */
  if (tier === 'gk') return 100

  const { pH, pD, pA } = impliedProbs1x2(anchor1x2)
  const pTeam = side === 'home' ? pH : pA
  const pOpp = side === 'home' ? pA : pH
  /** Écart de niveau : positif si notre équipe nettement au-dessus (cotes faciles pour les buteurs). */
  const favGap = clamp(pTeam - pOpp, -0.38, 0.58)
  /** Adversaire dangereux même si on reste favori (ex. Bayern à l’extérieur du PSG) → cotes buteur plus hautes. */
  const oppThreat = clamp(pOpp / clamp(pTeam + 0.12, 0.1, 0.92), 0.22, 3.4)

  let base = 7.4 - 8.6 * favGap + 1.35 * oppThreat - 1.1 * pTeam - 0.28 * pD
  base = clamp(base, 2.05, 13.8)

  let odds = base * scorerPositionOddsFactor(tier)

  const h = hashNameSeed(name)
  const micro = 0.94 + ((h % 19) / 19) * 0.12
  odds *= micro

  const min = tier === 'def' ? 5.8 : tier === 'mid' ? 3.4 : 2.05
  const max = tier === 'def' ? 38 : tier === 'mid' ? 22 : 14
  odds = clamp(odds, min, max)

  const minLive = typeof opts?.liveMinute === 'number' && Number.isFinite(opts.liveMinute) ? opts.liveMinute : null
  if (minLive != null && minLive > 55) {
    const late = clamp((minLive - 55) / 35, 0, 1)
    const squeeze = 1 - late * (tier === 'fwd' ? 0.1 : tier === 'mid' ? 0.06 : 0.04)
    odds *= squeeze
  }

  return round2(clamp(odds, min, max))
}
