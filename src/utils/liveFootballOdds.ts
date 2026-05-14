import type { Highlight } from '../data/highlights'
import type { SmBookOdds1x2 } from '../api/sportMonks'

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
  const k = 0.95 + 0.55 * tau
  const sh = Math.exp(k * d)
  const sa = Math.exp(-k * d)
  let pH2 = pH * sh
  let pA2 = pA * sa
  let pD2 = pD * Math.exp(-0.32 * Math.abs(d) * tau)
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

function guessSideFromText(
  text: string,
  homeShort: string,
  awayShort: string,
): 'home' | 'away' | null {
  const t = text.toLowerCase()
  const h = homeShort.toLowerCase()
  const a = awayShort.toLowerCase()
  const hasH = h.length >= 2 && t.includes(h)
  const hasA = a.length >= 2 && t.includes(a)
  if (hasH && !hasA) return 'home'
  if (hasA && !hasH) return 'away'
  return null
}

/** Buts affichables (salon live : nom + minute sous le bon camp). */
export type LiveGoalDisplayRow = { side: 'home' | 'away'; name: string; minute: number }

/**
 * Liste ordonnée des buts avec minute et camp, à partir de la timeline SM.
 * Déduplication par camp + slug buteur + minute (deux lignes identiques API).
 */
export function parseLiveGoalRowsFromHighlights(
  highlights: Highlight[],
  homeShort: string,
  awayShort: string,
): LiveGoalDisplayRow[] {
  const out: LiveGoalDisplayRow[] = []
  const seen = new Set<string>()
  for (const h of highlights) {
    if (h.type !== 'But') continue
    const raw = `${h.title ?? ''} ${h.detail ?? ''}`
    const name = parseGoalScorerName(raw) ?? parseGoalScorerName(String(h.detail ?? ''))
    if (!name) continue
    const side = guessSideFromText(raw, homeShort, awayShort)
    if (!side) continue
    const minute = typeof h.minute === 'number' && Number.isFinite(h.minute) ? h.minute : 0
    const slug = slugScorer(name)
    if (!slug) continue
    const key = `${side}:${slug}:${minute}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ side, name, minute })
  }
  out.sort((a, b) => a.minute - b.minute || a.name.localeCompare(b.name))
  return out
}

/** Buteurs déduits des moments forts (pour règlement faux-argent). */
export function extractScorerEventsFromHighlights(
  highlights: Highlight[],
  homeShort: string,
  awayShort: string,
): { side: 'home' | 'away'; slug: string; name: string }[] {
  const out: { side: 'home' | 'away'; slug: string; name: string }[] = []
  const seen = new Set<string>()
  for (const h of highlights) {
    if (h.type !== 'But') continue
    const raw = `${h.title ?? ''} ${h.detail ?? ''}`
    const name = parseGoalScorerName(raw) ?? parseGoalScorerName(String(h.detail ?? ''))
    if (!name) continue
    const slug = slugScorer(name)
    if (!slug) continue
    const side = guessSideFromText(raw, homeShort, awayShort)
    if (!side) continue
    const key = `${side}:${slug}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ side, slug, name })
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
