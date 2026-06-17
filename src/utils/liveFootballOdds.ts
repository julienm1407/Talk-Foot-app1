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
 * Ne matche pas deux joueurs du même camp qui partagent le nom de famille (ex. João vs Ruben Neves).
 */
export function scorerLineupMatchesScoredGoal(
  lineupSlug: string,
  goal: { slug: string; name?: string },
): boolean {
  if (!lineupSlug || !goal.slug) return false
  if (lineupSlug === goal.slug) return true

  const goalSlugParts = goal.slug.split('-').filter(Boolean)
  const lineupParts = lineupSlug.split('-').filter(Boolean)
  if (lineupParts.length === 0) return false

  const samePersonFromSlugParts = (givenParts: string[]) => {
    if (givenParts.length >= 2 && lineupParts.length >= 2) {
      const goalSurname = givenParts[givenParts.length - 1]!
      const lineupSurname = lineupParts[lineupParts.length - 1]!
      if (goalSurname !== lineupSurname) return false
      return givenParts[0] === lineupParts[0]
    }
    if (givenParts.length === 1) {
      return lineupSlug === givenParts[0]
    }
    return false
  }

  const goalName = goal.name?.trim()
  if (goalName) {
    const fromFullName = slugScorer(goalName)
    if (fromFullName === lineupSlug) return true
    const nameSlugParts = fromFullName.split('-').filter(Boolean)
    if (nameSlugParts.length >= 2) {
      return samePersonFromSlugParts(nameSlugParts)
    }
  }

  if (goalSlugParts.length >= 2) {
    return samePersonFromSlugParts(goalSlugParts)
  }

  // Slug buteur incomplet (souvent nom de famille seul côté SM).
  if (goalSlugParts.length === 1) {
    const surname = goalSlugParts[0]!
    if (lineupParts[lineupParts.length - 1] !== surname) return false
    if (lineupSlug === surname) return true
    if (goalName) {
      const nameTokens = goalName.split(/\s+/).filter(Boolean)
      if (nameTokens.length >= 2) {
        const goalFirst = slugScorer(nameTokens[0]!).split('-')[0]
        return goalFirst === lineupParts[0]
      }
    }
    return false
  }

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
export function formatGoalScorerLabel(
  scorer: string,
  assist?: string | null,
  opts?: { ownGoal?: boolean },
): string {
  const sc = compactScorerDisplayName(scorer)
  let base = sc
  if (assist?.trim()) {
    const as = compactScorerDisplayName(assist)
    if (as && slugScorer(as) !== slugScorer(sc)) {
      base = `${sc} (${as})`
    }
  }
  if (opts?.ownGoal) return `${base} (CSC)`
  return base
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
  const badLast = new Set([
    'goal',
    'gol',
    'but',
    'score',
    'minute',
    'penalty',
    'own',
    'var',
    'foul',
    'fouls',
    'fouled',
    'faute',
    'fautes',
    'yellow',
    'red',
    'card',
    'carton',
    'jaune',
    'rouge',
    'booking',
    'booked',
    'receives',
    'receive',
    'received',
    'commits',
    'commit',
    'awarded',
    'shown',
    'caution',
    'second',
  ])
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
  /** Variantes (ex. Mexique + Mexico pour les sélections). */
  aliases?: string[]
}

function teamLabelTokens(home: LiveGoalTeamHints, away: LiveGoalTeamHints): Set<string> {
  const tokens = new Set<string>()
  for (const team of [home, away]) {
    for (const raw of [team.name, team.shortName, ...(team.aliases ?? [])]) {
      const label = String(raw ?? '').trim()
      if (!label) continue
      tokens.add(label.toLowerCase())
      const slug = slugScorer(label)
      if (slug) tokens.add(slug)
    }
  }
  return tokens
}

/** Vrai si le libellé correspond à une équipe du match (pas un joueur). */
export function isMatchTeamLabel(
  name: string,
  home: LiveGoalTeamHints,
  away: LiveGoalTeamHints,
): boolean {
  const cleaned = name.replace(/\s+/g, ' ').trim()
  if (!cleaned) return false
  const tokens = teamLabelTokens(home, away)
  const lower = cleaned.toLowerCase()
  const slug = slugScorer(cleaned)
  if (tokens.has(lower)) return true
  if (slug && tokens.has(slug)) return true
  return false
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
  inSecondHalf?: boolean
  ownGoal?: boolean
  assistName?: string
}

/** Limite les buteurs affichés au score réel (évite les faux buts des commentaires). */
export function clampLiveGoalRowsToScore(
  rows: LiveGoalDisplayRow[],
  homeScore: number,
  awayScore: number,
): LiveGoalDisplayRow[] {
  if (homeScore + awayScore <= 0) return []
  const home = rows
    .filter((r) => r.side === 'home')
    .sort((a, b) => a.minute - b.minute || a.name.localeCompare(b.name))
  const away = rows
    .filter((r) => r.side === 'away')
    .sort((a, b) => a.minute - b.minute || a.name.localeCompare(b.name))
  return [...home.slice(0, homeScore), ...away.slice(0, awayScore)].sort(
    (a, b) => a.minute - b.minute || a.name.localeCompare(b.name),
  )
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
    if (!name || !isPlausibleGoalScorerName(name)) continue
    const displayName = compactScorerDisplayName(name)
    if (isMatchTeamLabel(displayName, home, away)) continue
    const minute = typeof h.minute === 'number' && Number.isFinite(h.minute) ? h.minute : 0
    const slug = slugScorer(name)
    if (!slug) continue
    const side = h.side ?? guessSideFromTeams(raw, home, away)
    if (!side) {
      pendingNoSide.push({ name: displayName, minute })
      continue
    }
    const key = `${side}:${slug}:${minute}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ side, name: displayName, minute, inSecondHalf: h.inSecondHalf, ownGoal: h.ownGoal })
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

/** Cartons affichables sous le score (style Flashscore). */
export type LiveCardDisplayRow = {
  side: 'home' | 'away'
  name: string
  minute: number
  inSecondHalf?: boolean
  color: 'yellow' | 'red'
}

const CARD_PLAYER_NAME_NOISE = new Set([
  'foul',
  'fouls',
  'fouled',
  'faute',
  'fautes',
  'yellow',
  'red',
  'card',
  'carton',
  'jaune',
  'rouge',
  'booking',
  'booked',
  'player',
  'joueur',
  'var',
  'offside',
  'corner',
  'substitution',
  'evenement',
  'event',
  'receives',
  'receive',
  'received',
  'reçoit',
  'recoit',
  'commits',
  'commit',
  'committed',
  'awarded',
  'given',
  'shown',
  'caution',
  'cautioned',
  'warned',
  'warning',
  'second',
  'missed',
  'saved',
  'blocked',
  'counterattack',
  'counter',
  'header',
  'volley',
  'rebound',
  'deflection',
  'tapin',
  'tap',
  'openplay',
  'open',
  'play',
  'scorer',
  'assist',
  'assisted',
  'substitution',
  'substitute',
  'subbed',
  'sub',
  'after',
  'before',
  'during',
  'africa',
  'america',
  'asia',
  'europe',
  'guinea',
  'islands',
  'republic',
  'states',
])

const GEO_NAME_FRAGMENTS = new Set([
  'africa',
  'america',
  'asia',
  'europe',
  'guinea',
  'islands',
  'republic',
  'states',
  'south',
  'north',
  'east',
  'west',
  'arab',
  'korea',
])

export function isLikelyGeographicFragment(name: string): boolean {
  const cleaned = name.replace(/\s+/g, ' ').trim().toLowerCase()
  const slug = slugScorer(cleaned)
  return GEO_NAME_FRAGMENTS.has(cleaned) || (slug ? GEO_NAME_FRAGMENTS.has(slug) : false)
}

function looksLikePlayerDisplayName(name: string): boolean {
  const parts = name.split(/\s+/).filter(Boolean)
  if (!parts.length) return false
  const last = parts[parts.length - 1] ?? name
  if (/^[A-ZÀ-ÖØ-Þ]/.test(last)) return true
  if (/^[A-ZÀ-ÖØ-Þ]{2,}$/.test(last)) return true
  if (parts.length >= 2) return true
  return false
}

export function isPlausibleCardPlayerName(name: string): boolean {
  const cleaned = name.replace(/\s+/g, ' ').trim()
  if (cleaned.length < 2) return false
  const slug = slugScorer(cleaned)
  if (!slug) return false
  if (CARD_PLAYER_NAME_NOISE.has(slug)) return false
  if (CARD_PLAYER_NAME_NOISE.has(cleaned.toLowerCase())) return false
  if (isLikelyGeographicFragment(cleaned)) return false
  if (!looksLikePlayerDisplayName(cleaned)) return false
  return true
}

export function isPlausibleGoalScorerName(name: string): boolean {
  return isPlausibleCardPlayerName(name)
}

export function cardColorFromHighlightText(raw: string): 'yellow' | 'red' {
  const u = raw.toLowerCase()
  if (
    u.includes('rouge') ||
    u.includes('red card') ||
    u.includes('2e jaune') ||
    u.includes('second yellow') ||
    u.includes('second_yellow')
  ) {
    return 'red'
  }
  return 'yellow'
}

/** Déduplication timeline : un carton par minute / camp / couleur. */
export function cardCoarseDedupeKey(
  h: Pick<Highlight, 'type' | 'minute' | 'side' | 'title' | 'detail' | 'scorerName'>,
): string | null {
  if (h.type !== 'Carton') return null
  const color = cardColorFromHighlightText(`${h.title ?? ''} ${h.detail ?? ''}`)
  const player =
    h.scorerName?.trim() ||
    parseCardPlayerName(`${h.title ?? ''} ${h.detail ?? ''}`) ||
    ''
  const playerKey = player ? slugScorer(compactScorerDisplayName(player)) : ''
  return `${h.minute}|${h.side ?? '?'}|${color}|${playerKey}`
}

/** Nom affiché carton (prénom + nom quand dispo). */
export function formatCardPlayerDisplayName(name: string): string {
  const cleaned = name.replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  const parts = cleaned.split(' ').filter(Boolean)
  if (parts.length >= 2) return cleaned
  return compactScorerDisplayName(cleaned)
}

/** Extrait le joueur depuis un libellé carton SM / FR / EN. */
export function parseCardPlayerName(raw: string): string | null {
  const s = raw.replace(/\s+/g, ' ').trim()
  if (!s) return null
  const patterns = [
    /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{1,48})\s+receives\s+(?:a\s+)?(?:yellow|red|second)/i,
    /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{1,48})\s+(?:reçoit|recoit)\s+(?:un\s+)?(?:carton|second)/i,
    /carton\s+(?:jaune|rouge)\s+(?:pour|à)\s+(.+?)(?:[.!]|$)/i,
    /(?:yellow|red)\s+card\s+(?:for|to)\s+(.+?)(?:[.!]|$)/i,
    /second\s+yellow\s+card\s+for\s+(.+?)(?:[.!]|$)/i,
    /(?:yellowcard|redcard)[^A-Za-zÀ-ÿ]*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{1,48})(?:[.!]|$)/i,
    /(?:foul(?:ed)?|fouls?)\s+(?:by|on|to)\s+(.+?)(?:[.!]|$)/i,
    /(?:faute|fautes)\s+(?:de|sur)\s+(.+?)(?:[.!]|$)/i,
    /after\s+(?:a|the)\s+foul\s+by\s+(.+?)(?:[.!]|$)/i,
    /(?:après\s+)?(?:une|la)\s+faute\s+de\s+(.+?)(?:[.!]|$)/i,
  ]
  for (const re of patterns) {
    const m = s.match(re)
    const name = m?.[1]?.replace(/\s+\d{1,2}['']?\s*$/u, '').trim()
    if (name && name.length >= 2 && isPlausibleCardPlayerName(name)) return name
  }
  return null
}

function resolveCardPlayerNameFromHighlight(
  h: Pick<Highlight, 'scorerName' | 'title' | 'detail'>,
  home: LiveGoalTeamHints,
  away: LiveGoalTeamHints,
): string | null {
  const raw = `${h.title ?? ''} ${h.detail ?? ''}`
  const candidates = [
    h.scorerName?.trim(),
    parseCardPlayerName(raw),
    parseCardPlayerName(String(h.detail ?? '')),
    parseCardPlayerName(String(h.title ?? '')),
  ].filter(Boolean) as string[]
  for (const candidate of candidates) {
    const displayName = compactScorerDisplayName(candidate)
    if (isMatchTeamLabel(displayName, home, away)) continue
    if (isPlausibleCardPlayerName(displayName)) return displayName
  }
  return null
}

export function parseLiveCardRowsFromHighlights(
  highlights: Highlight[],
  home: LiveGoalTeamHints,
  away: LiveGoalTeamHints,
): LiveCardDisplayRow[] {
  const out: LiveCardDisplayRow[] = []
  const seen = new Set<string>()

  for (const h of highlights) {
    if (h.type !== 'Carton') continue
    const name = resolveCardPlayerNameFromHighlight(h, home, away)
    if (!name) continue
    const raw = `${h.title ?? ''} ${h.detail ?? ''}`
    const minute = typeof h.minute === 'number' && Number.isFinite(h.minute) ? h.minute : 0
    const side = h.side ?? guessSideFromTeams(raw, home, away)
    if (!side) continue
    const color = cardColorFromHighlightText(raw)
    const key = `${side}:${color}:${slugScorer(name)}:${minute}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ side, name: compactScorerDisplayName(name), minute, inSecondHalf: h.inSecondHalf, color })
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
    if (!name || !isPlausibleGoalScorerName(name)) continue
    const slug = slugScorer(name)
    if (!slug) continue
    const side = h.side ?? guessSideFromTeams(raw, home, away)
    if (!side) continue
    const key = `${side}:${slug}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ side, slug, name })
  }
  return out
}

/** Regroupe les buts d'un même joueur (doublé, triplé…) pour l'affichage sous le score. */
export function groupGoalRowsForHeader(
  rows: { name: string; minute: number; inSecondHalf?: boolean; ownGoal?: boolean }[],
): { name: string; minutes: { minute: number; inSecondHalf?: boolean }[]; ownGoal?: boolean }[] {
  const groups: {
    name: string
    minutes: { minute: number; inSecondHalf?: boolean }[]
    ownGoal?: boolean
  }[] = []
  const indexByKey = new Map<string, number>()

  for (const row of rows) {
    const slug = slugScorer(row.name)
    const key = `${slug}|${row.ownGoal ? 'og' : 'g'}`
    const minuteEntry = { minute: row.minute, inSecondHalf: row.inSecondHalf }
    const existingIdx = indexByKey.get(key)
    if (existingIdx == null) {
      indexByKey.set(key, groups.length)
      groups.push({
        name: row.name,
        minutes: [minuteEntry],
        ownGoal: row.ownGoal,
      })
      continue
    }
    const group = groups[existingIdx]!
    const already = group.minutes.some(
      (m) => m.minute === minuteEntry.minute && Boolean(m.inSecondHalf) === Boolean(minuteEntry.inSecondHalf),
    )
    if (!already) group.minutes.push(minuteEntry)
  }

  for (const group of groups) {
    group.minutes.sort((a, b) => a.minute - b.minute)
  }
  return groups
}

/** Métadonnées compos SM pour calibrer la cote buteur (poste + terrain). */
export type ScorerLineupMeta = {
  formationPosition?: number
  formationField?: string
  /** Titulaire annoncé ; remplaçants / banc → false (cote plus haute). */
  isStarter?: boolean
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
      isStarter: meta?.isStarter !== false,
      formationPosition: meta?.formationPosition,
    },
    attack,
    alreadyScored,
    { liveMinute: opts?.liveMinute },
  )
}
