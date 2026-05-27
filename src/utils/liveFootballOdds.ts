import type { Highlight } from '../data/highlights'
import type { SmBookOdds1x2, SmBookOddsOverUnder25 } from '../api/sportMonks'
import {
  adjust1x2OddsForLiveInternal,
  adjustOverUnder25ForLiveInternal,
  anytimeScorerOddsFromEngine,
  impliedProbsFromDecimalOdds,
} from '../odds/internalOddsEngine'
import type { LiveOddsContext } from '../odds/types'

/** Probabilités « dé-vig » simples (partage proportionnel des implied). */
export function impliedProbs1x2(o: SmBookOdds1x2): { pH: number; pD: number; pA: number } {
  const p = impliedProbsFromDecimalOdds(o)
  return { pH: p.pHome, pD: p.pDraw, pA: p.pAway }
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
  liveExtras?: Omit<LiveOddsContext, 'minute' | 'homeGoals' | 'awayGoals'>,
): SmBookOdds1x2 {
  return adjust1x2OddsForLiveInternal(prematch, {
    minute,
    homeGoals,
    awayGoals,
    ...liveExtras,
  })
}

/** Cotes Over/Under 2,5 ajustées au score et au temps restant. */
export function adjustOverUnder25ForLive(
  prematch: SmBookOddsOverUnder25,
  totalGoals: number,
  minute: number,
): SmBookOddsOverUnder25 {
  return adjustOverUnder25ForLiveInternal(prematch, totalGoals, minute)
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

/** Buts affichables (tribune live : nom + minute sous le bon camp). */
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
  opts?: { liveMinute?: number; teamAttackIndex?: number },
): number {
  const probs = impliedProbs1x2(anchor1x2)
  const attackFallback =
    side === 'home'
      ? Math.round(probs.pH * 70 + probs.pA * 15 + 15)
      : Math.round(probs.pA * 70 + probs.pH * 15 + 15)
  const attack = opts?.teamAttackIndex ?? attackFallback

  return anytimeScorerOddsFromEngine(
    {
      name,
      side,
      isStarter: true,
      formationPosition: meta?.formationPosition,
    },
    attack,
    alreadyScored,
    { liveMinute: opts?.liveMinute },
  )
}
